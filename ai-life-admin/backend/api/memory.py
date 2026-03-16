"""
Memory API — CRUD for conversation history.
Routes:
  POST   /memory/                    → save a turn
  GET    /memory/{session_id}        → get recent turns
  DELETE /memory/{session_id}        → clear a session
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete as sql_delete
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from backend.core.database import get_db
from backend.models.memory import ConversationMemory

router = APIRouter(prefix="/memory", tags=["Memory"])


class MemoryCreate(BaseModel):
    session_id: str
    role:       str     # "user" or "assistant"
    content:    str


# ── POST /memory/ ─────────────────────────────────────────────────
@router.post("/", status_code=201)
async def save_turn(payload: MemoryCreate, db: AsyncSession = Depends(get_db)):
    """Save one conversation turn."""
    # Get current max turn for this session
    result = await db.execute(
        select(ConversationMemory)
        .where(ConversationMemory.session_id == payload.session_id)
        .order_by(ConversationMemory.turn.desc())
        .limit(1)
    )
    last = result.scalar_one_or_none()
    next_turn = (last.turn + 1) if last else 0

    row = ConversationMemory(
        session_id = payload.session_id,
        role       = payload.role,
        content    = payload.content,
        turn       = next_turn,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


# ── GET /memory/{session_id} ──────────────────────────────────────
@router.get("/{session_id}")
async def get_history(
    session_id: str,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Get the last N messages for a session, oldest-first."""
    result = await db.execute(
        select(ConversationMemory)
        .where(ConversationMemory.session_id == session_id)
        .order_by(ConversationMemory.turn.desc())
        .limit(limit)
    )
    rows = result.scalars().all()
    # Reverse so oldest is first (correct chronological order for LLM)
    rows = list(reversed(rows))
    return [
        {
            "role":       r.role,
            "content":    r.content,
            "turn":       r.turn,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


# ── DELETE /memory/{session_id} ───────────────────────────────────
@router.delete("/{session_id}")
async def clear_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """Delete all conversation history for a session."""
    await db.execute(
        sql_delete(ConversationMemory)
        .where(ConversationMemory.session_id == session_id)
    )
    await db.commit()
    return {"status": "cleared", "session_id": session_id}
