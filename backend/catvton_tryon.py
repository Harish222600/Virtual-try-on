# CatVTON Integration Wrapper for FastAPI Backend

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'CatVTON'))

import torch
import numpy as np
from PIL import Image
from model.pipeline import CatVTONPipeline
from diffusers.image_processor import VaeImageProcessor
import cv2

class CatVTONProcessor:
    def __init__(self):
        """Initialize CatVTON pipeline with auto-mask generation"""
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Loading CatVTON on {self.device}...")
        
        # Initialize pipeline
        self.pipeline = CatVTONPipeline(
            attn_ckpt_version="vitonhd",  # or "dresscode"
            attn_ckpt="zhengchong/CatVTON",  # HuggingFace model
            base_ckpt="booksforcharlie/stable-diffusion-inpainting",
            weight_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device=str(self.device),
            skip_safety_check=True
        )
        
        # Image processors
        self.vae_processor = VaeImageProcessor(vae_scale_factor=8)
        self.mask_processor = VaeImageProcessor(
            vae_scale_factor=8, 
            do_normalize=False, 
            do_binarize=True, 
            do_convert_grayscale=True
        )
        
        print("CatVTON Models Loaded Successfully!")
    
    def generate_simple_mask(self, person_image, height=512, width=384):
        """
        Generate a simple mask for the upper body area
        This is a fallback - ideally use SCHP or DensePose
        """
        # Convert to numpy
        img_np = np.array(person_image)
        h, w = img_np.shape[:2]
        
        # Create mask for upper body (rough approximation)
        mask = np.zeros((h, w), dtype=np.uint8)
        
        # Upper body region (adjust based on typical proportions)
        top = int(h * 0.15)  # Start below head
        bottom = int(h * 0.65)  # End at waist
        left = int(w * 0.2)
        right = int(w * 0.8)
        
        mask[top:bottom, left:right] = 255
        
        return Image.fromarray(mask)
    
    async def process_virtual_tryon(
        self, 
        user_image_path, 
        garment_image_path, 
        product_name="", 
        product_category="Upper Body",
        num_inference_steps=50,
        guidance_scale=2.5,
        height=512,
        width=384
    ):
        """
        Process virtual try-on using CatVTON
        
        Args:
            user_image_path: Path to user/person image
            garment_image_path: Path to garment/cloth image
            num_inference_steps: Number of diffusion steps (default: 50)
            guidance_scale: Classifier-free guidance scale (default: 2.5)
            height: Output height (default: 512)
            width: Output width (default: 384)
        
        Returns:
            bytes: PNG image bytes
        """
        try:
            print(f"[1/4] Loading Images...")
            # Load images
            person_image = Image.open(user_image_path).convert('RGB')
            cloth_image = Image.open(garment_image_path).convert('RGB')
            
            print(f"[2/4] Generating Mask...")
            # Generate mask (simple version - can be improved with SCHP)
            mask = self.generate_simple_mask(person_image, height, width)
            
            print(f"[3/4] Preprocessing...")
            # Preprocess images
            person_tensor = self.vae_processor.preprocess(person_image, height, width)[0]
            cloth_tensor = self.vae_processor.preprocess(cloth_image, height, width)[0]
            mask_tensor = self.mask_processor.preprocess(mask, height, width)[0]
            
            # Add batch dimension
            person_tensor = person_tensor.unsqueeze(0)
            cloth_tensor = cloth_tensor.unsqueeze(0)
            mask_tensor = mask_tensor.unsqueeze(0)
            
            print(f"[4/4] Running CatVTON Inference...")
            # Run inference
            generator = torch.Generator(device=str(self.device)).manual_seed(555)
            
            results = self.pipeline(
                person_tensor,
                cloth_tensor,
                mask_tensor,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                height=height,
                width=width,
                generator=generator,
            )
            
            # Get first result
            result_image = results[0]
            
            # Convert to bytes
            import io
            img_byte_arr = io.BytesIO()
            result_image.save(img_byte_arr, format='PNG')
            img_byte_arr = img_byte_arr.getvalue()
            
            print(f"✅ Try-On Complete!")
            return img_byte_arr
            
        except Exception as e:
            print(f"❌ Error in CatVTON: {e}")
            import traceback
            traceback.print_exc()
            return None
