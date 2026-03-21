from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.crud.data import get_all_tasks, get_all_assignments
from backend.agents.smart_scheduler import SmartSchedulerAgent
from backend.agents.planning_agent import PlanningAgent
from pydantic import BaseModel
import asyncio

router = APIRouter(prefix="/ai", tags=["AI"])

class ScheduleRequest(BaseModel):
    days: int = 3

async def get_combined_data(db: AsyncSession):
    tasks = await get_all_tasks(db)
    assignments = await get_all_assignments(db)
    # Convert to list of dicts for agents
    tasks_data = [
        {"id": str(t.id), "title": t.title, "priority": t.priority, "status": t.status, "deadline": t.deadline.isoformat() if t.deadline else None, "estimated_minutes": t.estimated_minutes}
        for t in tasks
    ]
    asg_data = [
        {"id": str(a.id), "title": a.title, "course_code": a.course_code, "due_date": a.due_date.isoformat() if a.due_date else None, "status": a.status, "weight_percent": a.weight_percent, "estimated_hours": a.estimated_hours}
        for a in assignments
    ]
    return tasks_data, asg_data

@router.get("/briefing")
async def get_briefing(db: AsyncSession = Depends(get_db)):
    """Get a fresh, time-aware briefing."""
    tasks, asgs = await get_combined_data(db)
    agent = PlanningAgent()
    # Run sync LLM generation in thread to avoid blocking loop
    briefing = await asyncio.to_thread(agent.generate_briefing, tasks, asgs)
    return {"briefing": briefing}

@router.post("/schedule")
async def generate_schedule(payload: ScheduleRequest, db: AsyncSession = Depends(get_db)):
    """Generate a multi-day schedule plan."""
    tasks, asgs = await get_combined_data(db)
    agent = SmartSchedulerAgent()
    plan = await asyncio.to_thread(agent.generate_plan, tasks, asgs, payload.days)
    return {"plan": plan}

@router.get("/strategy")
async def get_lifestyle_strategy():
    """Get a high-level lifestyle and study strategy."""
    agent = PlanningAgent()
    strategy = await asyncio.to_thread(agent.generate_lifestyle_plan)
    return {"strategy": strategy}

@router.get("/slots")
async def get_suggested_slots(db: AsyncSession = Depends(get_db)):
    """Get structured time slots suggested by AI."""
    tasks, asgs = await get_combined_data(db)
    agent = SmartSchedulerAgent()
    slots = await asyncio.to_thread(agent.suggest_slots, tasks, asgs)
    return {"slots": slots}

class RoadmapRequest(BaseModel):
    topics: str
    milestones: dict
    days: int = 14

@router.post("/roadmap")
async def generate_roadmap(payload: RoadmapRequest):
    """Generate a multi-day academic roadmap."""
    agent = PlanningAgent()
    content = await asyncio.to_thread(
        agent.generate_academic_roadmap, 
        payload.topics, 
        payload.milestones, 
        payload.days
    )
    return {"roadmap": content}
