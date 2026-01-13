from fastapi import FastAPI, HTTPException, status, Depends, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from database import users_collection, products_collection, categories_collection, tryon_history_collection
from models import UserCreate, UserLogin, Token, UserResponse, UserInDB, UserUpdate, ChangePassword, ForgotPasswordRequest, ResetPasswordConfirm, ProductCreate, ProductUpdate, ProductResponse, CategoryResponse, TryOnRequest, TryOnResponse, TryOnHistoryResponse
from bson import ObjectId
# Keeping auth.py for legacy/token management if needed, but primarily moving to Supabase Auth check? 
# The plan says "Authenticate via Supabase Auth". This usually means the frontend gets the token from Supabase.
# But existing code has its own JWT. To avoid breaking everything too fast, I will focus on the SIGNUP part as requested.
# The user can then login via Supabase on frontend, or we'll update login later.
# For now, I will implement the SIGNUP that puts data into MongoDB and Supabase.
from auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user, verify_password
from datetime import datetime
from fast_supabase import get_supabase
import uuid
import os
import tempfile
import time
from catvton_tryon import CatVTONProcessor
import aiofiles

from create_admin import create_default_admin



app = FastAPI()

@app.on_event("startup")
async def startup_event():
    await create_default_admin()

# CORS
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Virtual Try-On Backend is running"}

@app.get("/admin/stats")
async def get_admin_stats():
    user_count = await users_collection.count_documents({})
    product_count = await products_collection.count_documents({})
    return {
        "users": user_count,
        "products": product_count,
        "activity": "High"  # Placeholder for now
    }

@app.get("/admin/users", response_model=list[UserResponse])
async def get_all_users():
    users_cursor = users_collection.find({})
    users = await users_cursor.to_list(length=100) # Limit to 100 for now
    return [
        UserResponse(
            id=str(user["_id"]),
            full_name=user.get("full_name", user.get("username", "Unknown")),
            email=user["email"],
            phone=user.get("phone"),
            gender=user.get("gender"),
            height=user.get("height"),
            body_type=user.get("body_type"),
            clothing_size=user.get("clothing_size"),
            jewelry_preference=user.get("jewelry_preference"),
            profile_image_url=user.get("profile_image_url"),
            tryon_image_url=user.get("tryon_image_url"),
            role=user.get("role", "user"),
            is_active=user.get("is_active", True)
        )
        for user in users
    ]

@app.put("/admin/users/{user_id}/status")
async def toggle_user_status(user_id: str, is_active: bool = Body(..., embed=True)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": is_active}}
    )
    
    if result.modified_count == 0:
         raise HTTPException(status_code=404, detail="User not found or status unchanged")
    return {"message": "User status updated"}

