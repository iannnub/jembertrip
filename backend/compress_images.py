import os
import glob
from PIL import Image

UPLOAD_DIR = "uploads"
MAX_WIDTH = 800

def compress_images():
    print(f"Memulai kompresi gambar di folder {UPLOAD_DIR}...")
    files = glob.glob(os.path.join(UPLOAD_DIR, "*"))
    
    total_saved = 0
    count = 0
    
    for file_path in files:
        if not os.path.isfile(file_path):
            continue
            
        try:
            original_size = os.path.getsize(file_path)
            
            with Image.open(file_path) as img:
                # Convert to RGB to prevent issues with RGBA -> JPEG
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                    
                # Resize if width is larger than MAX_WIDTH
                if img.width > MAX_WIDTH:
                    ratio = MAX_WIDTH / float(img.width)
                    new_height = int((float(img.height) * float(ratio)))
                    img = img.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)
                
                # Overwrite original file with highly compressed JPEG
                # Even if original was PNG, saving as JPEG with same name is usually fine for browsers
                img.save(file_path, "JPEG", optimize=True, quality=60)
            
            new_size = os.path.getsize(file_path)
            saved = original_size - new_size
            if saved > 0:
                total_saved += saved
                count += 1
                print(f"OK {os.path.basename(file_path)}: {original_size/1024:.0f} KB -> {new_size/1024:.0f} KB")
        except Exception as e:
            print(f"Gagal memproses {os.path.basename(file_path)}: {e}")
            
    print(f"\nSelesai! Berhasil mengompres {count} gambar.")
    print(f"Total kapasitas yang dihemat: {total_saved / (1024*1024):.2f} MB")

if __name__ == "__main__":
    compress_images()
