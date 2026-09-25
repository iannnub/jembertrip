import os
from io import BytesIO
from PIL import Image
from fastapi import UploadFile

def process_and_save_image(
    file: UploadFile, 
    dest_folder: str, 
    filename_base: str, 
    max_width: int = 1200, 
    quality: int = 80
) -> str:
    """
    Mengubah format gambar ke WebP, me-resize proporsional, mengompres kualitas,
    dan menyimpannya ke folder tujuan. Mengembalikan nama file yang disimpan.
    """
    os.makedirs(dest_folder, exist_ok=True)
    output_filename = f"{filename_base}.webp"
    output_path = os.path.join(dest_folder, output_filename)

    # Reset cursor file stream jika sudah terbaca sebelumnya
    try:
        file.file.seek(0)
    except Exception:
        pass

    # Baca stream gambar
    image = Image.open(file.file)

    # Konversi RGBA / Palette ke RGB jika perlu
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    # Resize proporsional jika melebihi batas max_width
    if image.width > max_width:
        height = int((max_width / image.width) * image.height)
        image = image.resize((max_width, height), Image.Resampling.LANCZOS)

    # Simpan sebagai WebP teroptimasi
    image.save(output_path, "WEBP", quality=quality, optimize=True)
    return output_filename
