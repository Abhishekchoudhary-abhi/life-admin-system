from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from backend.core.config import settings

# Async Engine (for FastAPI)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False
)

# Sync Engine (for Workers/Scheduler)
# Convert asyncpg URL to psycopg2 URL
sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
sync_engine = create_engine(sync_url)
SessionLocal = sessionmaker(bind=sync_engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

def get_sync_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()