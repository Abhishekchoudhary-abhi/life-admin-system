"""
Memory model — stores conversation turns per user/session.
Each row is one message (role=user or role=assistant).
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from backend.core.database import Base


class ConversationMemory(Base):
    __tablename__ = "conversation_memory"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(String(100), nullable=False, index=True)
    # For Telegram: session_id = str(chat_id)
    # For tests:   session_id = "test"

    role       = Column(String(10), nullable=False)
    # "user" or "assistant"

    content    = Column(Text, nullable=False)
    # The actual message text

    turn       = Column(Integer, nullable=False, default=0)
    # Monotonic turn counter within the session

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
