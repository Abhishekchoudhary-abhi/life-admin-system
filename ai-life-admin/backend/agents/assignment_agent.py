from backend.core.database import SessionLocal
from backend.models.assignment import Assignment as AssignmentModel
from sqlalchemy import select
from datetime import datetime, timezone, timedelta

class AssignmentAgent:
    def get_all_assignments(self) -> list[dict]:
        """Get all pending assignments directly from DB."""
        db = SessionLocal()
        try:
            asgs = db.query(AssignmentModel).all()
            return [
                {
                    "id": str(a.id),
                    "course_code": a.course_code,
                    "title": a.title,
                    "due_date": a.due_date.isoformat() if a.due_date else None,
                    "status": a.status,
                    "weight_percent": a.weight_percent,
                    "estimated_hours": a.estimated_hours
                }
                for a in asgs
            ]
        finally:
            db.close()

    def create_assignment(self, course_code: str, title: str,
                          due_date: str, weight_percent: float = None,
                          estimated_hours: float = None) -> dict:
        """Create a new assignment directly inside DB."""
        db = SessionLocal()
        try:
            due = None
            if due_date:
                try:
                    due = datetime.fromisoformat(due_date.replace("Z", "+00:00"))
                except Exception:
                    pass
            
            new_asg = AssignmentModel(
                course_code=course_code,
                title=title,
                due_date=due,
                weight_percent=weight_percent,
                estimated_hours=estimated_hours
            )
            db.add(new_asg)
            db.commit()
            db.refresh(new_asg)
            return {"success": True, "assignment": {"id": str(new_asg.id)}}
        except Exception as e:
            db.rollback()
            return {"success": False, "error": str(e)}
        finally:
            db.close()

    def get_upcoming(self, days: int = 7) -> list[dict]:
        """Get assignments due within N days."""
        assignments = self.get_all_assignments()
        now    = datetime.now(timezone.utc)
        cutoff = now + timedelta(days=days)
        upcoming = []
        for a in assignments:
            if not a.get("due_date"): continue
            try:
                due = datetime.fromisoformat(a["due_date"].replace("Z", "+00:00"))
                if now <= due <= cutoff:
                    upcoming.append(a)
            except Exception:
                continue
        return upcoming

    def format_assignment_list(self, assignments: list[dict]) -> str:
        if not assignments: return "No upcoming assignments."
        lines = []
        for a in assignments[:10]:
            due = a["due_date"][:10] if a.get("due_date") else "No date"
            weight = f" ({a['weight_percent']}%)" if a.get("weight_percent") else ""
            lines.append(f"📘 {a['course_code']}{weight}: {a['title']} — due {due}")
        return "\n".join(lines)