from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.core.database import engine, Base
from backend.api import tasks, assignments, memory
from backend.scheduler import scheduler
# Import models so SQLAlchemy registers them for auto-create
from backend.models import task, assignment  # noqa: F401
from backend.models import memory as memory_model  # noqa: F401

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    This runs when the API starts and stops.
    - Creates database tables automatically
    - Starts the background scheduler
    """
    # Create all database tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created")

    # Start the background job scheduler
    scheduler.start()
    print("✅ Scheduler started")

    yield  # API runs here

    # Cleanup when API shuts down
    scheduler.shutdown()
    print("Scheduler stopped")

# Create the FastAPI app
app = FastAPI(
    title="AI Life Admin API",
    version="1.0.0",
    description="Personal AI productivity assistant",
    lifespan=lifespan
)

# Allow the frontend (Next.js on port 3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route files
app.include_router(tasks.router)
app.include_router(assignments.router)
app.include_router(memory.router)

# Simple health check endpoint
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "message": "AI Life Admin API is running"
    }