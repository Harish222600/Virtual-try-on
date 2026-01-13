import asyncio
from database import products_collection, client

async def clean():
    print("Cleaning invalid products...")
    # Delete products where name is empty or less than 2 chars
    # Regex ^.{0,1}$ matches strings with 0 or 1 character
    result = await products_collection.delete_many({"name": {"$regex": "^.{0,1}$"}})
    print(f"Deleted {result.deleted_count} products with invalid names.")
    client.close()

if __name__ == "__main__":
    asyncio.run(clean())