@app.delete("/admin/users/{user_id}")
async def delete_user(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    result = await users_collection.delete_one({"_id": ObjectId(user_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"message": "User deleted successfully"}

@app.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
    phone: str = Form(None),
    gender: str = Form(None),
    height: int = Form(None),
    body_type: str = Form(None),
    clothing_size: str = Form(None),
    jewelry_preference: str = Form(None),
    profile_image: UploadFile = File(None),
    tryon_image: UploadFile = File(None),
    role: str = Form("user")
):
    # 1. Validation
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    existing_user = await users_collection.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    supabase = get_supabase()
    
    # Generate a random ID for the user's storage folder since we aren't using Supabase Auth
    storage_uid = str(uuid.uuid4())

    # 2. Supabase Storage Upload (Auth is now handled by Mongo, so we just use Supabase as a bucket)
    profile_image_url = None
    tryon_image_url = None

    async def upload_image(file: UploadFile, bucket: str, folder: str):
        if not file:
            return None
        
        file_ext = file.filename.split(".")[-1]
        file_path = f"{folder}/{storage_uid}/{uuid.uuid4()}.{file_ext}"
        
        file_content = await file.read()
        
        try:
            supabase.storage.from_(bucket).upload(
                file_path,
                file_content,
                {"content-type": file.content_type}
            )
            
            # Get Public URL
            public_url = supabase.storage.from_(bucket).get_public_url(file_path)
            return public_url

        except Exception as e:
            print(f"Upload failed: {e}")
            return None

    if profile_image:
        profile_image_url = await upload_image(profile_image, "user-images", "profile-images")
    
    if tryon_image:
        tryon_image_url = await upload_image(tryon_image, "user-images", "try-on-images")

    from auth import get_password_hash

    # 3. Store in MongoDB with Hashed Password
    new_user = UserInDB(
        full_name=full_name,
        email=email,
        password=get_password_hash(password), # Hash the password
        phone=phone,
        gender=gender,
        height=height,
        body_type=body_type,
        clothing_size=clothing_size,
        jewelry_preference=jewelry_preference,
        profile_image_url=profile_image_url,
        tryon_image_url=tryon_image_url,
        supabase_uid=storage_uid, # Storing the storage folder ID here
        created_at=datetime.utcnow().isoformat(),
        role=role
    )
    
    user_dict = new_user.dict()
    # do NOT delete password, we need it stored (hashed)
    
    result = await users_collection.insert_one(user_dict)
    
    return {
        "message": "User registered successfully",
        "user_id": str(result.inserted_id),
        "supabase_uid": storage_uid
    }

@app.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    # MongoDB-only Login Flow
    user = await users_collection.find_one({"email": user_credentials.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify Password (passlib handles the hash comparison)
    # Since we are now Mongo-only, we expect ALL valid users to have a password hash in Mongo.
    if "password" not in user or not verify_password(user_credentials.password, user["password"]):
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("is_active", True):
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact admin.",
        )

    from auth import create_access_token # re-import or use top level
    from datetime import timedelta
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": user.get("role", "user")}

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        full_name=current_user.get("full_name", current_user.get("username", "Unknown")),
        email=current_user["email"],
        phone=current_user.get("phone"),
        gender=current_user.get("gender"),
        height=current_user.get("height"),
        body_type=current_user.get("body_type"),
        clothing_size=current_user.get("clothing_size"),
        jewelry_preference=current_user.get("jewelry_preference"),
        profile_image_url=current_user.get("profile_image_url"),
        tryon_image_url=current_user.get("tryon_image_url"),
        role=current_user.get("role", "user"),
        is_active=current_user.get("is_active", True),
        skin_tone=current_user.get("skin_tone"),
        preferred_categories=current_user.get("preferred_categories", []),
        preferred_colors=current_user.get("preferred_colors", []),
        notification_email=current_user.get("notification_email", True),
        notification_push=current_user.get("notification_push", True),
        auto_fit=current_user.get("auto_fit", True),
        fit_type=current_user.get("fit_type", "Regular Fit"),
        hq_rendering=current_user.get("hq_rendering", False),
        ar_mode=current_user.get("ar_mode", False)
    )

@app.put("/users/me", response_model=UserResponse)
async def update_user_me(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    
    if not update_data:
         raise HTTPException(status_code=400, detail="No data provided to update")

    await users_collection.update_one(
        {"_id": user_id},
        {"$set": update_data}
    )
    
    # Fetch updated user
    updated_user = await users_collection.find_one({"_id": user_id})
    
    return UserResponse(
        id=str(updated_user["_id"]),
        full_name=updated_user.get("full_name"),
        email=updated_user["email"],
        phone=updated_user.get("phone"),
        gender=updated_user.get("gender"),
        height=updated_user.get("height"),
        body_type=updated_user.get("body_type"),
        clothing_size=updated_user.get("clothing_size"),
        jewelry_preference=updated_user.get("jewelry_preference"),
        profile_image_url=updated_user.get("profile_image_url"),
        tryon_image_url=updated_user.get("tryon_image_url"),
        role=updated_user.get("role", "user"),
        is_active=updated_user.get("is_active", True),
        skin_tone=updated_user.get("skin_tone"),
        preferred_categories=updated_user.get("preferred_categories", []),
        preferred_colors=updated_user.get("preferred_colors", []),
        notification_email=updated_user.get("notification_email", True),
        notification_push=updated_user.get("notification_push", True),
        auto_fit=updated_user.get("auto_fit", True),
        fit_type=updated_user.get("fit_type", "Regular Fit"),
        hq_rendering=updated_user.get("hq_rendering", False),
        ar_mode=updated_user.get("ar_mode", False)
    )

@app.post("/users/change-password")
async def change_password(password_data: ChangePassword, current_user: dict = Depends(get_current_user)):
    from auth import get_password_hash, verify_password
    
    if not verify_password(password_data.old_password, current_user["password"]):
         raise HTTPException(status_code=400, detail="Incorrect old password")
         
    new_hash = get_password_hash(password_data.new_password)
    
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password": new_hash}}
    )
    
    return {"message": "Password updated successfully"}

@app.delete("/users/me")
async def delete_user_me(current_user: dict = Depends(get_current_user)):
    await users_collection.delete_one({"_id": current_user["_id"]})
    return {"message": "Account deleted successfully"}

@app.post("/verify-email")
async def verify_email(request: ForgotPasswordRequest):
    """Verify if email exists in the database"""
    user = await users_collection.find_one({"email": request.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found in our system"
        )
    
    return {
        "message": "Email verified successfully",
        "email": request.email
    }

@app.post("/reset-password-direct")
async def reset_password_direct(reset_data: ResetPasswordConfirm):
    """Reset password directly after email verification"""
    from auth import get_password_hash
    
    # Validate passwords match
    if reset_data.new_password != reset_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # Find user by email
    user = await users_collection.find_one({"email": reset_data.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    new_hash = get_password_hash(reset_data.new_password)
    
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": new_hash}}
    )
    
    return {"message": "Password reset successfully"}

# New Helper for Uploads
async def upload_file_to_supabase(file: UploadFile, bucket: str, path_prefix: str):
    supabase = get_supabase()
    file_ext = file.filename.split(".")[-1]
    file_path = f"{path_prefix}/{uuid.uuid4()}.{file_ext}"
    file_content = await file.read()
    
    try:
        supabase.storage.from_(bucket).upload(
            file_path,
            file_content,
            {"content-type": file.content_type}
        )
        return supabase.storage.from_(bucket).get_public_url(file_path)
    except Exception as e:
        print(f"Upload Error: {e}")
        return None

@app.post("/users/me/profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    url = await upload_file_to_supabase(file, "user-images", f"profile-images/users/{str(current_user['_id'])}")
    if not url:
        raise HTTPException(status_code=500, detail="Failed to upload image")
        
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"profile_image_url": url}}
    )
    return {"url": url}

@app.post("/users/me/tryon-image")
async def upload_tryon_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    url = await upload_file_to_supabase(file, "user-images", f"try-on-images/users/{str(current_user['_id'])}")
    if not url:
        raise HTTPException(status_code=500, detail="Failed to upload image")
        
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"tryon_image_url": url}}
    )
    return {"url": url}


