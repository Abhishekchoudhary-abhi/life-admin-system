from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.crud import uims as crud
from pydantic import BaseModel
import uuid
from typing import List, Optional

router = APIRouter(prefix="/uims", tags=["UIMS"])

# Pydantic Schemas
class SubjectCreate(BaseModel):
    name: str
    faculty: Optional[str] = None

class AttendanceUpdate(BaseModel):
    subject_id: uuid.UUID
    attended: bool # True = attended, False = missed

class AttendanceDecrease(BaseModel):
    subject_id: uuid.UUID
    type: str # "lecture" or "attendance"

class TimetableCreate(BaseModel):
    subject_id: uuid.UUID
    day: str
    start_time: str
    end_time: str
    room: Optional[str] = None

class MarkCreate(BaseModel):
    subject_id: uuid.UUID
    category: str
    title: str
    obtained: float
    total: float

class PredictionStatusUpdate(BaseModel):
    prediction_id: uuid.UUID
    status: str # "present", "absent", "leave"

# --- Subject Endpoints ---
@router.get("/subjects")
async def read_subjects(db: AsyncSession = Depends(get_db)):
    return await crud.get_subjects(db)

@router.post("/subjects")
async def create_subject(payload: SubjectCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_subject(db, payload.name, payload.faculty)

@router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await crud.delete_subject(db, subject_id)
    return {"message": "Deleted"}

# --- Attendance Endpoints ---
@router.post("/attendance/update")
async def update_attendance(payload: AttendanceUpdate, db: AsyncSession = Depends(get_db)):
    subject = await crud.update_attendance(db, payload.subject_id, payload.attended)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

@router.post("/attendance/decrease")
async def decrease_attendance(payload: AttendanceDecrease, db: AsyncSession = Depends(get_db)):
    subject = await crud.decrease_attendance(db, payload.subject_id, payload.type)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

# --- Timetable Endpoints ---
@router.get("/timetable")
async def read_timetable(db: AsyncSession = Depends(get_db)):
    return await crud.get_timetable(db)

@router.post("/timetable")
async def create_timetable_slot(payload: TimetableCreate, db: AsyncSession = Depends(get_db)):
    return await crud.add_timetable_slot(db, payload.subject_id, payload.day, payload.start_time, payload.end_time, payload.room)

@router.delete("/timetable/{slot_id}")
async def delete_timetable_slot(slot_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await crud.delete_timetable_slot(db, slot_id)
    return {"message": "Deleted"}

# --- Marks Endpoints ---
@router.get("/marks")
async def read_marks(subject_id: Optional[uuid.UUID] = None, db: AsyncSession = Depends(get_db)):
    return await crud.get_marks(db, subject_id)

@router.post("/marks")
async def create_mark(payload: MarkCreate, db: AsyncSession = Depends(get_db)):
    return await crud.add_mark(db, payload.subject_id, payload.category, payload.title, payload.obtained, payload.total)

@router.delete("/marks/{mark_id}")
async def delete_mark(mark_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await crud.delete_mark(db, mark_id)
    return {"message": "Deleted"}

# --- Attendance Prediction Endpoints ---
@router.post("/predictions/generate/{subject_id}")
async def generate_predictions(subject_id: uuid.UUID, days_ahead: int = 30, db: AsyncSession = Depends(get_db)):
    """Generate attendance predictions based on timetable and attendance percentage"""
    predictions = await crud.generate_attendance_predictions(db, subject_id, days_ahead)
    return {"predictions_generated": len(predictions), "predictions": predictions}

@router.get("/predictions/{subject_id}")
async def get_predictions(subject_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get all attendance predictions for a subject"""
    predictions = await crud.get_attendance_predictions(db, subject_id)
    return predictions

@router.post("/predictions/update-status")
async def update_prediction_status(payload: PredictionStatusUpdate, db: AsyncSession = Depends(get_db)):
    """Update the status of a prediction (present, absent, leave)"""
    prediction = await crud.update_prediction_status(db, payload.prediction_id, payload.status)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return prediction

@router.delete("/predictions/{prediction_id}")
async def delete_prediction(prediction_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Delete a prediction"""
    await crud.delete_prediction(db, prediction_id)
    return {"message": "Deleted"}

@router.delete("/predictions/clear/{subject_id}")
async def clear_predictions(subject_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Clear all predictions for a subject"""
    await crud.clear_predictions(db, subject_id)
    return {"message": "Predictions cleared"}
