# CatVTON Integration Wrapper for FastAPI Backend

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'CatVTON'))

import torch
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from model.pipeline import CatVTONPipeline
from diffusers.image_processor import VaeImageProcessor
import cv2
import io
# Intelligent Masking Libraries
try:
    from ultralytics import YOLO
    from rembg import remove
    HAS_SMART_MASK = True
except ImportError:
    print("⚠️ ultralytics or rembg not found. Smart masking disabled.")
    HAS_SMART_MASK = False

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
        
        # Initialize YOLO for Smart Masking
        self.pose_model = None
        if HAS_SMART_MASK:
            try:
                print("Loading YOLOv8-Pose for smart masking...")
                self.pose_model = YOLO("yolov8n-pose.pt")
            except Exception as e:
                print(f"Failed to load YOLO: {e}")
        
        print("CatVTON Models Loaded Successfully!")
    
    def generate_mask(self, person_image, height=768, width=576):
        """
        Generate an intelligent mask for the upper body.
        Combines Rembg (Silhouette) + YOLOv8-Pose (Structure) for perfect fit.
        """
        # Resize image to target dimensions first
        img = person_image.resize((width, height), Image.Resampling.LANCZOS)
        
        # 1. Get Body Silhouette (Pixel Perfect)
        try:
            # Simple rembg call
            from rembg import remove
            # Get the alpha matte
            no_bg = remove(img)
            silhouette = no_bg.split()[-1] # Alpha channel
            print("✅ Generated Silhouette with Rembg")
        except Exception as e:
            print(f"⚠️ Rembg failed: {e}")
            silhouette = Image.new("L", (width, height), 0)

        # 2. Get Geometric Torso Mask (Structure)
        pose_mask = Image.new("L", (width, height), 0)
        draw = ImageDraw.Draw(pose_mask)
        
        has_pose = False
        
        if self.pose_model:
            try:
                results = self.pose_model(img, verbose=False)
                if results and len(results[0].keypoints) > 0:
                    keypoints = results[0].keypoints.xy.cpu().numpy()[0]
                    
                    # COCO Keypoints: 0=Nose, 5=L_Shoulder, 6=R_Shoulder, 11=L_Hip, 12=R_Hip
                    if len(keypoints) > 12 and np.all(keypoints[5] > 0) and np.all(keypoints[12] > 0):
                        
                        l_shoulder = keypoints[5]
                        r_shoulder = keypoints[6]
                        r_hip = keypoints[12]
                        l_hip = keypoints[11]
                        
                        # Define Torso Polygon (Trapezoid)
                        polygon = [
                            tuple(l_shoulder), 
                            tuple(r_shoulder), 
                            tuple(r_hip), 
                            tuple(l_hip)
                        ]
                        draw.polygon(polygon, fill=255)
                        
                        # --- SAFE NECK MASKING ---
                        # Instead of a fixed ellipse that hits the face, 
                        # we detect the "Chin/Neck Line" using the Nose (0) and Shoulders.
                        
                        neck_base_x = (l_shoulder[0] + r_shoulder[0]) / 2
                        neck_base_y = (l_shoulder[1] + r_shoulder[1]) / 2
                        
                        # If we have a nose, use it as the upper limit
                        nose = keypoints[0] if keypoints[0][1] > 0 else None
                        
                        if nose is not None:
                            # Neck top is halfway between nose and shoulder line
                            neck_top_y = (nose[1] + neck_base_y) / 2
                            # Don't go higher than 80% of the way to the nose
                            safe_limit = nose[1] + (neck_base_y - nose[1]) * 0.2
                            if neck_top_y < safe_limit:
                                neck_top_y = safe_limit
                        else:
                            # Fallback if no nose: just go up 30-40 pixels from shoulders (conservative)
                            neck_top_y = neck_base_y - 40

                        # Draw subtle neck connection
                        # Rectangle from neck base up to neck_top
                        neck_width = abs(l_shoulder[0] - r_shoulder[0]) * 0.4
                        draw.rectangle([
                            neck_base_x - neck_width/2, 
                            neck_top_y, 
                            neck_base_x + neck_width/2, 
                            neck_base_y + 10 # slightly overlaps torso
                        ], fill=255)

                        has_pose = True
                        print("✅ Generated Structural Mask with Pose")

            except Exception as e:
                print(f"⚠️ Smart mask failed: {e}")

        # 3. Combine Masks
        if has_pose:
            # If we have pose, we want the Intersection of (Torso_Shape OR Background_Spill) AND Silhouette?
            # Actually, we want: Where is the BODY (Silhouette) AND Where is the TORSO (Pose)
            # But Rembg often removes the clothes we want to replace if strict.
            # Strategy: 
            # 1. Dilate Pose Mask to cover all clothing area loosely.
            # 2. Intersect with Silhouette (if Rembg kept the clothes).
            #    Problem: Rembg might remove the shirt if it thinks it's background? No, usually keeps person.
            # Let's try: Pose Mask (Dilated) as the PRIMARY guide. 
            
            # Dilate pose mask heavily to ensure it covers the shirt fully
            # (We want to mask OUT the old shirt)
            pose_mask = pose_mask.filter(ImageFilter.MaxFilter(25)) # Expand struct
            
            # Improve: Use the silhouette to 'trim' the pose mask so it doesn't spill into background?
            # intersection = ImageChops.multiply(pose_mask, silhouette) 
            # But if pose mask is wider than silhouette, we might miss loose cloth. 
            # If pose mask is narrower, we miss cloth.
            
            # Simple & Robust Strategy: 
            # Use the Pose Mask (Dilated) but SUBTRACT the Face area?
            # We already handled Face safety with `neck_top_y`.
            
            final_mask = pose_mask
            
        else:
            # Fallback
            print("⚠️ Using Fallback Rectangle Mask")
            w, h = width, height
            draw.rectangle([w*0.25, h*0.20, w*0.75, h*0.60], fill=255)
            final_mask = pose_mask

        # Blur edges
        final_mask = final_mask.filter(ImageFilter.GaussianBlur(radius=7))
        return final_mask
    
    async def process_virtual_tryon(
        self, 
        user_image_path, 
        garment_image_path, 
        product_name="", 
        product_category="Upper Body",
        num_inference_steps=50,
        guidance_scale=2.5,
        height=768, # Increased Resolution
        width=576
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
            
            print(f"[2/4] Preprocessing & Masking...")
            # 1. Preprocess Person Image first to ensure we work with the exact crop/resize the model sees
            # Returns [1, 3, H, W]
            person_tensor = self.vae_processor.preprocess(person_image, height, width)[0].unsqueeze(0)
            
            # 2. Get the aligned PIL image back for masking
            # This ensures (height, width) and aspect ratio are consistent
            aligned_person_pil = self.vae_processor.postprocess(person_tensor, output_type="pil")[0]
            
            # 3. Generate Mask on the aligned image
            mask = self.generate_mask(aligned_person_pil, height, width)
            
            # 4. Preprocess other inputs
            cloth_tensor = self.vae_processor.preprocess(cloth_image, height, width)[0].unsqueeze(0)
            mask_tensor = self.mask_processor.preprocess(mask, height, width)[0].unsqueeze(0)
            
            # Dimensions are already batched from unsqueeze(0)
            
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
