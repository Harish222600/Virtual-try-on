import asyncio
from database import users_collection
from auth import get_password_hash
from datetime import datetime
import uuid

async def create_default_admin():
    email = "admin@virtualtryon.com"
    password = "admin123"
    full_name = "System Administrator"
    
    existing_user = await users_collection.find_one({"email": email})
    if existing_user:
        print(f"Admin user {email} already exists. Skipping creation.")
        if existing_user.get("role") != "admin":
             await users_collection.update_one({"email": email}, {"$set": {"role": "admin"}})
             print(f"Updated role for {email} to admin.")
        return

    admin_user = {
        "full_name": full_name,
        "email": email,
        "password": get_password_hash(password),
        "role": "admin",
        "supabase_uid": str(uuid.uuid4()),
        "created_at": datetime.utcnow().isoformat(),
        # Add other optional fields as None or placeholders
        "phone": None,
        "gender": "Other",
        "height": None,
        "body_type": None,
        "clothing_size": None,
        "jewelry_preference": None,
        "profile_image_url": None,
        "tryon_image_url": None
    }

    await users_collection.insert_one(admin_user)
    print(f"Default Admin user {email} created successfully.")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(create_default_admin())
