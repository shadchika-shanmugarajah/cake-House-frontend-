from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.products import CategoryResponseItem, ProductSearchPagination, ProductSearchResponse
from app.services.product_browse_service import product_browse_service

router = APIRouter()


@router.get('/search', response_model=ProductSearchResponse)
async def search_products(
    q: str = Query(default=''),
    keyword: str = Query(default=''),
    category: str = Query(default=''),
    min_price: float | None = Query(default=None),
    max_price: float | None = Query(default=None),
    limit: int = Query(default=5, ge=1, le=20),
    page: int = Query(default=1, ge=1),
) -> ProductSearchResponse:
    if q:
        parsed = await product_browse_service.search_by_message(q, limit=limit, page=page)
        filters = parsed.get('filters') or {}
        resolved_keyword = keyword or filters.get('keyword') or ''
        resolved_category = category or filters.get('category_name') or ''
        resolved_min_price = min_price if min_price is not None else filters.get('min_price')
        resolved_max_price = max_price if max_price is not None else filters.get('max_price')
        result = await product_browse_service.search_products(
            keyword=resolved_keyword,
            category_name=resolved_category,
            min_price=resolved_min_price,
            max_price=resolved_max_price,
            limit=limit,
            page=page,
        )
        result['applied_filters'] = {
            'keyword': resolved_keyword,
            'category': resolved_category,
            'min_price': resolved_min_price,
            'max_price': resolved_max_price,
        }
    else:
        result = await product_browse_service.search_products(
            keyword=keyword,
            category_name=category,
            min_price=min_price,
            max_price=max_price,
            limit=limit,
            page=page,
        )

    applied_filters = result.get('applied_filters') or result.get('filters') or {}
    return ProductSearchResponse(
        items=result.get('items') or [],
        count=int(result.get('count') or 0),
        applied_filters=applied_filters,
        pagination=ProductSearchPagination(
            page=int(result.get('page') or page),
            limit=int(result.get('limit') or limit),
            total=int(result.get('total') or 0),
            total_pages=int(result.get('total_pages') or 0),
            has_prev=bool(result.get('has_prev') or False),
            has_next=bool(result.get('has_next') or False),
            category=str(applied_filters.get('category') or ''),
            keyword=str(applied_filters.get('keyword') or ''),
            min_price=applied_filters.get('min_price'),
            max_price=applied_filters.get('max_price'),
        ),
    )


@router.get('/categories', response_model=list[CategoryResponseItem])
async def list_categories(limit: int = Query(default=30, ge=1, le=100)) -> list[CategoryResponseItem]:
    rows = await product_browse_service.get_categories(limit=limit)
    return [CategoryResponseItem(**row) for row in rows]
