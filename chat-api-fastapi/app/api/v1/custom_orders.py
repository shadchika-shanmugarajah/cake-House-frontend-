from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, File, Form, Header, HTTPException, Request, UploadFile, status

from app.core.security import CurrentUserId
from app.db.mongo import get_database
from app.schemas.custom_orders import (
    ConfirmCustomOrderRequest,
    ConfirmCustomOrderResponse,
    CustomOrderStatusResponse,
    DeliveryFeasibilityRequest,
    DeliveryFeasibilityResponse,
    RetryAnalysisResponse,
    SubmitCustomOrderRequest,
    SubmitCustomOrderResponse,
    UploadImageResponse,
    UploadUrlRequest,
    UploadUrlResponse,
)
from app.services.cake_image_ai_service import cake_image_ai_service
from app.services.custom_order_service import custom_order_service
from app.services.delivery_feasibility_service import delivery_feasibility_service
from app.services.image_validation_service import image_validation_service
from app.services.storage_service import storage_service

router = APIRouter()


def _local_upload_base_url(request: Request) -> str:
    return f"{str(request.base_url).rstrip('/')}/chat-api/uploads"


def _ai_preview_to_ai_result(ai_preview: dict) -> dict:
    description = str(ai_preview.get('description') or '').strip()
    flavor = str(ai_preview.get('flavor') or '').strip()
    shape = str(ai_preview.get('shape') or '').strip()
    cake_type = str(ai_preview.get('cakeType') or '').strip()
    design_style = str(ai_preview.get('designStyle') or '').strip()
    colors = ai_preview.get('colors') if isinstance(ai_preview.get('colors'), list) else []
    text_on_cake = str(ai_preview.get('textOnCake') or '').strip()
    layer_count = ai_preview.get('layerCount')
    decorations = ai_preview.get('decorationElements') if isinstance(ai_preview.get('decorationElements'), list) else []
    confidence = float(ai_preview.get('confidence') or 0)
    ai_status = str(ai_preview.get('status') or '').strip().lower()
    status_value = 'ready' if ai_status == 'ready' and description else 'needs_human_review'

    return {
        'description': description,
        'cakeType': cake_type,
        'flavor': flavor,
        'shape': shape,
        'designStyle': design_style,
        'colors': colors,
        'textOnCake': text_on_cake,
        'layerCount': layer_count,
        'decorationElements': decorations,
        'confidence': confidence,
        'extractedAttributes': {
            'cakeType': cake_type,
            'flavor': flavor,
            'shape': shape,
            'designStyle': design_style,
            'colors': colors,
            'style': design_style,
            'tiers': layer_count,
            'textOnCake': text_on_cake,
            'decorations': decorations,
        },
        'status': status_value,
        'errorMessage': str(ai_preview.get('errorMessage') or '').strip(),
        'rawResponse': str(ai_preview.get('rawResponse') or '').strip(),
    }


@router.post('/upload-url', response_model=UploadUrlResponse)
async def get_upload_url(
    payload: UploadUrlRequest,
    request: Request,
    user_id: str = CurrentUserId,
) -> UploadUrlResponse:
    del user_id
    upload_url, file_url, expires_in = storage_service.create_upload_url(payload.file_name)
    file_name = file_url.rsplit('/', 1)[-1].split('?', 1)[0]
    local_file_url = f"{_local_upload_base_url(request)}/custom/{file_name}"
    local_upload_url = f"{local_file_url}?signature=fake-signature&expires={expires_in}"
    return UploadUrlResponse(upload_url=local_upload_url, file_url=local_file_url, expires_in=expires_in)


