import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from backend.core.database import Base

class User(Base):
    __tablename__ = "users"  # this is the table name in PostgreSQL

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email           = Column(String(255), unique=True, nullable=False)
    username        = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active       = Column(Boolean, default=True)
    
    # Settings / Preferences
    preferred_voice       = Column(String(50), default="Nova")
    theme                 = Column(String(20), default="Light")
    notifications_enabled = Column(Boolean, default=True)
    
    created_at      = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )