from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from backend.core.database import get_db
from backend.models.user import User
from backend.models.memory import ConversationMemory
from pydantic import BaseModel

from typing import Optional

router = APIRouter(prefix="/settings", tags=["Settings"])

class SettingsUpdate(BaseModel):
    preferred_voice: Optional[str] = None
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    username: Optional[str] = None
    email: Optional[str] = None

async def ensure_user(db: AsyncSession):
    result = await db.execute(select(User).limit(1))
    user = result.scalars().first()
    if not user:
        user = User(
            username="Alex Chen",
            email="alex.chen@university.edu",
            hashed_password="mock_password",
            preferred_voice="Nova",
            theme="Light",
            notifications_enabled=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user

@router.get("/")
async def get_settings(db: AsyncSession = Depends(get_db)):
    user = await ensure_user(db)
    return {
        "preferred_voice":       user.preferred_voice,
        "theme":                 user.theme,
        "notifications_enabled": user.notifications_enabled,
        "username":              user.username,
        "email":                 user.email
    }

@router.patch("/")
async def update_settings(payload: SettingsUpdate, db: AsyncSession = Depends(get_db)):
    user = await ensure_user(db)
    
    if payload.preferred_voice is not None:
        user.preferred_voice = payload.preferred_voice
    if payload.theme is not None:
        user.theme = payload.theme
    if payload.notifications_enabled is not None:
        user.notifications_enabled = payload.notifications_enabled
    if payload.username is not None:
        user.username = payload.username
    if payload.email is not None:
        user.email = payload.email
        
    await db.commit()
    return {"status": "ok"}

@router.post("/clear-cache")
async def clear_cache(db: AsyncSession = Depends(get_db)):
    """Clears AI memory logs."""
    await db.execute(delete(ConversationMemory))
    await db.commit()
    return {"status": "memory_cleared"}
