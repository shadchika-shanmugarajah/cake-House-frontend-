from __future__ import annotations

import math
import re
from typing import Any

from app.db.mongo import get_database

MAX_PRICE_PATTERN = re.compile(r'(?:under|below|less than|<=?)\s*\$?\s*(\d+(?:\.\d+)?)', re.IGNORECASE)
MIN_PRICE_PATTERN = re.compile(r'(?:over|above|more than|>=?)\s*\$?\s*(\d+(?:\.\d+)?)', re.IGNORECASE)
GENERIC_TOKENS = {
    'browse',
    'show',
    'what',
    'which',
    'are',
    'available',
    'cakes',
    'cake',
    'category',
    'categories',
    'find',
    'me',
    'with',
    'for',
    'under',
    'below',
    'over',
    'above',
    'less',
    'than',
    'more',
    'price',
    'please',
}


class ProductBrowseService:
    @staticmethod
    def _active_or_missing_filter() -> dict[str, Any]:
        # Treat missing isActive as active for legacy seed data.
        return {'$or': [{'isActive': True}, {'isActive': {'$exists': False}}]}

    async def get_categories(self, limit: int = 30) -> list[dict[str, Any]]:
        db = get_database()
        rows = await db.categories.find(
            self._active_or_missing_filter(),
            {'name': 1, 'description': 1},
        ).sort('name', 1).limit(limit).to_list(length=limit)

        count_rows = await db.products.aggregate(
            [
                {
                    '$match': {
                        '$and': [
                            self._active_or_missing_filter(),
                            {'categoryId': {'$exists': True, '$ne': None}},
                        ]
                    }
                },
                {'$group': {'_id': '$categoryId', 'product_count': {'$sum': 1}}},
            ]
        ).to_list(length=None)
        count_map = {str(row.get('_id')): int(row.get('product_count') or 0) for row in count_rows}

        categories = []
        for row in rows:
            category_id = str(row['_id'])
            categories.append(
                {
                    'id': category_id,
                    'name': row.get('name', ''),
                    'description': row.get('description', ''),
                    'product_count': count_map.get(category_id, 0),
                }
            )
        return categories

    async def search_products(
        self,
        *,
        keyword: str = '',
        category_name: str = '',
        min_price: float | None = None,
        max_price: float | None = None,
        limit: int = 8,
        page: int = 1,
    ) -> dict[str, Any]:
        db = get_database()
        limit = max(1, min(int(limit or 8), 20))
        page = max(1, int(page or 1))
        query: dict[str, Any] = self._active_or_missing_filter()

        categories = await self.get_categories(limit=100)
        category_id = None
        if category_name:
            category_match = next(
                (category for category in categories if category['name'].lower() == category_name.lower()),
                None,
            )
            if category_match:
                category_id = category_match['id']
                row_id = self._safe_object_id(category_id)
                if row_id is not None:
                    query['$and'] = query.get('$and', [])
                    query['$and'].append({'$or': [{'categoryId': row_id}, {'categoryId': category_id}]})
                else:
                    query['$and'] = query.get('$and', [])
                    query['$and'].append({'categoryId': category_id})

        if keyword:
            keyword_regex = {'$regex': re.escape(keyword), '$options': 'i'}
            query['$and'] = query.get('$and', [])
            query['$and'].append(
                {
                    '$or': [
                        {'productName': keyword_regex},
                        {'description': keyword_regex},
                    ]
                }
            )

        if min_price is not None or max_price is not None:
            query['price'] = {}
            if min_price is not None:
                query['price']['$gte'] = float(min_price)
            if max_price is not None:
                query['price']['$lte'] = float(max_price)

        total_count = int(await db.products.count_documents(query))
        total_pages = math.ceil(total_count / limit) if total_count > 0 else 0
        if total_pages > 0 and page > total_pages:
            page = total_pages

        skip = (page - 1) * limit
        projection = {
            'productName': 1,
            'price': 1,
            'image': 1,
            'description': 1,
            'categoryId': 1,
        }
        rows = (
            await db.products.find(query, projection)
            .sort([('featured', -1), ('averageRating', -1), ('createdAt', -1)])
            .skip(skip)
            .limit(limit)
            .to_list(length=limit)
        )

        products = []
        for row in rows:
            product_id = str(row['_id'])
            description = str(row.get('description') or '').strip()
            short_description = description[:100].rstrip()
            if len(description) > 100:
                short_description += '...'

            products.append(
                {
                    'product_id': product_id,
                    'name': row.get('productName', 'Cake'),
                    'price': float(row.get('price') or 0),
                    'currency': '$',
                    'image': row.get('image') or '',
                    'short_description': short_description or 'Freshly baked cake from Cake House.',
                    'actions': [
                        {
                            'key': 'order_now',
                            'label': 'Order Now',
                            'action_type': 'chat_message',
                            'route_path': '',
                            'message': f'ORDER_PRODUCT:{product_id}',
                        },
                        {
                            'key': 'view_details',
                            'label': 'View Details',
                            'action_type': 'route',
                            'route_path': f'/product/{product_id}',
                            'message': '',
                        },
                    ],
                }
            )

        applied_filters = {
            'keyword': keyword or '',
            'category': category_name or '',
            'min_price': min_price,
            'max_price': max_price,
        }
        return {
            'items': products,
            'count': len(products),
            'applied_filters': applied_filters,
            'categories': categories,
            'page': page,
            'limit': limit,
            'total': total_count,
            'total_pages': total_pages,
            'has_prev': page > 1 and total_pages > 0,
            'has_next': total_pages > 0 and page < total_pages,
        }

    async def get_product_by_id(self, product_id: str) -> dict[str, Any] | None:
        db = get_database()
        object_id = self._safe_object_id(product_id)
        if object_id is None:
            return None

        query: dict[str, Any] = {
            '_id': object_id,
            '$and': [self._active_or_missing_filter()],
        }
        row = await db.products.find_one(
            query,
            {
                'productName': 1,
                'price': 1,
                'image': 1,
                'description': 1,
                'stockQuantity': 1,
            },
        )
        if not row:
            return None

        description = str(row.get('description') or '').strip()
        short_description = description[:100].rstrip()
        if len(description) > 100:
            short_description += '...'

        return {
            'product_id': str(row['_id']),
            'name': row.get('productName', 'Cake'),
            'price': float(row.get('price') or 0),
            'currency': '$',
            'image': row.get('image') or '',
            'short_description': short_description or 'Freshly baked cake from Cake House.',
            'stock_quantity': int(row.get('stockQuantity') or 0),
        }

    async def parse_filters_from_text(self, text: str) -> dict[str, Any]:
        raw_text = str(text or '').strip().lower()
        categories = await self.get_categories(limit=100)
        category_name = self._match_category(raw_text, categories)

        max_price = self._extract_price(raw_text, MAX_PRICE_PATTERN)
        min_price = self._extract_price(raw_text, MIN_PRICE_PATTERN)
        keyword = self._extract_keyword(raw_text, category_name)

        return {
            'keyword': keyword,
            'category_name': category_name,
            'min_price': min_price,
            'max_price': max_price,
        }

    async def search_by_message(self, text: str, limit: int = 8, page: int = 1) -> dict[str, Any]:
        filters = await self.parse_filters_from_text(text)
        result = await self.search_products(
            keyword=filters['keyword'],
            category_name=filters['category_name'],
            min_price=filters['min_price'],
            max_price=filters['max_price'],
            limit=limit,
            page=page,
        )
        result['filters'] = filters
        return result

    @staticmethod
    def _extract_price(text: str, pattern: re.Pattern[str]) -> float | None:
        match = pattern.search(text)
        if not match:
            return None
        try:
            return float(match.group(1))
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _match_category(text: str, categories: list[dict[str, Any]]) -> str:
        if not text:
            return ''

        for category in categories:
            name = str(category.get('name') or '').strip()
            if name and name.lower() in text:
                return name

        for category in categories:
            name = str(category.get('name') or '').strip()
            parts = [part for part in name.lower().split() if len(part) > 3]
            if any(part in text for part in parts):
                return name
        return ''

    def _extract_keyword(self, text: str, category_name: str) -> str:
        cleaned = re.sub(MAX_PRICE_PATTERN, ' ', text)
        cleaned = re.sub(MIN_PRICE_PATTERN, ' ', cleaned)
        if category_name:
            cleaned = cleaned.replace(category_name.lower(), ' ')

        cleaned = re.sub(r'[^a-z0-9\s]', ' ', cleaned)
        tokens = [token for token in cleaned.split() if token and token not in GENERIC_TOKENS and not token.isdigit()]
        if not tokens:
            return ''

        return ' '.join(tokens[:3])

    @staticmethod
    def _safe_object_id(value: str):
        try:
            from bson import ObjectId

            return ObjectId(value)
        except Exception:  # noqa: BLE001
            return None


product_browse_service = ProductBrowseService()
