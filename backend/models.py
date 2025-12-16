from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base 

# --- MODEL USER ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True) # Username Login
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="user") 
    avatar = Column(String, nullable=True)

    history_items = relationship("History", back_populates="owner")
    chat_sessions = relationship("ChatSession", back_populates="user")

# --- MODEL HISTORY ---
class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    wisata_id = Column(String)
    wisata_name = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="history_items")

# --- MODEL CHAT SESSION ---
class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, default="Percakapan Baru") 
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_sessions")
    
    # [FIX RELASI] Ganti back_populates ke "chat_session" biar jelas
    messages = relationship("ChatMessage", back_populates="chat_session", cascade="all, delete-orphan")

# --- MODEL CHAT MESSAGE ---
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    sender = Column(String) 
    content = Column(Text)
    recommendations = Column(JSON, nullable=True) 
    sources = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # [FIX RELASI] Ganti nama variabel jadi chat_session agar match dengan ChatSession.messages
    chat_session = relationship("ChatSession", back_populates="messages")