from __future__ import annotations

from datetime import datetime, timedelta
import re
from uuid import uuid4

from app.db.mongo import get_database
from app.schemas.chat import (
    ChatMessageResponse,
    ChatReplyPayload,
    ChatProductPagination,
    IntentResult,
    QuickActionCard,
    StartSessionRequest,
    StartSessionResponse,
)
from app.services.gemini_service import gemini_service
from app.services.commerce_client import commerce_client
from app.services.intent_router import IntentRouter
from app.services.product_browse_service import product_browse_service

QUICK_ACTIONS: list[QuickActionCard] = [
    QuickActionCard(
        key='browse_cakes',
        title='Browse Cakes',
        description='Explore available cake categories and products.',
        message='Browse Cakes',
        flow='browse_products',
        route_path='/products',
    ),
    QuickActionCard(
        key='track_order',
        title='Track Order',
        description='Check your current order status and delivery progress.',
        message='Track Order',
        flow='track_order',
        route_path='/profile?tab=orders',
    ),
    QuickActionCard(
        key='custom_cake_order',
        title='Custom Cake Order',
        description='Start a custom cake request with your design details.',
        message='Custom Cake Order',
        flow='custom_order',
        route_path='/bulk-order',
    ),
    QuickActionCard(
        key='talk_to_support',
        title='Talk to Support',
        description='Connect with a human support assistant.',
        message='Talk to Support',
        flow='human_support',
        route_path='/about',
    ),
]

FLOW_SAMPLE_MESSAGES: dict[str, list[str]] = {
    'browse_products': [
        'Show chocolate cakes',
        'Show birthday cakes',
        'Show cakes under $20',
        'What categories are available?',
    ],
    'browse_categories': [
        'What categories are available?',
        'Show birthday cakes',
        'Show wedding cakes',
    ],
    'track_order': [
        'Track my latest order',
        'Order ID ORD-ABC123 status',
        'Show my delivery updates',
    ],
    'custom_order': [
        'I need a 2-tier birthday cake',
        'I want to upload a reference cake image',
        'Need custom design for 30 people',
    ],
    'human_support': [
        'Connect me to support',
        'I need help with payment',
        'I have an urgent delivery issue',
    ],
    'chat_order': [
        'Order this cake',
        'Quantity 2',
        '2026-03-20',
        'Pay cash on delivery',
    ],
}

FLOW_ROUTE_MAP = {
    'browse_products': '',
    'browse_categories': '',
    'track_order': '/profile?tab=orders',
    'custom_order': '/bulk-order',
    'human_support': '/about',
    'chat_order': '',
}

ORDER_ID_PATTERN = re.compile(r'\bORD-[A-Z0-9-]+\b', re.IGNORECASE)
ORDER_PRODUCT_PATTERN = re.compile(r'ORDER_PRODUCT:([a-f0-9]{24})', re.IGNORECASE)
ORDER_QUANTITY_PATTERN = re.compile(r'ORDER_QTY:(\d+)', re.IGNORECASE)
ORDER_PAYMENT_PATTERN = re.compile(r'ORDER_PAYMENT:(online|cash_on_delivery)', re.IGNORECASE)
ORDER_CONFIRM_PATTERN = re.compile(r'ORDER_CONFIRM:(yes|cancel)', re.IGNORECASE)
TRACK_ORDER_SELECT_PATTERN = re.compile(r'TRACK_ORDER:([A-Z0-9-]+)', re.IGNORECASE)