# --------------------------------------------------------------------------------
# PRODUCT MANAGEMENT ENDPOINTS
# --------------------------------------------------------------------------------

@app.post("/admin/products", response_model=ProductResponse)
async def create_product(
    name: str = Form(...),
    description: str = Form(None),
    category: str = Form("Top"),
    gender: str = Form("Unisex"),
    tryon_type: str = Form("Upper body"),
    body_mapping: str = Form(None),
    overlay_scale: float = Form(1.0),
    offset_x: float = Form(0.0),
    offset_y: float = Form(0.0),
    rotation: float = Form(0.0),
    image: UploadFile = File(None)
    # user: dict = Depends(get_current_user) # Require admin in future
):
    # 1. Upload Image if provided
    image_url = None
    if image:
        image_url = await upload_file_to_supabase(image, "user-images", f"products/{category.lower()}/{gender.lower()}")

    # 2. Create Product Object
    new_product = {
        "name": name,
        "description": description,
        "category": category,
        "gender": gender,
        "tryon_type": tryon_type,
        "body_mapping": body_mapping,
        "overlay_scale": overlay_scale,
        "offset_x": offset_x,
        "offset_y": offset_y,
        "rotation": rotation,
        "is_active": True,
        "image_url": image_url,
        "created_at": datetime.now()
    }

    # 3. Insert into MongoDB
    result = await products_collection.insert_one(new_product)
    
    # 4. Return Response
    new_product["id"] = str(result.inserted_id)
    return ProductResponse(**new_product)

@app.get("/admin/products", response_model=list[ProductResponse])
async def get_all_products(category: str = None, gender: str = None):
    query = {}
    if category:
        query["category"] = category
    if gender:
        query["gender"] = gender
        
    products_cursor = products_collection.find(query).sort("created_at", -1)
    products = await products_cursor.to_list(length=100)
    
    # Handle products with invalid names (empty or too short)
    result = []
    for p in products:
        # Ensure name has at least 2 characters
        if not p.get("name") or len(p.get("name", "").strip()) < 2:
            p["name"] = "Unnamed Product"
        result.append(ProductResponse(id=str(p["_id"]), **p))
    
    return result

