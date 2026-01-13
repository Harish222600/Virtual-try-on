import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "virtual_try_on")

client = AsyncIOMotorClient(MONGO_URL)
database = client[DB_NAME]
users_collection = database["users"]
products_collection = database["products"]
categories_collection = database["categories"]
tryon_history_collection = database["tryon_history"]

async def get_database():
    return database
