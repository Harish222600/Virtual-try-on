import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "virtual_try_on")

async def cleanup():
    print(f"Connecting to {MONGO_URL}...")
    client = AsyncIOMotorClient(MONGO_URL)
    database = client[DB_NAME]
    collection = database["categories"]
    
    # Find invalid categories (name length < 2 or missing)
    invalid_docs = []
    async for doc in collection.find({}):
        if 'name' not in doc or not isinstance(doc['name'], str) or len(doc['name']) < 2:
            print(f"Found invalid doc: {doc.get('name', 'N/A')} ({doc['_id']})")
            invalid_docs.append(doc['_id'])
            
    if invalid_docs:
        print(f"Found {len(invalid_docs)} invalid categories. Deleting...")
        result = await collection.delete_many({"_id": {"$in": invalid_docs}})
        print(f"Deleted {result.deleted_count} documents.")
    else:
        print("No invalid categories found.")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(cleanup())
