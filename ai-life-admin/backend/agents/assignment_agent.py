import requests
from typing import Optional

API = "http://localhost:8000"

class AssignmentAgent:

    def get_all_assignments(self) -> list[dict]:
        """Get all pending assignments."""
        try:
            resp = requests.get(f"{API}/assignments/", timeout=5)
            return resp.json()
        except Exception as e:
            print(f"AssignmentAgent error: {e}")
            return []

    def create_assignment(self, course_code: str, title: str,
                          due_date: str, weight_percent: float = None,
                          estimated_hours: float = None) -> dict:
        """Create a new assignment."""
        try:
            payload = {
                "course_code": course_code,
                "title":       title,
                "due_date":    due_date + "T23:59:00+00:00",
            }
            if weight_percent:
                payload["weight_percent"] = weight_percent
            if estimated_hours:
                payload["estimated_hours"] = estimated_hours

            resp = requests.post(f"{API}/assignments/", json=payload, timeout=5)
            if resp.status_code == 201:
                return {"success": True, "assignment": resp.json()}
            return {"success": False, "error": resp.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_upcoming(self, days: int = 7) -> list[dict]:
        """Get assignments due within N days."""
        from datetime import datetime, timezone, timedelta
        assignments = self.get_all_assignments()
        now    = datetime.now(timezone.utc)
        cutoff = now + timedelta(days=days)
        upcoming = []
        for a in assignments:
            if not a.get("due_date"):
                continue
            try:
                due = datetime.fromisoformat(
                    a["due_date"].replace("Z", "+00:00")
                )
                if now <= due <= cutoff:
                    upcoming.append(a)
            except Exception:
                continue
        return upcoming

    def format_assignment_list(self, assignments: list[dict]) -> str:
        """Format assignments into readable string."""
        if not assignments:
            return "No upcoming assignments."
        lines = []
        for a in assignments[:10]:
            due = a["due_date"][:10] if a.get("due_date") else "No date"
            weight = f" ({a['weight_percent']}%)" if a.get("weight_percent") else ""
            lines.append(f"📘 {a['course_code']}{weight}: {a['title']} — due {due}")
        return "\n".join(lines)