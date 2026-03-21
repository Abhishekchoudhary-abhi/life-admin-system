from backend.core.database import SessionLocal
from backend.models.task import Task as TaskModel
from sqlalchemy import select
from datetime import datetime, timezone

class TaskAgent:
    def get_all_tasks(self) -> list[dict]:
        """Get all tasks directly from DB."""
        db = SessionLocal()
        try:
            tasks = db.query(TaskModel).all()
            return [
                {
                    "id": str(t.id),
                    "title": t.title,
                    "priority": t.priority,
                    "status": t.status,
                    "deadline": t.deadline.isoformat() if t.deadline else None
                }
                for t in tasks
            ]
        finally:
            db.close()

    def create_task(self, title: str, priority: int = 2,
                    deadline: str = None, description: str = None) -> dict:
        """Create a new task directly in DB."""
        db = SessionLocal()
        try:
            due = None
            if deadline:
                try:
                    due = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
                except Exception:
                    pass
            
            new_task = TaskModel(
                title=title,
                priority=priority,
                deadline=due,
                description=description
            )
            db.add(new_task)
            db.commit()
            db.refresh(new_task)
            return {"success": True, "task": {"id": str(new_task.id), "title": new_task.title}}
        except Exception as e:
            db.rollback()
            return {"success": False, "error": str(e)}
        finally:
            db.close()

    def complete_task(self, keyword: str) -> dict:
        """Mark task as done."""
        db = SessionLocal()
        try:
            match = db.query(TaskModel).filter(
                TaskModel.title.ilike(f"%{keyword}%"),
                TaskModel.status != "done"
            ).first()

            if not match:
                return {"success": False, "error": f"No task matching '{keyword}'"}

            match.status = "done"
            match.updated_at = datetime.now(timezone.utc)
            db.commit()
            return {"success": True, "task": {"title": match.title}}
        except Exception as e:
            db.rollback()
            return {"success": False, "error": str(e)}
        finally:
            db.close()

    def format_task_list(self, tasks: list[dict]) -> str:
        if not tasks: return "No pending tasks."
        lines = []
        pending = [t for t in tasks if t["status"] != "done"]
        for t in pending[:10]:
            p = {1: "🔴", 2: "🟠", 3: "🟡", 4: "🟢"}.get(t["priority"], "⚪")
            deadline = f" (due {t['deadline'][:10]})" if t.get("deadline") else ""
            lines.append(f"{p} {t['title']}{deadline}")
        return "\n".join(lines) if lines else "No pending tasks."