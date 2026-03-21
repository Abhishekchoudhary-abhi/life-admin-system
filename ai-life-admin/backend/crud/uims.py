from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update
from backend.models.uims import Subject, TimetableSlot, Mark, AttendancePrediction
from typing import List
import uuid
from datetime import datetime, timedelta

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

async def decrease_attendance(db: AsyncSession, subject_id: uuid.UUID, type: str):
    # type: "lecture" removes one total class, "attendance" removes one attended class
    subject = await db.get(Subject, subject_id)
    if subject:
        if type == "lecture" and subject.total_classes > 0:
            subject.total_classes -= 1
            # Also decrease attended if it's greater than total
            if subject.attended_classes > subject.total_classes:
                subject.attended_classes -= 1
        elif type == "attendance" and subject.attended_classes > 0:
            subject.attended_classes -= 1
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

# --- Attendance Predictions ---
async def generate_attendance_predictions(db: AsyncSession, subject_id: uuid.UUID, days_ahead: int = 30):
    """Generate attendance predictions based on timetable and attendance percentage"""
    from collections import defaultdict
    
    # Get subject info
    subject = await db.get(Subject, subject_id)
    if not subject:
        return []
    
    # Get timetable slots for this subject
    result = await db.execute(select(TimetableSlot).where(TimetableSlot.subject_id == subject_id))
    timetable_slots = result.scalars().all()
    
    if not timetable_slots:
        return []
    
    # Calculate attendance percentage to predict status
    attendance_percentage = 0
    if subject.total_classes > 0:
        attendance_percentage = (subject.attended_classes / subject.total_classes) * 100
    
    # Determine default status based on attendance percentage
    # Below 75% -> likely to attend more, At 75%+ -> maintain or occasional leave/absence
    if attendance_percentage < 60:
        default_status = "present"  # Needs to attend more
    elif attendance_percentage < 75:
        default_status = "present"  # Still below 75%, should attend
    elif attendance_percentage < 85:
        default_status = "leave"    # Can miss some to balance
    else:
        default_status = "leave"    # Can miss more
    
    # Generate predictions for future classes
    predictions = []
    today = datetime.now().date()
    
    # Map day names to weekday numbers (0=Monday, 6=Sunday)
    day_map = {
        "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
        "Friday": 4, "Saturday": 5, "Sunday": 6
    }
    
    for slot in timetable_slots:
        slot_weekday = day_map.get(slot.day, 0)
        
        # Generate predictions for next X days
        for i in range(days_ahead):
            check_date = today + timedelta(days=i)
            
            # Skip past dates and today
            if check_date <= today:
                continue
            
            # Check if this date matches the timetable day
            if check_date.weekday() == slot_weekday:
                # Check if prediction already exists
                existing = await db.execute(
                    select(AttendancePrediction).where(
                        (AttendancePrediction.subject_id == subject_id) &
                        (AttendancePrediction.predicted_date == check_date) &
                        (AttendancePrediction.start_time == slot.start_time)
                    )
                )
                
                if not existing.scalars().first():
                    prediction = AttendancePrediction(
                        subject_id=subject_id,
                        predicted_date=check_date,
                        day=slot.day,
                        start_time=slot.start_time,
                        end_time=slot.end_time,
                        room=slot.room,
                        status=default_status
                    )
                    db.add(prediction)
                    predictions.append(prediction)
    
    if predictions:
        await db.commit()
    
    return predictions

async def get_attendance_predictions(db: AsyncSession, subject_id: uuid.UUID) -> List[AttendancePrediction]:
    """Get all attendance predictions for a subject, sorted by date"""
    result = await db.execute(
        select(AttendancePrediction)
        .where(AttendancePrediction.subject_id == subject_id)
        .order_by(AttendancePrediction.predicted_date, AttendancePrediction.start_time)
    )
    return result.scalars().all()

async def update_prediction_status(db: AsyncSession, prediction_id: uuid.UUID, status: str):
    """Update the status of a prediction (present, absent, leave)"""
    prediction = await db.get(AttendancePrediction, prediction_id)
    if prediction:
        prediction.status = status
        await db.commit()
        await db.refresh(prediction)
    return prediction

async def delete_prediction(db: AsyncSession, prediction_id: uuid.UUID):
    """Delete a prediction"""
    await db.execute(delete(AttendancePrediction).where(AttendancePrediction.id == prediction_id))
    await db.commit()

async def clear_predictions(db: AsyncSession, subject_id: uuid.UUID):
    """Clear all predictions for a subject"""
    await db.execute(delete(AttendancePrediction).where(AttendancePrediction.subject_id == subject_id))
    await db.commit()
