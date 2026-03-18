from fastapi import APIRouter

from app.api.v1 import chat, custom_orders, health, products, support

api_router = APIRouter()
api_router.include_router(health.router, tags=['health'])
api_router.include_router(chat.router, prefix='/chat', tags=['chat'])
api_router.include_router(products.router, prefix='/products', tags=['products'])
api_router.include_router(custom_orders.router, prefix='/custom', tags=['custom-orders'])
api_router.include_router(support.router, prefix='/support', tags=['support'])
