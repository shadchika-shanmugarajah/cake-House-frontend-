from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'Cake House Chat API'
    app_env: str = Field(default='development', alias='APP_ENV')
    app_debug: bool = Field(default=True, alias='APP_DEBUG')
    api_prefix: str = '/chat-api/v1'

    mongo_uri: str = Field(default='mongodb://localhost:27017', alias='MONGODB_URI')
    mongo_db_name: str = Field(default='cake_house', alias='MONGODB_DB_NAME')

    redis_url: str = Field(default='redis://localhost:6379/0', alias='REDIS_URL')

    jwt_secret: str = Field(default='dev-secret', alias='JWT_SECRET')
    jwt_algorithm: str = Field(default='HS256', alias='JWT_ALGORITHM')

    gemini_api_key: str = Field(default='', alias='GEMINI_API_KEY')
    gemini_model: str = Field(default='gemini-3-flash-preview', alias='GEMINI_MODEL')

    commerce_api_base_url: str = Field(default='http://localhost:5000/api', alias='COMMERCE_API_BASE_URL')
    notification_internal_key: str = Field(default='', alias='NOTIFICATION_INTERNAL_KEY')
    cloud_public_base_url: str = Field(default='http://localhost:8001/chat-api/uploads', alias='CLOUD_PUBLIC_BASE_URL')
    cloud_upload_local_dir: str = Field(default='chat_cake_images', alias='CLOUD_UPLOAD_LOCAL_DIR')
    custom_image_max_size_bytes: int = Field(default=8 * 1024 * 1024, alias='CUSTOM_IMAGE_MAX_SIZE_BYTES')
    custom_image_min_width: int = Field(default=320, alias='CUSTOM_IMAGE_MIN_WIDTH')
    custom_image_min_height: int = Field(default=240, alias='CUSTOM_IMAGE_MIN_HEIGHT')
    custom_image_min_bytes: int = Field(default=12 * 1024, alias='CUSTOM_IMAGE_MIN_BYTES')
    custom_image_min_pixels: int = Field(default=120000, alias='CUSTOM_IMAGE_MIN_PIXELS')

    min_custom_delivery_lead_days: int = Field(default=2, alias='MIN_CUSTOM_DELIVERY_LEAD_DAYS')
    custom_delivery_check_slot_capacity: bool = Field(default=False, alias='CUSTOM_DELIVERY_CHECK_SLOT_CAPACITY')


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
