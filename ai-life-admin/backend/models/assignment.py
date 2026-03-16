import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Boolean, Numeric
from sqlalchemy.dialects.postgresql import UUID
from backend.core.database import Base

class Assignment(Base):
    __tablename__ = "assignments"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id         = Column(UUID(as_uuid=True), nullable=True)
    course_code     = Column(String(20), nullable=False)   # e.g. CS301
    title           = Column(Text, nullable=False)
    description     = Column(Text, nullable=True)
    due_date        = Column(DateTime(timezone=True), nullable=False)
    weight_percent  = Column(Numeric(5, 2), nullable=True) # e.g. 30.00 means 30%
    estimated_hours = Column(Numeric(5, 1), nullable=True) # e.g. 4.5 hours
    status          = Column(String(20), default="pending")
    # status options: pending | in_progress | submitted | graded
    grade           = Column(Numeric(5, 2), nullable=True)
    reminder_sent   = Column(Boolean, default=False)
    created_at      = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )