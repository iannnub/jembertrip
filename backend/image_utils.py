import os
from io import BytesIO
from PIL import Image, ImageOps, UnidentifiedImageError
from fastapi import UploadFile, HTTPException

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.tiff', '.heic'}

def process_and_save_image(
    file: UploadFile, 
    dest_folder: str, 
    filename_base: str, 
    max_width: int = 1200, 
    quality: int = 80
) -> str:
    """
    Mengubah format gambar ke WebP, menangani EXIF orientation kamera smartphone,
    me-resize proporsional, mengompres kualitas, dan menyimpannya ke folder tujuan.
    Mengembalikan nama file yang disimpan (.webp).
    """
    os.makedirs(dest_folder, exist_ok=True)
    output_filename = f"{filename_base}.webp"
    output_path = os.path.join(dest_folder, output_filename)

    # Validasi ekstensi jika ada filename
    if file.filename:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext and ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Format file '{ext}' tidak didukung. Harap gunakan gambar (JPG, PNG, WebP, dll)."
            )

    # Reset cursor file stream jika sudah terbaca sebelumnya
    try:
        file.file.seek(0)
    except Exception:
        pass

    # Baca file buffer dan cek ukuran
    try:
        content = file.file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Ukuran file gambar melebihi batas maksimal {MAX_FILE_SIZE // (1024 * 1024)} MB."
            )
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="File gambar kosong.")
        
        # Buka image dari BytesIO
        image = Image.open(BytesIO(content))
    except HTTPException:
        raise
    except (UnidentifiedImageError, Exception) as e:
        raise HTTPException(status_code=400, detail=f"File bukan format gambar yang valid atau rusak: {str(e)}")

    # Koreksi rotasi berdasarkan metadata EXIF (terutama untuk foto kamera smartphone)
    try:
        image = ImageOps.exif_transpose(image)
    except Exception:
        pass

    # Normalisasi Color Mode
    # WebP mendukung mode RGB dan RGBA
    if image.mode in ("RGBA", "LA"):
        image = image.convert("RGBA")
    elif image.mode == "P":
        if "transparency" in image.info:
            image = image.convert("RGBA")
        else:
            image = image.convert("RGB")
    elif image.mode != "RGB":
        image = image.convert("RGB")

    # Resize proporsional jika melebihi batas max_width
    if image.width > max_width:
        height = int((max_width / image.width) * image.height)
        image = image.resize((max_width, height), Image.Resampling.LANCZOS)

    # Simpan sebagai WebP teroptimasi
    try:
        image.save(output_path, "WEBP", quality=quality, optimize=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengompres gambar ke WebP: {str(e)}")

    return output_filename