@app.get("/products", response_model=list[ProductResponse])
async def get_public_products(category: str = None, gender: str = None):
    query = {"is_active": True}
    if category and category != "All":
        query["category"] = category
    if gender:
        query["gender"] = gender
        
    products_cursor = products_collection.find(query).sort("created_at", -1)
    products = await products_cursor.to_list(length=100)
    
    # Handle products with invalid names (empty or too short)
    result = []
    for p in products:
        # Ensure name has at least 2 characters
        if not p.get("name") or len(p.get("name", "").strip()) < 2:
            p["name"] = "Unnamed Product"
        result.append(ProductResponse(id=str(p["_id"]), **p))
    
    return result

@app.put("/admin/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    name: str = Form(None),
    description: str = Form(None),
    category: str = Form(None),
    gender: str = Form(None),
    tryon_type: str = Form(None),
    body_mapping: str = Form(None),
    overlay_scale: float = Form(None),
    offset_x: float = Form(None),
    offset_y: float = Form(None),
    rotation: float = Form(None),
    is_active: bool = Form(None),
    image: UploadFile = File(None)
):
    # 1. Update Image if provided
    update_data = {}
    if image:
        # Fetch current product to find logic path if needed, or just upload new
        image_url = await upload_file_to_supabase(image, "user-images", "products/updated")
        if image_url:
             update_data["image_url"] = image_url

    # 2. Collect other fields
    if name is not None: update_data["name"] = name
    if description is not None: update_data["description"] = description
    if category is not None: update_data["category"] = category
    if gender is not None: update_data["gender"] = gender
    if tryon_type is not None: update_data["tryon_type"] = tryon_type
    if body_mapping is not None: update_data["body_mapping"] = body_mapping
    if overlay_scale is not None: update_data["overlay_scale"] = overlay_scale
    if offset_x is not None: update_data["offset_x"] = offset_x
    if offset_y is not None: update_data["offset_y"] = offset_y
    if rotation is not None: update_data["rotation"] = rotation
    if is_active is not None: update_data["is_active"] = is_active

    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")

    # 3. Update MongoDB
    result = await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")

    # 4. Return Updated Product
    updated_product = await products_collection.find_one({"_id": ObjectId(product_id)})
    return ProductResponse(id=str(updated_product["_id"]), **updated_product)

@app.delete("/admin/products/{product_id}")
async def delete_product(product_id: str):
    result = await products_collection.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

@app.put("/admin/products/{product_id}/status")
async def toggle_product_status(product_id: str, is_active: bool = Body(..., embed=True)):
    result = await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"is_active": is_active}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Status updated successfully", "is_active": is_active}


# --------------------------------------------------------------------------------
# CATEGORY MANAGEMENT ENDPOINTS
# --------------------------------------------------------------------------------

@app.post("/admin/categories", response_model=CategoryResponse)
async def create_category(
    name: str = Form(..., min_length=2),
    description: str = Form(None),
    image: UploadFile = File(None)
):
    # 1. Upload Image if provided
    image_url = None
    if image:
        image_url = await upload_file_to_supabase(image, "user-images", f"categories/{name.lower()}")

    # 2. Create Category Object
    new_category = {
        "name": name,
        "description": description,
        "image_url": image_url,
        "is_active": True,
        "created_at": datetime.now()
    }

    # 3. Insert into MongoDB
    result = await categories_collection.insert_one(new_category)
    
    # 4. Return Response
    new_category["id"] = str(result.inserted_id)
    return CategoryResponse(**new_category)

@app.get("/admin/categories", response_model=list[CategoryResponse])
async def get_all_categories():
    categories_cursor = categories_collection.find({}).sort("created_at", -1)
    categories = await categories_cursor.to_list(length=100)
    return [CategoryResponse(id=str(c["_id"]), **c) for c in categories]