class ChatService:
    def __init__(self) -> None:
        self.intent_router = IntentRouter()

    async def start_session(self, user_id: str, payload: StartSessionRequest) -> StartSessionResponse:
        db = get_database()
        session_id = f"CHAT-{uuid4().hex[:10].upper()}"
        now = datetime.utcnow()

        await db.chat_sessions.insert_one(
            {
                'sessionId': session_id,
                'userId': user_id,
                'status': 'active',
                'channel': payload.channel,
                'locale': payload.locale,
                'context': {
                    'entryPoint': payload.context.entry_point,
                    'currentIntent': 'greeting',
                },
                'fallbackCount': 0,
                'handedOffToSupport': False,
                'createdAt': now,
                'updatedAt': now,
            }
        )

        await self._save_message(session_id, 'bot', 'text', 'Session started')

        return StartSessionResponse(
            session_id=session_id,
            status='active',
            welcome_message=(
                'Welcome to Cake House. Choose an option to get started quickly: '
                'Browse Cakes, Track Order, Custom Cake Order, or Talk to Support.'
            ),
            quick_replies=[item.title for item in QUICK_ACTIONS],
            quick_actions=QUICK_ACTIONS,
        )

    async def handle_message(
        self,
        user_id: str,
        session_id: str,
        text: str,
        authorization_header: str | None = None,
    ) -> ChatMessageResponse:
        db = get_database()
        session = await db.chat_sessions.find_one({'sessionId': session_id, 'userId': user_id})
        if not session:
            raise ValueError('Session not found')

        await self._save_message(session_id, 'user', 'text', text)

        token = self._extract_bearer_token(authorization_header)
        current_order_state = self._get_order_state(session)

        if current_order_state and current_order_state.get('step') not in {'completed', 'cancelled'}:
            reply = await self._handle_chat_order_step(
                user_id=user_id,
                session_id=session_id,
                incoming_text=text,
                order_state=current_order_state,
                token=token,
            )
            await self._save_message(
                session_id,
                'bot',
                reply.message_type,
                reply.text,
                payload={
                    'flow': reply.flow,
                    'routePath': reply.route_path,
                    'products': [self._to_jsonable(product) for product in reply.products],
                    'productPagination': reply.product_pagination.model_dump(),
                    'sampleMessages': reply.sample_messages,
                },
            )
            await db.chat_sessions.update_one(
                {'sessionId': session_id},
                {'$set': {'context.currentIntent': 'chat_order', 'updatedAt': datetime.utcnow()}},
            )
            return ChatMessageResponse(
                reply=reply,
                intent=IntentResult(name='chat_order', confidence=0.99),
                fallback=False,
            )

        explicit_product_id = self._extract_order_product_id(text)
        if explicit_product_id:
            reply = await self._start_chat_order_flow(
                session_id=session_id,
                product_id=explicit_product_id,
                token=token,
            )
            await self._save_message(
                session_id,
                'bot',
                reply.message_type,
                reply.text,
                payload={
                    'flow': reply.flow,
                    'routePath': reply.route_path,
                    'products': [self._to_jsonable(product) for product in reply.products],
                    'productPagination': reply.product_pagination.model_dump(),
                    'sampleMessages': reply.sample_messages,
                },
            )
            await db.chat_sessions.update_one(
                {'sessionId': session_id},
                {'$set': {'context.currentIntent': 'chat_order', 'updatedAt': datetime.utcnow()}},
            )
            return ChatMessageResponse(
                reply=reply,
                intent=IntentResult(name='chat_order', confidence=0.99),
                fallback=False,
            )

        explicit_track_order_id = self._extract_track_order_id(text) or self._extract_order_id(text) or ''
        if explicit_track_order_id:
            reply = await self._reply_with_order_tracking(explicit_track_order_id, token)
            await self._save_message(
                session_id,
                'bot',
                reply.message_type,
                reply.text,
                payload={
                    'flow': reply.flow,
                    'routePath': reply.route_path,
                    'products': [self._to_jsonable(product) for product in reply.products],
                    'productPagination': reply.product_pagination.model_dump(),
                    'sampleMessages': reply.sample_messages,
                },
            )
            await db.chat_sessions.update_one(
                {'sessionId': session_id},
                {'$set': {'context.currentIntent': 'track_order', 'updatedAt': datetime.utcnow()}},
            )
            return ChatMessageResponse(
                reply=reply,
                intent=IntentResult(name='track_order', confidence=0.99),
                fallback=False,
            )

        intent_name, confidence = self.intent_router.detect(text)

        reply = ChatReplyPayload(text='')
        fallback = False

        if intent_name == 'browse_products':
            search_result = await product_browse_service.search_by_message(text, limit=5, page=1)
            products = search_result.get('items') or []
            filters = search_result.get('filters') or {}
            category_name = filters.get('category_name') or ''
            keyword = filters.get('keyword') or ''
            max_price = filters.get('max_price')
            min_price = filters.get('min_price')
            has_filters = bool(category_name or keyword or max_price is not None or min_price is not None)

            if not has_filters:
                categories = await product_browse_service.get_categories(limit=8)
                category_cards = self._build_category_cards(categories)
                category_names = self._format_categories_with_counts(categories, max_items=8)
                reply = ChatReplyPayload(
                    text=(
                        f'Here are available categories: {category_names}. '
                        'Tap a category card below to view products.'
                    ),
                    message_type='text',
                    flow='browse_categories',
                    route_path='',
                    products=[],
                    quick_replies=[f"Show {category['name']} cakes" for category in categories[:3]] or ['Show chocolate cakes'],
                    sample_messages=FLOW_SAMPLE_MESSAGES['browse_categories'],
                    action_cards=category_cards or QUICK_ACTIONS,
                )
            elif products:
                filter_parts = []
                if category_name:
                    filter_parts.append(f'category: {category_name}')
                if keyword:
                    filter_parts.append(f'keyword: {keyword}')
                if max_price is not None:
                    filter_parts.append(f'price <= ${max_price:g}')
                if min_price is not None:
                    filter_parts.append(f'price >= ${min_price:g}')
                filter_text = f" ({', '.join(filter_parts)})" if filter_parts else ''
                pagination = self._build_product_pagination(search_result, filters)

                reply = ChatReplyPayload(
                    text=(
                        f'Here are {len(products)} matching cakes{filter_text}. '
                        f"Page {pagination.page} of {max(pagination.total_pages, 1)}."
                    ),
                    message_type='product_cards',
                    flow='browse_products',
                    route_path=FLOW_ROUTE_MAP['browse_products'],
                    products=products[:5],
                    product_pagination=pagination,
                    quick_replies=['Show more cakes', 'Show birthday cakes', 'Show cakes under $20'],
                    sample_messages=FLOW_SAMPLE_MESSAGES['browse_products'],
                    action_cards=QUICK_ACTIONS,
                )
            else:
                categories = await product_browse_service.get_categories(limit=8)
                category_names = self._format_categories_with_counts(categories, max_items=6)
                reply = ChatReplyPayload(
                    text=(
                        'No cakes matched your filter right now. '
                        f'Available categories: {category_names}. Try another keyword or a higher price range.'
                    ),
                    message_type='text',
                    flow='browse_products',
                    route_path='',
                    products=[],
                    quick_replies=['Show chocolate cakes', 'Show birthday cakes', 'What categories are available?'],
                    sample_messages=FLOW_SAMPLE_MESSAGES['browse_products'],
                    action_cards=QUICK_ACTIONS,
                )
        elif intent_name == 'browse_categories':
            categories = await product_browse_service.get_categories(limit=10)
            category_cards = self._build_category_cards(categories)
            category_names = self._format_categories_with_counts(categories, max_items=8)
            reply = ChatReplyPayload(
                text=(
                    f'Available cake categories: {category_names}. '
                    'Tap a category card below to list products in that category.'
                ),
                message_type='text',
                flow='browse_categories',
                route_path='',
                products=[],
                quick_replies=['Show birthday cakes', 'Show chocolate cakes', 'Show cakes under $20'],
                sample_messages=FLOW_SAMPLE_MESSAGES['browse_categories'],
                action_cards=category_cards or QUICK_ACTIONS,
            )
        elif intent_name == 'chat_order':
            reply = ChatReplyPayload(
                text='Pick a cake first, then tap "Order Now" on the product card to continue checkout in chat.',
                message_type='text',
                flow='chat_order',
                route_path='/products',
                quick_replies=['Browse Cakes', 'Show chocolate cakes', 'Show birthday cakes'],
                sample_messages=FLOW_SAMPLE_MESSAGES['chat_order'],
                action_cards=QUICK_ACTIONS,
            )
        elif intent_name == 'custom_order':
            reply = ChatReplyPayload(
                text='Great. Let us start your custom cake order with image upload and design details.',
                message_type='text',
                flow='custom_order',
                route_path=FLOW_ROUTE_MAP['custom_order'],
                quick_replies=['Upload image', 'Need human support'],
                sample_messages=FLOW_SAMPLE_MESSAGES['custom_order'],
                action_cards=QUICK_ACTIONS,
            )
        elif intent_name == 'track_order':
            reply = await self._reply_with_active_orders(token)
        elif intent_name == 'human_support':
            reply = ChatReplyPayload(
                text='Support flow selected. I can connect you to a human agent now.',
                message_type='text',
                flow='human_support',
                route_path=FLOW_ROUTE_MAP['human_support'],
                quick_replies=['Connect me', 'Continue with bot'],
                sample_messages=FLOW_SAMPLE_MESSAGES['human_support'],
                action_cards=QUICK_ACTIONS,
            )
        else:
            ai_text = await gemini_service.generate_reply(text)
            fallback = 'temporary AI issue' in ai_text.lower()
            reply = ChatReplyPayload(
                text=ai_text,
                message_type='text',
                flow='general_chat',
                action_cards=QUICK_ACTIONS,
            )

        await self._save_message(
            session_id,
            'bot',
            reply.message_type,
            reply.text,
            payload={
                'flow': reply.flow,
                'routePath': reply.route_path,
                'products': [self._to_jsonable(product) for product in reply.products],
                'productPagination': reply.product_pagination.model_dump(),
                'sampleMessages': reply.sample_messages,
            },
        )

        await db.chat_sessions.update_one(
            {'sessionId': session_id},
            {
                '$set': {
                    'context.currentIntent': intent_name,
                    'updatedAt': datetime.utcnow(),
                },
                '$inc': {'fallbackCount': 1 if fallback else 0},
            },
        )

        return ChatMessageResponse(
            reply=reply,
            intent=IntentResult(name=intent_name, confidence=confidence),
            fallback=fallback,
        )

    @staticmethod
    def _extract_order_id(text: str) -> str | None:
        match = ORDER_ID_PATTERN.search(text or '')
        return match.group(0) if match else None

    @staticmethod
    def _build_category_cards(categories: list[dict]) -> list[QuickActionCard]:
        cards: list[QuickActionCard] = []
        for category in categories[:8]:
            name = str(category.get('name') or '').strip()
            if not name:
                continue
            cards.append(
                QuickActionCard(
                    key=f"category_{name.lower().replace(' ', '_')}",
                    title=f"{name} Cakes",
                    description=(
                        f"{int(category.get('product_count') or 0)} products available"
                        if int(category.get('product_count') or 0) > 0
                        else (category.get('description') or 'Browse this category')
                    ),
                    message=f"Show {name} cakes",
                    flow='browse_products',
                    route_path='',
                )
            )
        return cards

    @staticmethod
    def _format_categories_with_counts(categories: list[dict], max_items: int = 8) -> str:
        if not categories:
            return 'No categories available yet'
        parts = []
        for category in categories[:max_items]:
            name = str(category.get('name') or '').strip()
            if not name:
                continue
            count = int(category.get('product_count') or 0)
            parts.append(f'{name} ({count})')
        return ', '.join(parts) if parts else 'No categories available yet'

    @staticmethod
    def _build_product_pagination(search_result: dict, filters: dict) -> ChatProductPagination:
        return ChatProductPagination(
            page=int(search_result.get('page') or 1),
            limit=int(search_result.get('limit') or 5),
            total=int(search_result.get('total') or 0),
            total_pages=int(search_result.get('total_pages') or 0),
            has_prev=bool(search_result.get('has_prev') or False),
            has_next=bool(search_result.get('has_next') or False),
            category=str(filters.get('category_name') or ''),
            keyword=str(filters.get('keyword') or ''),
            min_price=filters.get('min_price'),
            max_price=filters.get('max_price'),
        )

    @staticmethod
    def _extract_bearer_token(authorization_header: str | None) -> str:
        if not authorization_header:
            return ''
        if not authorization_header.lower().startswith('bearer '):
            return ''
        return authorization_header.split(' ', 1)[1].strip()

    @staticmethod
    def _get_order_state(session: dict) -> dict:
        return dict((session.get('context') or {}).get('chatOrder') or {})

    async def _set_order_state(self, session_id: str, order_state: dict) -> None:
        db = get_database()
        await db.chat_sessions.update_one(
            {'sessionId': session_id},
            {'$set': {'context.chatOrder': order_state, 'updatedAt': datetime.utcnow()}},
        )

    async def _clear_order_state(self, session_id: str) -> None:
        db = get_database()
        await db.chat_sessions.update_one(
            {'sessionId': session_id},
            {'$unset': {'context.chatOrder': ''}, '$set': {'updatedAt': datetime.utcnow()}},
        )

    @staticmethod
    def _extract_order_product_id(text: str) -> str:
        match = ORDER_PRODUCT_PATTERN.search(text or '')
        return str(match.group(1)).strip() if match else ''

    @staticmethod
    def _extract_track_order_id(text: str) -> str:
        match = TRACK_ORDER_SELECT_PATTERN.search(text or '')
        return str(match.group(1)).strip().upper() if match else ''

    @staticmethod
    def _format_status_label(status: str) -> str:
        return str(status or 'pending').replace('_', ' ').title()

    async def _reply_with_active_orders(self, token: str) -> ChatReplyPayload:
        if not token:
            return ChatReplyPayload(
                text='Please log in first to track orders from chat.',
                message_type='text',
                flow='track_order',
                route_path='/login',
                quick_replies=['Login', 'Browse Cakes'],
                sample_messages=FLOW_SAMPLE_MESSAGES['track_order'],
                action_cards=QUICK_ACTIONS,
            )

        try:
            orders = await commerce_client.list_orders(token, page=1, limit=50)
        except ValueError as exc:
            return ChatReplyPayload(
                text=str(exc),
                message_type='text',
                flow='track_order',
                route_path='',
                quick_replies=['Track my latest order', 'Browse Cakes'],
                sample_messages=FLOW_SAMPLE_MESSAGES['track_order'],
                action_cards=QUICK_ACTIONS,
            )

        active_orders = [
            order for order in orders
            if str(order.get('status') or order.get('orderStatus') or '').lower() not in {'delivered', 'cancelled'}
        ]

        if not active_orders:
            return ChatReplyPayload(
                text='You have no active orders right now. Completed or cancelled orders are hidden here.',
                message_type='text',
                flow='track_order',
                route_path='',
                quick_replies=['Browse Cakes', 'Track my latest order'],
                sample_messages=FLOW_SAMPLE_MESSAGES['track_order'],
                action_cards=QUICK_ACTIONS,
            )

        order_cards = self._build_track_order_cards(active_orders)
        return ChatReplyPayload(
            text='Select an active order to view its current status.',
            message_type='text',
            flow='track_order',
            route_path='',
            quick_replies=[f"TRACK_ORDER:{order.get('orderId', '')}" for order in active_orders[:3] if order.get('orderId')],
            sample_messages=FLOW_SAMPLE_MESSAGES['track_order'],
            action_cards=order_cards,
        )

    async def _reply_with_order_tracking(self, order_id: str, token: str) -> ChatReplyPayload:
        if not token:
            return ChatReplyPayload(
                text='Please log in first to view order tracking.',
                message_type='text',
                flow='track_order',
                route_path='/login',
                quick_replies=['Login', 'Browse Cakes'],
                sample_messages=FLOW_SAMPLE_MESSAGES['track_order'],
                action_cards=QUICK_ACTIONS,
            )

        try:
            tracking_payload = await commerce_client.get_order_tracking(token, order_id)
        except ValueError as exc:
            return ChatReplyPayload(
                text=str(exc),
                message_type='text',
                flow='track_order',
                route_path='',
                quick_replies=['Track Order', 'Browse Cakes'],
                sample_messages=FLOW_SAMPLE_MESSAGES['track_order'],
                action_cards=QUICK_ACTIONS,
            )

        tracking = tracking_payload.get('tracking') or {}
        status = str(tracking.get('status') or '').lower()
        order_identifier = str(tracking.get('orderId') or order_id).upper()
        delivery_date = self._format_delivery_date(str(tracking.get('deliveryDate') or ''))
        payment_method = str(tracking.get('paymentMethod') or '')

        return ChatReplyPayload(
            text=(
                f"Order {order_identifier} status: {self._format_status_label(status)}. "
                f"Delivery date: {delivery_date or 'TBD'}. "
                f"Payment: {self._format_status_label(payment_method)}."
            ),
            message_type='text',
            flow='track_order',
            route_path='',
            quick_replies=['Track Order', 'Browse Cakes'],
            sample_messages=FLOW_SAMPLE_MESSAGES['track_order'],
            action_cards=QUICK_ACTIONS,
        )

    def _build_track_order_cards(self, orders: list[dict]) -> list[QuickActionCard]:
        cards: list[QuickActionCard] = []
        for order in orders[:8]:
            order_id = str(order.get('orderId') or '').strip().upper()
            if not order_id:
                continue
            status = str(order.get('status') or order.get('orderStatus') or '').lower()
            total = float(order.get('totalAmount') or order.get('total') or 0)
            cards.append(
                QuickActionCard(
                    key=f"track_{order_id.lower().replace('-', '_')}",
                    title=order_id,
                    description=f"{self._format_status_label(status)} | ${total:.2f}",
                    message=f'TRACK_ORDER:{order_id}',
                    flow='track_order',
                    route_path='',
                )
            )
        return cards

    @staticmethod
    def _format_delivery_date(raw_value: str) -> str:
        value = str(raw_value or '').strip()
        if not value:
            return ''
        if len(value) >= 10 and re.match(r'^\d{4}-\d{2}-\d{2}', value):
            return value[:10]
        return value

    @staticmethod
    def _parse_quantity(text: str) -> int:
        message = str(text or '').strip()
        tagged_match = ORDER_QUANTITY_PATTERN.search(message)
        if tagged_match:
            return int(tagged_match.group(1))

        numeric_match = re.search(r'\b(\d+)\b', message)
        if numeric_match:
            return int(numeric_match.group(1))
        return 0

    @staticmethod
    def _parse_payment_method(text: str) -> str:
        message = str(text or '').strip().lower()
        tagged = ORDER_PAYMENT_PATTERN.search(message)
        if tagged:
            return tagged.group(1)
        if 'cash' in message or 'cod' in message:
            return 'cash_on_delivery'
        if 'online' in message or 'card' in message:
            return 'online'
        return ''

    @staticmethod
    def _parse_confirmation(text: str) -> str:
        message = str(text or '').strip().lower()
        tagged = ORDER_CONFIRM_PATTERN.search(message)
        if tagged:
            return tagged.group(1)
        if message in {'yes', 'confirm', 'place order', 'submit'}:
            return 'yes'
        if message in {'cancel', 'no', 'stop'}:
            return 'cancel'
        return ''

    @staticmethod
    def _parse_delivery_date(text: str) -> str:
        message = str(text or '').strip()
        match = re.search(r'(\d{4}-\d{2}-\d{2})', message)
        if not match:
            return ''
        candidate = match.group(1)
        try:
            date_obj = datetime.strptime(candidate, '%Y-%m-%d')
        except ValueError:
            return ''
        today = datetime.utcnow().date()
        if date_obj.date() < today:
            return ''
        return candidate

    @staticmethod
    def _parse_address(text: str) -> dict:
        raw = str(text or '').strip()
        if not raw:
            return {}
        parts = [part.strip() for part in raw.split(',') if part.strip()]
        if len(parts) < 2:
            return {}
        return {
            'label': 'Home',
            'street': parts[0],
            'city': parts[1],
            'state': parts[2] if len(parts) > 2 else '',
            'zipCode': parts[3] if len(parts) > 3 else '',
            'country': 'Sri Lanka',
        }

    @staticmethod
    def _parse_delivery_slot(text: str) -> str:
        value = str(text or '').strip()
        if not value:
            return ''
        if len(value) > 80:
            return ''
        return value

    @staticmethod
    def _build_quantity_cards(max_stock: int) -> list[QuickActionCard]:
        upper = min(max(1, max_stock), 5)
        return [
            QuickActionCard(
                key=f'order_qty_{qty}',
                title=f'Quantity {qty}',
                description='Select quantity',
                message=f'ORDER_QTY:{qty}',
                flow='chat_order',
                route_path='',
            )
            for qty in range(1, upper + 1)
        ]

    @staticmethod
    def _build_payment_cards() -> list[QuickActionCard]:
        return [
            QuickActionCard(
                key='order_payment_online',
                title='Online Payment',
                description='Pay now by card or online',
                message='ORDER_PAYMENT:online',
                flow='chat_order',
                route_path='',
            ),
            QuickActionCard(
                key='order_payment_cod',
                title='Cash on Delivery',
                description='Pay when order arrives',
                message='ORDER_PAYMENT:cash_on_delivery',
                flow='chat_order',
                route_path='',
            ),
        ]

    @staticmethod
    def _build_confirmation_cards() -> list[QuickActionCard]:
        return [
            QuickActionCard(
                key='order_confirm_yes',
                title='Confirm Order',
                description='Submit this order now',
                message='ORDER_CONFIRM:yes',
                flow='chat_order',
                route_path='',
            ),
            QuickActionCard(
                key='order_confirm_cancel',
                title='Cancel',
                description='Cancel this chatbot order flow',
                message='ORDER_CONFIRM:cancel',
                flow='chat_order',
                route_path='',
            ),
        ]

    async def _start_chat_order_flow(self, session_id: str, product_id: str, token: str) -> ChatReplyPayload:
        if not token:
            return ChatReplyPayload(
                text='Please log in first to place an order through chatbot.',
                message_type='text',
                flow='chat_order',
                route_path='/login',
                quick_replies=['Login', 'Browse Cakes'],
                sample_messages=FLOW_SAMPLE_MESSAGES['chat_order'],
                action_cards=QUICK_ACTIONS,
            )

        product = await product_browse_service.get_product_by_id(product_id)
        if not product:
            return ChatReplyPayload(
                text='That product is unavailable now. Please choose another cake.',
                message_type='text',
                flow='chat_order',
                route_path='',
                quick_replies=['Browse Cakes', 'Show birthday cakes', 'Show chocolate cakes'],
                sample_messages=FLOW_SAMPLE_MESSAGES['browse_products'],
                action_cards=QUICK_ACTIONS,
            )

        stock = int(product.get('stock_quantity') or 0)
        if stock <= 0:
            return ChatReplyPayload(
                text='That cake is currently out of stock. Please choose another one.',
                message_type='text',
                flow='chat_order',
                route_path='',
                quick_replies=['Browse Cakes', 'Show cakes under $20'],
                sample_messages=FLOW_SAMPLE_MESSAGES['browse_products'],
                action_cards=QUICK_ACTIONS,
            )

        order_state = {
            'step': 'awaiting_quantity',
            'product_id': product['product_id'],
            'product_name': product['name'],
            'unit_price': float(product.get('price') or 0),
            'image': product.get('image') or '',
            'quantity': 0,
            'max_stock': stock,
            'delivery_date': '',
            'delivery_slot': '',
            'address': {},
            'payment_method': '',
            'notes': '',
        }
        await self._set_order_state(session_id, order_state)

        return ChatReplyPayload(
            text=(
                f"Great choice: {order_state['product_name']} at ${order_state['unit_price']:.2f} each. "
                f'Available stock: {stock}. Select quantity.'
            ),
            message_type='text',
            flow='chat_order',
            route_path='',
            quick_replies=['1', '2', '3'],
            sample_messages=FLOW_SAMPLE_MESSAGES['chat_order'],
            action_cards=self._build_quantity_cards(stock),
        )

    async def _handle_chat_order_step(
        self,
        *,
        user_id: str,
        session_id: str,
        incoming_text: str,
        order_state: dict,
        token: str,
    ) -> ChatReplyPayload:
        step = str(order_state.get('step') or '')
        if not token:
            await self._clear_order_state(session_id)
            return ChatReplyPayload(
                text='Your login session is missing. Please log in and start checkout again.',
                message_type='text',
                flow='chat_order',
                route_path='/login',
                quick_replies=['Login', 'Browse Cakes'],
                sample_messages=FLOW_SAMPLE_MESSAGES['chat_order'],
                action_cards=QUICK_ACTIONS,
            )

        if step == 'awaiting_quantity':
            quantity = self._parse_quantity(incoming_text)
            if quantity < 1:
                return ChatReplyPayload(
                    text='Please enter a valid quantity (for example: 1, 2, or 3).',
                    message_type='text',
                    flow='chat_order',
                    action_cards=self._build_quantity_cards(int(order_state.get('max_stock') or 1)),
                )
            if quantity > int(order_state.get('max_stock') or 0):
                return ChatReplyPayload(
                    text=(
                        f"Only {int(order_state.get('max_stock') or 0)} items are available. "
                        'Please choose a lower quantity.'
                    ),
                    message_type='text',
                    flow='chat_order',
                    action_cards=self._build_quantity_cards(int(order_state.get('max_stock') or 1)),
                )

            order_state['quantity'] = quantity
            order_state['step'] = 'awaiting_delivery_date'
            await self._set_order_state(session_id, order_state)
            tomorrow = (datetime.utcnow() + timedelta(days=1)).strftime('%Y-%m-%d')
            return ChatReplyPayload(
                text=(
                    'Please enter delivery date in YYYY-MM-DD format. '
                    f'Example: {tomorrow}.'
                ),
                message_type='text',
                flow='chat_order',
                quick_replies=[tomorrow],
            )

        if step == 'awaiting_delivery_date':
            delivery_date = self._parse_delivery_date(incoming_text)
            if not delivery_date:
                return ChatReplyPayload(
                    text='Invalid date. Please send a valid future date in YYYY-MM-DD format.',
                    message_type='text',
                    flow='chat_order',
                )

            order_state['delivery_date'] = delivery_date
            order_state['step'] = 'awaiting_delivery_slot'
            await self._set_order_state(session_id, order_state)
            return ChatReplyPayload(
                text='Please enter delivery time slot (example: 10:00-12:00 AM or 6:00-8:00 PM).',
                message_type='text',
                flow='chat_order',
                quick_replies=['10:00-12:00 AM', '2:00-4:00 PM', '6:00-8:00 PM'],
            )

        if step == 'awaiting_delivery_slot':
            delivery_slot = self._parse_delivery_slot(incoming_text)
            if not delivery_slot:
                return ChatReplyPayload(
                    text='Please enter a valid delivery time slot.',
                    message_type='text',
                    flow='chat_order',
                    quick_replies=['10:00-12:00 AM', '2:00-4:00 PM', '6:00-8:00 PM'],
                )

            order_state['delivery_slot'] = delivery_slot
            order_state['step'] = 'awaiting_address'
            await self._set_order_state(session_id, order_state)
            return ChatReplyPayload(
                text='Please enter delivery address as: Street, City, State, ZIP.',
                message_type='text',
                flow='chat_order',
                quick_replies=['12 Flower Road, Colombo, Western, 00500'],
            )

        if step == 'awaiting_address':
            address = self._parse_address(incoming_text)
            if not address:
                return ChatReplyPayload(
                    text='Address format is invalid. Please use: Street, City, State, ZIP.',
                    message_type='text',
                    flow='chat_order',
                )

            order_state['address'] = address
            order_state['step'] = 'awaiting_payment'
            await self._set_order_state(session_id, order_state)
            return ChatReplyPayload(
                text='Choose your payment method.',
                message_type='text',
                flow='chat_order',
                action_cards=self._build_payment_cards(),
                quick_replies=['Online Payment', 'Cash on Delivery'],
            )

        if step == 'awaiting_payment':
            payment_method = self._parse_payment_method(incoming_text)
            if not payment_method:
                return ChatReplyPayload(
                    text='Please choose Online Payment or Cash on Delivery.',
                    message_type='text',
                    flow='chat_order',
                    action_cards=self._build_payment_cards(),
                )

            order_state['payment_method'] = payment_method
            preview_payload = {
                'productId': order_state.get('product_id'),
                'quantity': int(order_state.get('quantity') or 0),
                'paymentMethod': payment_method,
                'deliveryDate': order_state.get('delivery_date'),
                'deliverySlot': order_state.get('delivery_slot') or '',
                'address': order_state.get('address') or {},
            }
            try:
                preview = await commerce_client.preview_chatbot_order(preview_payload, token)
            except ValueError as exc:
                return ChatReplyPayload(
                    text=str(exc),
                    message_type='text',
                    flow='chat_order',
                    action_cards=self._build_payment_cards(),
                )

            preview_data = (preview or {}).get('preview') or {}
            order_state['pricing'] = {
                'subtotal': float(preview_data.get('subtotal') or 0),
                'tax': float(preview_data.get('tax') or 0),
                'shipping': float(preview_data.get('shipping') or 0),
                'totalAmount': float(preview_data.get('totalAmount') or 0),
            }
            order_state['step'] = 'awaiting_confirmation'
            await self._set_order_state(session_id, order_state)

            address = order_state.get('address') or {}
            summary = (
                f"Please confirm your order:\n"
                f"- Product: {order_state.get('product_name')}\n"
                f"- Quantity: {order_state.get('quantity')}\n"
                f"- Delivery Date: {order_state.get('delivery_date')}\n"
                f"- Delivery Slot: {order_state.get('delivery_slot')}\n"
                f"- Address: {address.get('street', '')}, {address.get('city', '')}\n"
                f"- Payment: {'Online Payment' if payment_method == 'online' else 'Cash on Delivery'}\n"
                f"- Total: ${float(order_state['pricing'].get('totalAmount') or 0):.2f}"
            )

            return ChatReplyPayload(
                text=summary,
                message_type='text',
                flow='chat_order',
                action_cards=self._build_confirmation_cards(),
                quick_replies=['Confirm Order', 'Cancel'],
            )

        if step == 'awaiting_confirmation':
            decision = self._parse_confirmation(incoming_text)
            if decision == 'cancel':
                await self._clear_order_state(session_id)
                return ChatReplyPayload(
                    text='Order flow cancelled. You can start again anytime.',
                    message_type='text',
                    flow='chat_order',
                    action_cards=QUICK_ACTIONS,
                )
            if decision != 'yes':
                return ChatReplyPayload(
                    text='Please choose Confirm Order or Cancel.',
                    message_type='text',
                    flow='chat_order',
                    action_cards=self._build_confirmation_cards(),
                )

            place_payload = {
                'productId': order_state.get('product_id'),
                'quantity': int(order_state.get('quantity') or 0),
                'paymentMethod': order_state.get('payment_method'),
                'deliveryDate': order_state.get('delivery_date'),
                'deliverySlot': order_state.get('delivery_slot') or '',
                'address': order_state.get('address') or {},
                'notes': order_state.get('notes') or '',
            }
            try:
                order_response = await commerce_client.place_chatbot_order(place_payload, token)
            except ValueError as exc:
                order_state['step'] = 'awaiting_payment'
                await self._set_order_state(session_id, order_state)
                return ChatReplyPayload(
                    text=f'{exc} Please re-check payment method and confirm again.',
                    message_type='text',
                    flow='chat_order',
                    action_cards=self._build_payment_cards(),
                )

            await self._clear_order_state(session_id)
            confirmation = (order_response or {}).get('confirmation') or {}
            order_id = str(confirmation.get('orderId') or '')
            total_amount = float(confirmation.get('totalAmount') or 0)
            return ChatReplyPayload(
                text=(
                    f'Order placed successfully. Order ID: {order_id}. '
                    f'Total: ${total_amount:.2f}.'
                ),
                message_type='text',
                flow='chat_order',
                route_path=f'/orders/{order_id}/tracking' if order_id else '/profile?tab=orders',
                quick_replies=['Track Order', 'Browse Cakes'],
                action_cards=QUICK_ACTIONS,
            )

        await self._clear_order_state(session_id)
        return ChatReplyPayload(
            text='Let us start checkout again. Tap Order Now on a product card.',
            message_type='text',
            flow='chat_order',
            action_cards=QUICK_ACTIONS,
        )

    async def _save_message(
        self,
        session_id: str,
        sender: str,
        message_type: str,
        text: str,
        payload: dict | None = None,
    ) -> None:
        db = get_database()
        await db.chat_messages.insert_one(
            {
                'sessionId': session_id,
                'sender': sender,
                'messageType': message_type,
                'text': text,
                'payload': payload or {},
                'createdAt': datetime.utcnow(),
            }
        )

    @staticmethod
    def _to_jsonable(value):
        if value is None:
            return None
        if hasattr(value, 'model_dump'):
            return value.model_dump()
        if isinstance(value, list):
            return [ChatService._to_jsonable(item) for item in value]
        if isinstance(value, dict):
            return {key: ChatService._to_jsonable(item) for key, item in value.items()}
        return value


chat_service = ChatService()
