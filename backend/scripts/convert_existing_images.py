# backend/scripts/convert_existing_images.py
import os
from PIL import Image

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")

def convert_all():
    if not os.path.exists(UPLOAD_DIR):
        print(f"Upload directory {UPLOAD_DIR} does not exist. Skipping.")
        return

    converted_count = 0
    for root, _, files in os.walk(UPLOAD_DIR):
        for f in files:
            if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                full_path = os.path.join(root, f)
                base_name = os.path.splitext(f)[0]
                out_path = os.path.join(root, f"{base_name}.webp")
                
                # Jangan overwrite jika sudah ada versi webp
                if os.path.exists(out_path):
                    continue

                try:
                    with Image.open(full_path) as img:
                        img = img.convert("RGB")
                        if img.width > 1200:
                            h = int((1200 / img.width) * img.height)
                            img = img.resize((1200, h), Image.Resampling.LANCZOS)
                        img.save(out_path, "WEBP", quality=80, optimize=True)
                    print(f"Converted: {f} -> {base_name}.webp")
                    converted_count += 1
                except Exception as err:
                    print(f"Failed {f}: {err}")

    print(f"Total gambar lama yang berhasil dioptimasi ke WebP: {converted_count}")

if __name__ == "__main__":
    convert_all()