@app.put("/admin/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    name: str = Form(None, min_length=2),
    description: str = Form(None),
    is_active: bool = Form(None),
    image: UploadFile = File(None)
):
    # 1. Update Image if provided
    update_data = {}
    if image:
        image_url = await upload_file_to_supabase(image, "user-images", "categories/updated")
        if image_url:
             update_data["image_url"] = image_url

    # 2. Collect other fields
    if name is not None: update_data["name"] = name
    if description is not None: update_data["description"] = description
    if is_active is not None: update_data["is_active"] = is_active

    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")

    # 3. Update MongoDB
    result = await categories_collection.update_one(
        {"_id": ObjectId(category_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")

    # 4. Return Updated Category
    updated_category = await categories_collection.find_one({"_id": ObjectId(category_id)})
    return CategoryResponse(id=str(updated_category["_id"]), **updated_category)

@app.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str):
    result = await categories_collection.delete_one({"_id": ObjectId(category_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}


# --------------------------------------------------------------------------------
# VIRTUAL TRY-ON ENDPOINTS
# --------------------------------------------------------------------------------

# CatVTON Processor (Diffusion-based, better quality than CP-VTON+)
CAT_PROCESSOR = CatVTONProcessor()

@app.post("/api/tryon/process", response_model=TryOnResponse)
async def process_virtual_tryon(
    user_image: UploadFile = File(...),
    product_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Process virtual try-on request
    
    Args:
        user_image: User's full-body photo
        product_id: ID of the product to try on
        current_user: Authenticated user
        
    Returns:
        TryOnResponse with result image URL
    """
    start_time = time.time()
    temp_user_image = None
    temp_garment_image = None
    temp_result_image = None
    
    try:
        # Using ONNX + OpenCV pipeline
        
        # 1. Fetch product details
        product = await products_collection.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        if not product.get("image_url"):
            raise HTTPException(status_code=400, detail="Product has no image")
        
        # 2. Save user image temporarily
        temp_user_image = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        content = await user_image.read()
        async with aiofiles.open(temp_user_image.name, 'wb') as f:
            await f.write(content)
        
        # 3. Download garment image from Supabase
        temp_garment_image = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
        # For now, we'll use a simple approach - in production, download from URL
        # This is a placeholder - you'd actually download the image from product['image_url']
        import requests
        garment_response = requests.get(product['image_url'])
        if garment_response.status_code == 200:
            async with aiofiles.open(temp_garment_image.name, 'wb') as f:
                await f.write(garment_response.content)
        else:
            raise HTTPException(status_code=500, detail="Failed to download product image")
        
        # 4. Process virtual try-on using CatVTON
        processor = CAT_PROCESSOR
        
        try:
            result_image_bytes = await processor.process_virtual_tryon(
                user_image_path=temp_user_image.name,
                garment_image_path=temp_garment_image.name,
                product_name=product.get('name', 'clothing item'),
                product_category=product.get('category', 'Dress')
            )
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Virtual try-on processing failed: {str(e)}"
            )
        
        # 5. Upload user's original image to Supabase
        supabase = get_supabase()
        user_id_str = str(current_user['_id'])
        
        # Upload original image
        original_path = f"tryon-originals/{user_id_str}/{uuid.uuid4()}.jpg"
        try:
            supabase.storage.from_("user-images").upload(
                original_path,
                content,
                {"content-type": "image/jpeg"}
            )
            original_url = supabase.storage.from_("user-images").get_public_url(original_path)
        except Exception as e:
            print(f"Failed to upload original image: {e}")
            original_url = None
        
        # 8. Upload result image to Supabase
        result_path = f"tryon-results/{user_id_str}/{uuid.uuid4()}.jpg"
        try:
            supabase.storage.from_("user-images").upload(
                result_path,
                result_image_bytes,
                {"content-type": "image/jpeg"}
            )
            result_url = supabase.storage.from_("user-images").get_public_url(result_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save result: {str(e)}")
        
        # 9. Calculate processing time
        processing_time = time.time() - start_time
        
        # 10. Save to database
        tryon_record = {
            "user_id": current_user['_id'],
            "product_id": ObjectId(product_id),
            "product_name": product.get('name', 'Unknown'),
            "product_category": product.get('category', 'Unknown'),
            "original_image_url": original_url,
            "result_image_url": result_url,
            "processing_time": processing_time,
            "status": "completed",
            "created_at": datetime.utcnow(),
            "metadata": {
                "model_used": "CatVTON-Diffusion",
                "api_provider": "local"
            }
        }
        
        result = await tryon_history_collection.insert_one(tryon_record)
        
        # 11. Return response
        return TryOnResponse(
            id=str(result.inserted_id),
            user_id=user_id_str,
            product_id=product_id,
            product_name=product.get('name', 'Unknown'),
            product_category=product.get('category', 'Unknown'),
            original_image_url=original_url or "",
            result_image_url=result_url,
            processing_time=processing_time,
            status="completed",
            created_at=tryon_record['created_at']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in virtual try-on: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    finally:
        # Cleanup temporary files
        for temp_file in [temp_user_image, temp_garment_image, temp_result_image]:
            if temp_file and os.path.exists(temp_file.name):
                try:
                    os.unlink(temp_file.name)
                except:
                    pass


@app.get("/api/tryon/history", response_model=TryOnHistoryResponse)
async def get_tryon_history(
    current_user: dict = Depends(get_current_user),
    limit: int = 20,
    skip: int = 0
):
    """
    Get user's virtual try-on history
    
    Args:
        current_user: Authenticated user
        limit: Maximum number of results
        skip: Number of results to skip (pagination)
        
    Returns:
        TryOnHistoryResponse with list of try-on results
    """
    try:
        # Get total count
        total_count = await tryon_history_collection.count_documents(
            {"user_id": current_user['_id']}
        )
        
        # Get history items
        cursor = tryon_history_collection.find(
            {"user_id": current_user['_id']}
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        items = await cursor.to_list(length=limit)
        
        # Convert to response models
        tryon_items = [
            TryOnResponse(
                id=str(item['_id']),
                user_id=str(item['user_id']),
                product_id=str(item['product_id']),
                product_name=item.get('product_name', 'Unknown'),
                product_category=item.get('product_category', 'Unknown'),
                original_image_url=item.get('original_image_url', ''),
                result_image_url=item.get('result_image_url', ''),
                processing_time=item.get('processing_time', 0.0),
                status=item.get('status', 'completed'),
                created_at=item.get('created_at', datetime.utcnow())
            )
            for item in items
        ]
        
        return TryOnHistoryResponse(
            items=tryon_items,
            total_count=total_count
        )
        
    except Exception as e:
        print(f"Error fetching try-on history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")


@app.delete("/api/tryon/history/{tryon_id}")
async def delete_tryon_result(
    tryon_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a try-on result from history
    
    Args:
        tryon_id: ID of the try-on result
        current_user: Authenticated user
        
    Returns:
        Success message
    """
    try:
        if not ObjectId.is_valid(tryon_id):
            raise HTTPException(status_code=400, detail="Invalid try-on ID")
        
        # Find the record
        record = await tryon_history_collection.find_one({
            "_id": ObjectId(tryon_id),
            "user_id": current_user['_id']
        })
        
        if not record:
            raise HTTPException(status_code=404, detail="Try-on result not found")
        
        # Delete from database
        await tryon_history_collection.delete_one({"_id": ObjectId(tryon_id)})
        
        # Optionally delete images from Supabase storage
        # (Commented out to preserve storage, uncomment if you want to delete)
        # supabase = get_supabase()
        # if record.get('original_image_url'):
        #     # Extract path and delete
        #     pass
        # if record.get('result_image_url'):
        #     # Extract path and delete
        #     pass
        
        return {"message": "Try-on result deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting try-on result: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete result")


@app.post("/api/products/remove-background")
async def remove_product_background(
    image: UploadFile = File(...)
):
    """
    Remove background from product image (utility endpoint for admins)
    
    Args:
        image: Product image file
        
    Returns:
        URL of processed image with transparent background
    """
    temp_input = None
    temp_output = None
    
    try:
        # Save input image
        temp_input = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
        content = await image.read()
        async with aiofiles.open(temp_input.name, 'wb') as f:
            await f.write(content)
        
        # Process background removal
        temp_output = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
        await remove_background(temp_input.name, temp_output.name)
        
        # Upload to Supabase
        supabase = get_supabase()
        output_path = f"products/no-bg/{uuid.uuid4()}.png"
        
        async with aiofiles.open(temp_output.name, 'rb') as f:
            output_content = await f.read()
        
        supabase.storage.from_("user-images").upload(
            output_path,
            output_content,
            {"content-type": "image/png"}
        )
        
        result_url = supabase.storage.from_("user-images").get_public_url(output_path)
        
        return {
            "message": "Background removed successfully",
            "url": result_url
        }
        
    except Exception as e:
        print(f"Error removing background: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")
    
    finally:
        # Cleanup
        for temp_file in [temp_input, temp_output]:
            if temp_file and os.path.exists(temp_file.name):
                try:
                    os.unlink(temp_file.name)
                except:
                    pass

