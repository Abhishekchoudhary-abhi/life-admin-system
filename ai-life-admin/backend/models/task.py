import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from backend.core.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id           = Column(UUID(as_uuid=True), nullable=True)
    title             = Column(Text, nullable=False)
    description       = Column(Text, nullable=True)
    priority          = Column(Integer, default=2)
    # priority meaning: 1=critical  2=high  3=medium  4=low
    status            = Column(String(20), default="todo")
    # status options: todo | in_progress | blocked | done | cancelled
    estimated_minutes = Column(Integer, nullable=True)
    deadline          = Column(DateTime(timezone=True), nullable=True)
    scheduled_at      = Column(DateTime(timezone=True), nullable=True)
    source            = Column(String(50), default="manual")
    # source options: manual | email | assignment | ai_generated
    tags              = Column(ARRAY(Text), default=list)
    created_at        = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at        = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    deleted_at        = Column(DateTime(timezone=True), nullable=True)
    # deleted_at: when this is filled in, the task is "soft deleted"
    # it stays in database but is hidden from the user