@router.post('/upload', response_model=UploadImageResponse)
async def upload_custom_image(
    request: Request,
    file: UploadFile = File(...),
    session_id: str = Form(default=''),
    user_id: str = CurrentUserId,
) -> UploadImageResponse:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Please select an image file.')

    content = await file.read()
    mime_type = file.content_type or 'application/octet-stream'
    validation = image_validation_service.validate_upload(
        file_name=file.filename,
        mime_type=mime_type,
        content=content,
    )

    if not validation.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                'message': validation.user_message,
                'errors': validation.errors,
                'warnings': validation.warnings,
            },
        )

    stored = storage_service.store_custom_image(
        file_name=file.filename,
        mime_type=mime_type,
        content=content,
    )

    upload_id = f"UPL-{uuid4().hex[:12].upper()}"
    request_id = f"CUST-{uuid4().hex[:10].upper()}"
    now = datetime.utcnow()
    local_file_url = f"{_local_upload_base_url(request)}/{stored['storage_key']}"
    ai_preview = cake_image_ai_service.analyze_uploaded_image(content=content, mime_type=mime_type)
    ai_result = _ai_preview_to_ai_result(ai_preview)

    db = get_database()
    await db.custom_order_uploads.insert_one({
        'uploadId': upload_id,
        'requestId': request_id,
        'userId': user_id,
        'sessionId': session_id or '',
        'originalFileName': file.filename,
        'storageKey': stored['storage_key'],
        'fileUrl': local_file_url,
        'imageMeta': validation.metadata,
        'validation': {
            'isValid': validation.is_valid,
            'errors': validation.errors,
            'warnings': validation.warnings,
        },
        'aiPreview': ai_preview,
        'createdAt': now,
        'updatedAt': now,
    })

    await db.custom_order_requests.insert_one({
        'requestId': request_id,
        'userId': user_id,
        'sessionId': session_id or '',
        'imageUrl': local_file_url,
        'imageMeta': validation.metadata,
        'customerInputs': {
            'occasion': 'Custom',
            'servings': 10,
            'flavor': str(ai_preview.get('flavor') or '').strip(),
            'deliveryDate': None,
            'deliverySlot': '',
            'deliveryAddressId': '',
            'notes': '',
            'weightKg': 1,
            'messageOnCake': str(ai_preview.get('textOnCake') or '').strip(),
            'specialInstructions': '',
        },
        'aiResult': ai_result,
        'userConfirmation': {
            'confirmed': False,
            'editedDescription': '',
            'confirmedData': None,
            'confirmedAt': None,
        },
        'adminQuote': {
            'quotedPrice': None,
            'quoteNotes': '',
            'quotedBy': None,
            'quotedAt': None,
        },
        'status': 'awaiting_user_confirmation',
        'lock': {
            'isLocked': False,
            'lockReason': '',
            'lockedBy': '',
            'lockedAt': None,
            'expiresAt': None,
        },
        'createdAt': now,
        'updatedAt': now,
    })

    return UploadImageResponse(
        upload_id=upload_id,
        request_id=request_id,
        file_url=local_file_url,
        preview_url=local_file_url,
        message='Image validated and uploaded successfully.',
        validation={
            'is_valid': True,
            'errors': [],
            'warnings': validation.warnings,
        },
        image_meta={
            'mime_type': validation.metadata.get('mimeType') or mime_type,
            'size_bytes': int(validation.metadata.get('sizeBytes') or len(content)),
            'width': validation.metadata.get('width'),
            'height': validation.metadata.get('height'),
            'checksum': validation.metadata.get('checksum') or '',
            'format': validation.metadata.get('format') or '',
            'quality_score': int(validation.metadata.get('qualityScore') or 0),
            'cake_check': validation.metadata.get('cakeCheck') or {},
        },
        ai_preview=ai_preview,
    )


@router.post('/submit', response_model=SubmitCustomOrderResponse, status_code=202)
async def submit_custom_order(
    payload: SubmitCustomOrderRequest,
    user_id: str = CurrentUserId,
    authorization: str | None = Header(default=None),
) -> SubmitCustomOrderResponse:
    token = None
    if authorization and authorization.startswith('Bearer '):
        token = authorization.split(' ', 1)[1]
    return await custom_order_service.submit(user_id, payload, auth_token=token)


@router.post('/delivery-feasibility', response_model=DeliveryFeasibilityResponse)
async def check_custom_delivery_feasibility(
    payload: DeliveryFeasibilityRequest,
    authorization: str | None = Header(default=None),
    user_id: str = CurrentUserId,
) -> DeliveryFeasibilityResponse:
    del user_id
    token = None
    if authorization and authorization.startswith('Bearer '):
        token = authorization.split(' ', 1)[1]

    result = await delivery_feasibility_service.validate_custom_order_delivery(
        delivery_date=payload.delivery_date,
        delivery_slot=payload.delivery_slot,
        delivery_address_id=payload.delivery_address_id,
        token=token,
    )

    return DeliveryFeasibilityResponse(
        feasible=result.feasible,
        message=result.message,
        rules=result.rules,
    )


@router.get('/{request_id}/status', response_model=CustomOrderStatusResponse)
async def get_custom_order_status(request_id: str, user_id: str = CurrentUserId) -> CustomOrderStatusResponse:
    return await custom_order_service.get_status(user_id, request_id)


@router.post('/{request_id}/confirm', response_model=ConfirmCustomOrderResponse)
async def confirm_custom_order(
    request_id: str,
    payload: ConfirmCustomOrderRequest,
    authorization: str | None = Header(default=None),
    user_id: str = CurrentUserId,
) -> ConfirmCustomOrderResponse:
    token = None
    if authorization and authorization.startswith('Bearer '):
        token = authorization.split(' ', 1)[1]
    return await custom_order_service.confirm(user_id, request_id, payload, auth_token=token)


@router.post('/{request_id}/retry-analysis', response_model=RetryAnalysisResponse)
async def retry_custom_order_analysis(
    request_id: str,
    user_id: str = CurrentUserId,
) -> RetryAnalysisResponse:
    return await custom_order_service.retry_analysis(user_id, request_id)
