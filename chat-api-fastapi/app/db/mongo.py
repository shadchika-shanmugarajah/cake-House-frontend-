from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings


class Mongo:
    client: AsyncIOMotorClient | None = None
    database: AsyncIOMotorDatabase | None = None


mongo = Mongo()


async def connect_mongo() -> None:
    settings = get_settings()
    mongo.client = AsyncIOMotorClient(settings.mongo_uri)
    mongo.database = mongo.client[settings.mongo_db_name]


async def close_mongo() -> None:
    if mongo.client is not None:
        mongo.client.close()
        mongo.client = None
        mongo.database = None


def get_database() -> AsyncIOMotorDatabase:
    if mongo.database is None:
        raise RuntimeError('MongoDB is not connected')
    return mongo.database
