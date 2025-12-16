# backend/security.py

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

# --- KONFIGURASI KEAMANAN ---
SECRET_KEY = "jembertrip_rahasia_banget_kuncinya_jangan_disebar_luas"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60 

# --- SETUP HASHER (PERBAIKAN DI SINI) ---
# Kita ganti "bcrypt" menjadi "pbkdf2_sha256" agar tidak error di Windows
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# --- FUNGSI-FUNGSI BANTUAN ---

def verify_password(plain_password, hashed_password):
    """
    Fungsi untuk mengecek apakah password yang diinput user (plain)
    cocok dengan password acak di database (hashed).
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """
    Fungsi untuk mengacak password user sebelum disimpan ke database.
    """
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Fungsi untuk membuat JWT Token (Tiket Masuk).
    Token ini berisi data user (email/role) dan waktu kadaluarsa.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt