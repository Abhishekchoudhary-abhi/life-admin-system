from sqlalchemy import Column, String, Integer, Float, ForeignKey, JSON, Enum, Time, UUID, Date
from sqlalchemy.orm import relationship
import uuid
import enum
from backend.core.database import Base
from datetime import datetime

class MarkCategory(str, enum.Enum):
    ASSIGNMENT = "assignment"
    MST1 = "mst1"
    MST2 = "mst2"
    PRACTICAL = "practical"
    FINAL = "final"

class Subject(Base):
    __tablename__ = "subjects"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name             = Column(String(100), nullable=False)
    faculty          = Column(String(100), nullable=True)
    total_classes    = Column(Integer, default=0)
    attended_classes = Column(Integer, default=0)
    
    # Relationships
    marks      = relationship("Mark", back_populates="subject", cascade="all, delete-orphan")
    timetable  = relationship("TimetableSlot", back_populates="subject", cascade="all, delete-orphan")

class TimetableSlot(Base):
    __tablename__ = "timetable_slots"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    day        = Column(String(20), nullable=False) # Monday, Tuesday, etc.
    start_time = Column(String(20), nullable=False) # "09:00"
    end_time   = Column(String(20), nullable=False) # "10:00"
    room       = Column(String(50), nullable=True)

    subject    = relationship("Subject", back_populates="timetable")

class Mark(Base):
    __tablename__ = "marks"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    category   = Column(String(50), nullable=False) # MarkCategory
    title      = Column(String(100), nullable=False) # "Assignment 1"
    obtained   = Column(Float, nullable=False)
    total      = Column(Float, nullable=False)

    subject    = relationship("Subject", back_populates="marks")

class AttendancePrediction(Base):
    __tablename__ = "attendance_predictions"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id      = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    predicted_date  = Column(Date, nullable=False) # The date of the predicted class
    day             = Column(String(20), nullable=False) # Monday, Tuesday, etc.
    start_time      = Column(String(20), nullable=False) # "09:00"
    end_time        = Column(String(20), nullable=False) # "10:00"
    room            = Column(String(50), nullable=True)
    status          = Column(String(20), default="present") # "present", "absent", "leave"
    
    subject         = relationship("Subject")
