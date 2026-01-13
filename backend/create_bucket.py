from fast_supabase import get_supabase
import asyncio

async def create_bucket():
    try:
        supabase = get_supabase()
        bucket_name = "user-images"
        
        print(f"Creating public bucket '{bucket_name}'...")
        
        # Create a public bucket
        res = supabase.storage.create_bucket(bucket_name, options={"public": True})
        
        print(f"✅ Bucket '{bucket_name}' created successfully!")
        print(f"Response: {res}")
            
    except Exception as e:
        print(f"\n❌ Error creating bucket: {e}")
        if "Duplicate" in str(e):
             print("Bucket might already exist (but listing failed previously?).")

if __name__ == "__main__":
    asyncio.run(create_bucket())
