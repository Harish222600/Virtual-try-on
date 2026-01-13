from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from typing import List

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None
    gender: Optional[str] = None
    height: Optional[int] = None
    body_type: Optional[str] = None
    clothing_size: Optional[str] = None
    jewelry_preference: Optional[str] = None
    # New Settings Fields
    skin_tone: Optional[str] = None
    preferred_categories: List[str] = []
    preferred_colors: List[str] = []
    notification_email: bool = True
    notification_push: bool = True
    auto_fit: bool = True
    fit_type: str = "Regular Fit"
    hq_rendering: bool = False
    ar_mode: bool = False
    
    role: str = "user"
    is_active: bool = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    height: Optional[int] = None
    body_type: Optional[str] = None
    clothing_size: Optional[str] = None
    jewelry_preference: Optional[str] = None
    skin_tone: Optional[str] = None
    preferred_categories: Optional[List[str]] = None
    preferred_colors: Optional[List[str]] = None
    notification_email: Optional[bool] = None
    notification_push: Optional[bool] = None
    auto_fit: Optional[bool] = None
    fit_type: Optional[str] = None
    hq_rendering: Optional[bool] = None
    ar_mode: Optional[bool] = None

class UserInDB(UserCreate):
    profile_image_url: Optional[str] = None
    tryon_image_url: Optional[str] = None
    supabase_uid: str
    created_at: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ChangePassword(BaseModel):
    old_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordConfirm(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    gender: Optional[str] = None
    height: Optional[int] = None
    body_type: Optional[str] = None
    clothing_size: Optional[str] = None
    jewelry_preference: Optional[str] = None
    skin_tone: Optional[str] = None
    preferred_categories: List[str] = []
    preferred_colors: List[str] = []
    notification_email: bool = True
    notification_push: bool = True
    auto_fit: bool = True
    fit_type: str = "Regular Fit"
    hq_rendering: bool = False
    ar_mode: bool = False
    
    profile_image_url: Optional[str] = None
    tryon_image_url: Optional[str] = None
    role: str = "user"
    is_active: bool = True


# Product Management Models
class ProductBase(BaseModel):
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    category: str  # Top, Bottom, Dress, Jewelry
    gender: str = "Unisex" # Men, Women, Unisex
    
    # Try-On Configuration
    tryon_type: str = "Upper body" # Upper body, Lower body, Full body, Face
    body_mapping: Optional[str] = None # Chest, Waist, Neck, Ear, Wrist
    overlay_scale: float = 1.0
    offset_x: float = 0.0
    offset_y: float = 0.0
    rotation: float = 0.0
    
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    gender: Optional[str] = None
    tryon_type: Optional[str] = None
    body_mapping: Optional[str] = None
    overlay_scale: Optional[float] = None
    offset_x: Optional[float] = None
    offset_y: Optional[float] = None
    rotation: Optional[float] = None
    is_active: Optional[bool] = None
    image_url: Optional[str] = None

class ProductResponse(ProductBase):
    id: str
    image_url: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        arbitrary_types_allowed = True

# Category Management Models
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class CategoryResponse(CategoryBase):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        arbitrary_types_allowed = True

# Virtual Try-On Models
class TryOnRequest(BaseModel):
    product_id: str

class TryOnResponse(BaseModel):
    id: str
    user_id: str
    product_id: str
    product_name: str
    product_category: str
    original_image_url: str
    result_image_url: str
    processing_time: float
    status: str  # 'processing', 'completed', 'failed'
    created_at: datetime
    
    class Config:
        arbitrary_types_allowed = True

class TryOnHistoryResponse(BaseModel):
    items: List[TryOnResponse]
    total_count: int
