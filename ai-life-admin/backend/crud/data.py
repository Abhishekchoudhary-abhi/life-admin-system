from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.models.task import Task
from backend.models.assignment import Assignment

async def get_all_tasks(db: AsyncSession):
    result = await db.execute(select(Task))
    return result.scalars().all()

async def get_all_assignments(db: AsyncSession):
    result = await db.execute(select(Assignment))
    return result.scalars().all()
