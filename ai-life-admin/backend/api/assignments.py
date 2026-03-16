from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from backend.core.database import get_db
from backend.models.assignment import Assignment

router = APIRouter(prefix="/assignments", tags=["Assignments"])

class AssignmentCreate(BaseModel):
    course_code: str
    title: str
    description: Optional[str] = None
    due_date: datetime
    weight_percent: Optional[float] = None
    estimated_hours: Optional[float] = None

class AssignmentUpdate(BaseModel):
    status: Optional[str] = None
    grade: Optional[float] = None
    estimated_hours: Optional[float] = None

# GET /assignments/ — list all pending assignments
@router.get("/")
async def list_assignments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Assignment)
        .where(Assignment.status != "submitted")
        .order_by(Assignment.due_date)
    )
    return result.scalars().all()

# POST /assignments/ — add a new assignment
@router.post("/", status_code=201)
async def create_assignment(
    payload: AssignmentCreate,
    db: AsyncSession = Depends(get_db)
):
    assignment = Assignment(**payload.model_dump())
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment

# PATCH /assignments/{id} — update status or grade
@router.patch("/{assignment_id}")
async def update_assignment(
    assignment_id: UUID,
    payload: AssignmentUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Assignment).where(Assignment.id == assignment_id)
    )
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(a, field, value)
    await db.commit()
    await db.refresh(a)
    return a

# DELETE /assignments/{id}
@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Assignment).where(Assignment.id == assignment_id)
    )
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await db.delete(a)
    await db.commit()
    return {"status": "deleted"}