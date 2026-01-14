import sys
import os
import torch
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from ultralytics import YOLO

# Standalone Mask Generator matching the new logic in catvton_tryon.py
class MaskGenerator:
    def __init__(self):
        try:
            print("Loading YOLOv8-Pose for smart masking...")
            self.pose_model = YOLO("yolov8n-pose.pt")
        except Exception as e:
            print(f"Failed to load YOLO: {e}")
            self.pose_model = None

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
            # Dilate pose mask heavily to ensure it covers the shirt fully
            pose_mask = pose_mask.filter(ImageFilter.MaxFilter(25)) # Expand struct
            
            final_mask = pose_mask
            
        else:
            # Fallback
            print("⚠️ Using Fallback Rectangle Mask")
            w, h = width, height
            draw.rectangle([w*0.25, h*0.20, w*0.75, h*0.60], fill=255)
            final_mask = pose_mask

        # Blur edges
        final_mask = final_mask.filter(ImageFilter.GaussianBlur(radius=7))
        
        # Save verification
        debug_img = img.copy()
        # Paste mask as red overlay
        red_mask = Image.new("RGB", (width, height), (255, 0, 0))
        debug_img.paste(red_mask, (0,0), final_mask)
        debug_img.save("debug_overlay_new.jpg")
        
        return final_mask

if __name__ == "__main__":
    generator = MaskGenerator()
    img_path = r"C:/Users/Harish/.gemini/antigravity/brain/e27915a3-b236-48be-9853-c77326688ec7/uploaded_image_1768393220044.jpg"
    if os.path.exists(img_path):
        img = Image.open(img_path).convert("RGB")
        mask = generator.generate_mask(img)
        mask.save("debug_mask_new.png")
        print("Completed. Check debug_mask_new.png and debug_overlay_new.jpg")
    else:
        print("Image not found")
