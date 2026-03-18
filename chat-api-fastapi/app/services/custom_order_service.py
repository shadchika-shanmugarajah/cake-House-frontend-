from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.db.mongo import get_database
from app.schemas.custom_orders import (
    ConfirmCustomOrderRequest,
    ConfirmCustomOrderResponse,
    CustomOrderStatusResponse,
    RetryAnalysisResponse,
    SubmitCustomOrderRequest,
    SubmitCustomOrderResponse,
)
from app.services.delivery_feasibility_service import delivery_feasibility_service
from app.services.commerce_client import commerce_client
from app.services.queue_service import queue_service

ORDER_LOCK_MESSAGE = 'Your order is already in progress and can no longer be modified or cancelled.'
LOCKED_CUSTOM_ORDER_STATUSES = {'in_progress', 'ready', 'out_for_delivery', 'delivered'}


class CustomOrderService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _normalize_legacy_image_url(self, image_url: str) -> str:
        url = str(image_url or '').strip()
        if not url:
            return url

        legacy_prefix = 'https://cdn.example.com/uploads'
        target_prefix = self.settings.cloud_public_base_url.rstrip('/')

        if url.startswith(legacy_prefix):
            return f"{target_prefix}{url[len(legacy_prefix):]}"

        return url

    async def submit(self, user_id: str, payload: SubmitCustomOrderRequest, auth_token: str | None = None) -> SubmitCustomOrderResponse:
        db = get_database()
        normalized_image_url = self._normalize_legacy_image_url(payload.image_url)
        uploaded_image = await db.custom_order_uploads.find_one({
            'userId': user_id,
            'fileUrl': normalized_image_url,
        })
        if not uploaded_image and normalized_image_url != payload.image_url:
            uploaded_image = await db.custom_order_uploads.find_one({
                'userId': user_id,
                'fileUrl': payload.image_url,
            })
        if not uploaded_image:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Please upload and validate your reference cake image before submitting custom order.',
            )

        delivery_check = await delivery_feasibility_service.validate_custom_order_delivery(
            delivery_date=payload.customer_inputs.delivery_date,
            delivery_slot=payload.customer_inputs.delivery_slot,
            delivery_address_id=payload.customer_inputs.delivery_address_id,
            token=auth_token,
        )
        if not delivery_check.feasible:
            raise HTTPException(status_code=delivery_check.status_code, detail=delivery_check.message)

        request_id = f"CUST-{uuid4().hex[:10].upper()}"
        now = datetime.utcnow()

        doc = {
            'requestId': request_id,
            'userId': user_id,
            'sessionId': payload.session_id,
            'imageUrl': normalized_image_url,
            'imageMeta': (uploaded_image or {}).get('imageMeta') or {},
            'customerInputs': {
                'occasion': payload.customer_inputs.occasion,
                'servings': payload.customer_inputs.servings,
                'flavor': payload.customer_inputs.flavor,
                'deliveryDate': datetime.combine(payload.customer_inputs.delivery_date, datetime.min.time()),
                'deliverySlot': payload.customer_inputs.delivery_slot,
                'deliveryAddressId': payload.customer_inputs.delivery_address_id,
                'notes': payload.customer_inputs.notes,
            },
            'aiResult': {
                'description': '',
                'cakeType': '',
                'flavor': '',
                'shape': '',
                'designStyle': '',
                'colors': [],
                'textOnCake': '',
                'layerCount': None,
                'decorationElements': [],
                'confidence': 0,
                'extractedAttributes': {
                    'cakeType': '',
                    'flavor': '',
                    'shape': '',
                    'designStyle': '',
                    'colors': [],
                    'style': '',
                    'tiers': None,
                    'textOnCake': '',
                    'decorations': [],
                },
                'status': 'pending',
                'errorMessage': '',
                'rawResponse': '',
            },
            'userConfirmation': {
                'confirmed': False,
                'editedDescription': '',
                'confirmedAt': None,
            },
            'adminQuote': {
                'quotedPrice': None,
                'quoteNotes': '',
                'quotedBy': None,
                'quotedAt': None,
            },
            'status': 'ai_processing',
            'lock': {
                'isLocked': False,
                'lockReason': '',
                'lockedBy': '',
                'lockedAt': None,
                'expiresAt': None,
            },
            'createdAt': now,
            'updatedAt': now,
        }

        await db.custom_order_requests.insert_one(doc)

        validation_payload = {
            'jobType': 'image_validation',
            'requestId': request_id,
            'imageUrl': normalized_image_url,
        }
        analysis_payload = {
            'jobType': 'image_analysis',
            'requestId': request_id,
            'imageUrl': normalized_image_url,
            'customerInputs': payload.customer_inputs.model_dump(),
        }

        validation_job_id = queue_service.enqueue(
            'image_validation',
            'src.tasks.validate_image.validate_image_task',
            validation_payload,
        )
        analysis_job_id = queue_service.enqueue(
            'image_analysis',
            'src.tasks.analyze_cake_image.analyze_cake_image_task',
            analysis_payload,
        )

        return SubmitCustomOrderResponse(
            request_id=request_id,
            status='ai_processing',
            jobs={
                'validationJobId': validation_job_id or queue_service.fake_job_id(),
                'analysisJobId': analysis_job_id or queue_service.fake_job_id(),
            },
            message='Custom request received. We are analyzing your image.',
        )

    async def get_status(self, user_id: str, request_id: str) -> CustomOrderStatusResponse:
        db = get_database()
        doc = await db.custom_order_requests.find_one({'requestId': request_id, 'userId': user_id})
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Custom order request not found')

        confirmed_data = (doc.get('userConfirmation') or {}).get('confirmedData')
        if isinstance(confirmed_data, dict):
            if isinstance(confirmed_data.get('deliveryDate'), datetime):
                confirmed_data = {
                    **confirmed_data,
                    'deliveryDate': confirmed_data['deliveryDate'].date(),
                }

        return CustomOrderStatusResponse(
            request_id=doc['requestId'],
            status=doc.get('status', 'submitted'),
            ai_result=doc.get('aiResult'),
            confirmed_data=confirmed_data,
            updated_at=doc.get('updatedAt'),
        )

    async def confirm(
        self,
        user_id: str,
        request_id: str,
        payload: ConfirmCustomOrderRequest,
        auth_token: str | None = None,
    ) -> ConfirmCustomOrderResponse:
        db = get_database()
        doc = await db.custom_order_requests.find_one({'requestId': request_id, 'userId': user_id})
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Custom order request not found')

        current_status = str(doc.get('status') or '').strip().lower()
        if current_status in LOCKED_CUSTOM_ORDER_STATUSES:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=ORDER_LOCK_MESSAGE)

        if payload.confirmed and payload.details is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Please fill flavor, weight, message on cake, delivery date, and special instructions before confirming.',
            )

        confirmed_data = None
        if payload.details is not None:
            delivery_date = payload.details.delivery_date
            if payload.confirmed:
                customer_inputs = doc.get('customerInputs') or {}
                delivery_check = await delivery_feasibility_service.validate_custom_order_delivery(
                    delivery_date=delivery_date,
                    delivery_slot=str(customer_inputs.get('deliverySlot') or '').strip(),
                    delivery_address_id=str(customer_inputs.get('deliveryAddressId') or '').strip(),
                    token=auth_token,
                )
                if not delivery_check.feasible:
                    raise HTTPException(status_code=delivery_check.status_code, detail=delivery_check.message)

            confirmed_data = {
                'flavor': payload.details.flavor.strip(),
                'weightKg': int(payload.details.weight_kg),
                'messageOnCake': payload.details.message_on_cake.strip(),
                'deliveryDate': datetime.combine(delivery_date, datetime.min.time()),
                'specialInstructions': payload.details.special_instructions.strip(),
            }

        final_description = payload.edited_description.strip() or str((doc.get('aiResult') or {}).get('description') or '').strip()
        status_value = 'awaiting_admin_quote' if payload.confirmed else 'awaiting_user_confirmation'
        update_payload: dict = {
            'status': status_value,
            'userConfirmation': {
                'confirmed': payload.confirmed,
                'editedDescription': final_description,
                'confirmedData': confirmed_data,
                'confirmedAt': datetime.utcnow() if payload.confirmed else None,
            },
            'updatedAt': datetime.utcnow(),
        }
        if final_description:
            update_payload['aiResult.description'] = final_description

        if confirmed_data is not None:
            update_payload['customerInputs.flavor'] = confirmed_data['flavor']
            update_payload['customerInputs.deliveryDate'] = confirmed_data['deliveryDate']
            update_payload['customerInputs.notes'] = confirmed_data['specialInstructions']
            update_payload['customerInputs.weightKg'] = confirmed_data['weightKg']
            update_payload['customerInputs.messageOnCake'] = confirmed_data['messageOnCake']

        await db.custom_order_requests.update_one(
            {'requestId': request_id, 'userId': user_id},
            {
                '$set': update_payload
            },
        )

        if payload.confirmed:
            await commerce_client.emit_notification({
                'target': 'admins',
                'title': 'Custom Order Received',
                'message': f'New custom order {request_id} is waiting for pricing review.',
                'type': 'custom_order_received',
                'relatedType': 'custom_order',
                'relatedId': request_id,
                'customOrderId': request_id,
                'redirectPath': '/admin/custom-orders',
                'metadata': {
                    'requestId': request_id,
                    'source': 'chatbot',
                    'status': status_value,
                },
            })

        return ConfirmCustomOrderResponse(
            request_id=request_id,
            status=status_value,
            message='Your custom cake request was sent to admin for pricing.'
            if payload.confirmed
            else 'You can update your design notes and confirm again.',
            confirmed_data=confirmed_data,
        )

    async def retry_analysis(self, user_id: str, request_id: str) -> RetryAnalysisResponse:
        db = get_database()
        doc = await db.custom_order_requests.find_one({'requestId': request_id, 'userId': user_id})
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Custom order request not found')

        ai_result = doc.get('aiResult') or {}
        ai_status = str(ai_result.get('status') or '').strip().lower()
        has_error = bool(str(ai_result.get('errorMessage') or '').strip())

        retry_allowed = ai_status in {'failed', 'needs_human_review', 'retryable'} or has_error
        if not retry_allowed:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='AI analysis retry is allowed only after an AI failure.',
            )

        customer_inputs = doc.get('customerInputs') or {}
        delivery_date = customer_inputs.get('deliveryDate')
        if isinstance(delivery_date, datetime):
            customer_inputs = {
                **customer_inputs,
                'deliveryDate': delivery_date.isoformat(),
            }

        analysis_payload = {
            'jobType': 'image_analysis',
            'requestId': request_id,
            'imageUrl': doc.get('imageUrl') or '',
            'customerInputs': customer_inputs,
        }

        job_id = queue_service.enqueue(
            'image_analysis',
            'src.tasks.analyze_cake_image.analyze_cake_image_task',
            analysis_payload,
        )

        await db.custom_order_requests.update_one(
            {'requestId': request_id, 'userId': user_id},
            {
                '$set': {
                    'status': 'ai_processing',
                    'aiResult.status': 'pending',
                    'aiResult.errorMessage': '',
                    'updatedAt': datetime.utcnow(),
                }
            },
        )

        return RetryAnalysisResponse(
            request_id=request_id,
            status='ai_processing',
            queued=bool(job_id),
            job_id=job_id or queue_service.fake_job_id(),
            message='AI analysis retry started. We will notify you when the result is ready.'
            if job_id
            else 'AI queue is unavailable right now. Please try retrying again in a moment.',
        )


custom_order_service = CustomOrderService()
