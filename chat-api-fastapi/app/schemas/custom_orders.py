from datetime import date, datetime
from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class UploadValidationPayload(BaseModel):
    is_valid: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class UploadImageMeta(BaseModel):
    mime_type: str
    size_bytes: int = Field(gt=0)
    width: int | None = None
    height: int | None = None
    checksum: str = ''
    format: str = ''
    quality_score: int = Field(default=0, ge=0, le=100)
    cake_check: dict = Field(default_factory=dict)


class UploadAiPreview(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: str = 'not_available'
    description: str = ''
    cake_type: str = Field(default='', validation_alias=AliasChoices('cake_type', 'cakeType'))
    flavor: str = ''
    shape: str = ''
    design_style: str = Field(default='', validation_alias=AliasChoices('design_style', 'designStyle'))
    colors: list[str] = Field(default_factory=list)
    text_on_cake: str = Field(default='', validation_alias=AliasChoices('text_on_cake', 'textOnCake'))
    layer_count: int | None = Field(default=None, validation_alias=AliasChoices('layer_count', 'layerCount'))
    decoration_elements: list[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices('decoration_elements', 'decorationElements'),
    )
    confidence: float = 0
    error_message: str = Field(default='', validation_alias=AliasChoices('error_message', 'errorMessage'))
    raw_response: str = Field(default='', validation_alias=AliasChoices('raw_response', 'rawResponse'))


class UploadImageResponse(BaseModel):
    upload_id: str
    request_id: str | None = None
    file_url: str
    preview_url: str
    message: str
    validation: UploadValidationPayload
    image_meta: UploadImageMeta
    ai_preview: UploadAiPreview | None = Field(default=None, validation_alias=AliasChoices('ai_preview', 'aiPreview'))


class UploadUrlRequest(BaseModel):
    file_name: str
    mime_type: str
    size_bytes: int = Field(gt=0)


class UploadUrlResponse(BaseModel):
    upload_url: str
    file_url: str
    expires_in: int


class CustomerInputs(BaseModel):
    occasion: str = ''
    servings: int = Field(default=10, ge=1)
    flavor: str = ''
    delivery_date: date
    delivery_slot: str = ''
    delivery_address_id: str
    notes: str = ''


class SubmitCustomOrderRequest(BaseModel):
    session_id: str
    image_url: str
    customer_inputs: CustomerInputs


class SubmitCustomOrderResponse(BaseModel):
    request_id: str
    status: str
    jobs: dict[str, str | None]
    message: str


class DeliveryFeasibilityRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    delivery_date: date = Field(validation_alias=AliasChoices('delivery_date', 'deliveryDate'))
    delivery_slot: str = Field(default='', validation_alias=AliasChoices('delivery_slot', 'deliverySlot'))
    delivery_address_id: str = Field(default='', validation_alias=AliasChoices('delivery_address_id', 'deliveryAddressId'))


class DeliveryFeasibilityRules(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    min_preparation_days: int = Field(validation_alias=AliasChoices('min_preparation_days', 'minPreparationDays'))
    slot_capacity_check_enabled: bool = Field(
        validation_alias=AliasChoices('slot_capacity_check_enabled', 'slotCapacityCheckEnabled'),
    )


class DeliveryFeasibilityResponse(BaseModel):
    feasible: bool
    message: str
    rules: DeliveryFeasibilityRules


class ConfirmedCustomOrderData(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    flavor: str = ''
    weight_kg: Literal[1, 2, 3] = Field(default=1, validation_alias=AliasChoices('weight_kg', 'weightKg'))
    message_on_cake: str = Field(default='', validation_alias=AliasChoices('message_on_cake', 'messageOnCake'))
    delivery_date: date = Field(validation_alias=AliasChoices('delivery_date', 'deliveryDate'))
    special_instructions: str = Field(
        default='',
        validation_alias=AliasChoices('special_instructions', 'specialInstructions'),
    )


class ConfirmCustomOrderRequest(BaseModel):
    confirmed: bool
    edited_description: str = ''
    details: ConfirmedCustomOrderData | None = None


class AiExtractedAttributes(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    cake_type: str = Field(default='', validation_alias=AliasChoices('cake_type', 'cakeType'))
    flavor: str = ''
    shape: str = ''
    design_style: str = Field(default='', validation_alias=AliasChoices('design_style', 'designStyle'))
    colors: list[str] = Field(default_factory=list)
    text_on_cake: str = Field(default='', validation_alias=AliasChoices('text_on_cake', 'textOnCake'))
    layer_count: int | None = Field(default=None, validation_alias=AliasChoices('layer_count', 'layerCount', 'tiers'))
    decoration_elements: list[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices('decoration_elements', 'decorationElements', 'decorations'),
    )
    # Backward-compatible aliases from older payload shape.
    style: str = ''
    tiers: int | None = None
    decorations: list[str] = Field(default_factory=list)


class AiResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    description: str = ''
    cake_type: str = Field(default='', validation_alias=AliasChoices('cake_type', 'cakeType'))
    flavor: str = ''
    shape: str = ''
    design_style: str = Field(default='', validation_alias=AliasChoices('design_style', 'designStyle'))
    colors: list[str] = Field(default_factory=list)
    text_on_cake: str = Field(default='', validation_alias=AliasChoices('text_on_cake', 'textOnCake'))
    layer_count: int | None = Field(default=None, validation_alias=AliasChoices('layer_count', 'layerCount'))
    decoration_elements: list[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices('decoration_elements', 'decorationElements'),
    )
    confidence: float = 0
    extracted_attributes: AiExtractedAttributes = Field(
        default_factory=AiExtractedAttributes,
        validation_alias=AliasChoices('extracted_attributes', 'extractedAttributes'),
    )
    status: str = 'pending'
    error_message: str = Field(default='', validation_alias=AliasChoices('error_message', 'errorMessage'))
    raw_response: str = Field(default='', validation_alias=AliasChoices('raw_response', 'rawResponse'))


class CustomOrderStatusResponse(BaseModel):
    request_id: str
    status: str
    ai_result: AiResult | None = None
    confirmed_data: ConfirmedCustomOrderData | None = None
    updated_at: datetime | None = None


class ConfirmCustomOrderResponse(BaseModel):
    request_id: str
    status: str
    message: str
    confirmed_data: ConfirmedCustomOrderData | None = None


class RetryAnalysisResponse(BaseModel):
    request_id: str
    status: str
    queued: bool
    job_id: str | None = None
    message: str
