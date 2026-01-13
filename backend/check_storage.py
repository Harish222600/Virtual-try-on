from fast_supabase import get_supabase
import asyncio

async def check_storage():
    try:
        supabase = get_supabase()
        print("Attempting to list buckets...")
        buckets = supabase.storage.list_buckets()
        print(f"Success! Found {len(buckets)} buckets:")
        for b in buckets:
            print(f" - {b.name}")
            
        # Check specifically for 'user-images'
        found = any(b.name == 'user-images' for b in buckets)
        if found:
            print("\n✅ Bucket 'user-images' exists.")
        else:
            print("\n❌ Bucket 'user-images' NOT found. Please create it in Supabase Dashboard.")
            
    except Exception as e:
        print(f"\n❌ Error connecting to Storage: {e}")
        print("Tip: If you see 'Bucket not found' here or permission errors, try using your SERVICE_ROLE_KEY in .env instead of the anon key.")

if __name__ == "__main__":
    asyncio.run(check_storage())
