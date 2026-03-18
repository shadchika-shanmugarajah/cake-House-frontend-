from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.chat import ChatProductCard


class CategoryResponseItem(BaseModel):
    id: str
    name: str
    description: str = ''
    product_count: int = 0


class ProductSearchPagination(BaseModel):
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


class ProductSearchResponse(BaseModel):
    items: list[ChatProductCard] = Field(default_factory=list)
    count: int = 0
    applied_filters: dict = Field(default_factory=dict)
    pagination: ProductSearchPagination = Field(default_factory=ProductSearchPagination)
