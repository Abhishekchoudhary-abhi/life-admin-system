from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update
from backend.models.uims import Subject, TimetableSlot, Mark
from typing import List
import uuid

# --- Subjects & Attendance ---
async def get_subjects(db: AsyncSession) -> List[Subject]:
    result = await db.execute(select(Subject))
    return result.scalars().all()

async def create_subject(db: AsyncSession, name: str, faculty: str = None) -> Subject:
    db_subject = Subject(name=name, faculty=faculty)
    db.add(db_subject)
    await db.commit()
    await db.refresh(db_subject)
    return db_subject

async def update_attendance(db: AsyncSession, subject_id: uuid.UUID, attended: bool):
    # attended=True means success, False means missed
    subject = await db.get(Subject, subject_id)
    if subject:
        subject.total_classes += 1
        if attended:
            subject.attended_classes += 1
        await db.commit()
        await db.refresh(subject)
    return subject

async def delete_subject(db: AsyncSession, subject_id: uuid.UUID):
    await db.execute(delete(Subject).where(Subject.id == subject_id))
    await db.commit()

# --- Timetable ---
async def get_timetable(db: AsyncSession) -> List[TimetableSlot]:
    result = await db.execute(select(TimetableSlot).order_by(TimetableSlot.day, TimetableSlot.start_time))
    return result.scalars().all()

async def add_timetable_slot(db: AsyncSession, subject_id: uuid.UUID, day: str, start: str, end: str, room: str = None):
    db_slot = TimetableSlot(subject_id=subject_id, day=day, start_time=start, end_time=end, room=room)
    db.add(db_slot)
    await db.commit()
    await db.refresh(db_slot)
    return db_slot

async def delete_timetable_slot(db: AsyncSession, slot_id: uuid.UUID):
    await db.execute(delete(TimetableSlot).where(TimetableSlot.id == slot_id))
    await db.commit()

# --- Marks ---
async def get_marks(db: AsyncSession, subject_id: uuid.UUID = None) -> List[Mark]:
    query = select(Mark)
    if subject_id:
        query = query.where(Mark.subject_id == subject_id)
    result = await db.execute(query)
    return result.scalars().all()

async def add_mark(db: AsyncSession, subject_id: uuid.UUID, category: str, title: str, obtained: float, total: float):
    db_mark = Mark(subject_id=subject_id, category=category, title=title, obtained=obtained, total=total)
    db.add(db_mark)
    await db.commit()
    await db.refresh(db_mark)
    return db_mark

async def delete_mark(db: AsyncSession, mark_id: uuid.UUID):
    await db.execute(delete(Mark).where(Mark.id == mark_id))
    await db.commit()
