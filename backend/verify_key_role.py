from dotenv import load_dotenv
import os
import json
import base64

load_dotenv()

key = os.environ.get("SUPABASE_KEY")
if not key:
    print("❌ SUPABASE_KEY not found in .env")
    exit(1)

try:
    # Basic sanity checks
    print(f"Key length: {len(key)}")
    print(f"Key starts with: '{key[:10]}...'")
    
    if " " in key:
         print("❌ Error: Key contains spaces. Check your .env for accidental spaces.")
         exit(1)
         
    if not key.startswith("eyJ"):
        print("❌ Error: Key does not start with 'eyJ'. Supabase JWT keys always start with 'eyJ'.")
        print("   Did you copy the 'Project Ref' or a URL by mistake?")
        exit(1)

    # Decode JWT header and payload (simple split, no signature verify needed for this check)
    parts = key.split(".")
    if len(parts) != 3:
        print("❌ Invalid Key Format: Not a valid JWT (must have 3 parts separated by dots).")
        exit(1)

    payload = parts[1]
    # Add padding if needed
    payload += '=' * (-len(payload) % 4)
    decoded_bytes = base64.b64decode(payload)
    decoded_str = decoded_bytes.decode('utf-8')
    data = json.loads(decoded_str)

    role = data.get("role")
    print(f"Key Role: {role}")
    
    if role == "service_role":
        print("✅ Correct! You are using the Service Role Key.")
    elif role == "anon":
        print("❌ WRONG KEY: You are using the 'anon' (public) key.")
        print("👉 Please find the 'service_role' key in your Supabase Dashboard > Project Settings > API.")
        print("👉 Update SUPABASE_KEY in your .env file with the service_role key.")
    else:
        print(f"⚠️ Unknown role: {role}")

except Exception as e:
    print(f"Error decoding key: {e}")
