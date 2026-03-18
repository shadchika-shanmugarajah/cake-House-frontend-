from pydantic import BaseModel, Field


class QuickActionCard(BaseModel):
    key: str
    title: str
    description: str
    message: str
    flow: str
    route_path: str


class ProductCardAction(BaseModel):
    key: str
    label: str
    action_type: str = 'route'
    route_path: str = ''
    message: str = ''


class ChatProductCard(BaseModel):
    product_id: str
    name: str
    price: float
    currency: str = '$'
    image: str = ''
    short_description: str = ''
    actions: list[ProductCardAction] = Field(default_factory=list)


class ChatProductPagination(BaseModel):
    page: int = 1
    limit: int = 5
    total: int = 0
    total_pages: int = 0
    has_prev: bool = False
    has_next: bool = False
    category: str = ''
    keyword: str = ''
    min_price: float | None = None
    max_price: float | None = None


class StartSessionContext(BaseModel):
    entry_point: str = Field(default='floating_button')


class StartSessionRequest(BaseModel):
    channel: str = 'web'
    locale: str = 'en'
    context: StartSessionContext = Field(default_factory=StartSessionContext)


class StartSessionResponse(BaseModel):
    session_id: str
    status: str
    welcome_message: str
    quick_replies: list[str]
    quick_actions: list[QuickActionCard] = Field(default_factory=list)


class ChatMessageRequest(BaseModel):
    session_id: str
    message: str
    message_type: str = 'text'


class ChatReplyPayload(BaseModel):
    text: str
    message_type: str = 'text'
    flow: str = ''
    route_path: str = ''
    products: list[ChatProductCard] = Field(default_factory=list)
    product_pagination: ChatProductPagination = Field(default_factory=ChatProductPagination)
    quick_replies: list[str] = Field(default_factory=list)
    sample_messages: list[str] = Field(default_factory=list)
    action_cards: list[QuickActionCard] = Field(default_factory=list)


class IntentResult(BaseModel):
    name: str
    confidence: float


class ChatMessageResponse(BaseModel):
    reply: ChatReplyPayload
    intent: IntentResult
    fallback: bool = False
