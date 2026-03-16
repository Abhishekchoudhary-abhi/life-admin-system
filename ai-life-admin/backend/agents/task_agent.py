import requests
from typing import Optional
from datetime import datetime, timezone

API = "http://localhost:8000"

class TaskAgent:

    def get_all_tasks(self) -> list[dict]:
        """Get all pending tasks from API."""
        try:
            resp = requests.get(f"{API}/tasks/", timeout=5)
            return resp.json()
        except Exception as e:
            print(f"TaskAgent.get_all_tasks error: {e}")
            return []

    def create_task(self, title: str, priority: int = 2,
                    deadline: str = None, description: str = None) -> dict:
        """Create a new task."""
        try:
            payload = {
                "title":    title,
                "priority": priority,
            }
            if deadline:
                payload["deadline"] = deadline + "T23:59:00+00:00"
            if description:
                payload["description"] = description

            resp = requests.post(f"{API}/tasks/", json=payload, timeout=5)
            if resp.status_code == 201:
                return {"success": True, "task": resp.json()}
            return {"success": False, "error": resp.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def complete_task(self, keyword: str) -> dict:
        """Mark a task as done by keyword search."""
        try:
            tasks = self.get_all_tasks()
            match = None
            for t in tasks:
                if keyword.lower() in t["title"].lower() and t["status"] != "done":
                    match = t
                    break

            if not match:
                return {"success": False, "error": f"No task found matching '{keyword}'"}

            resp = requests.patch(
                f"{API}/tasks/{match['id']}",
                json={"status": "done"},
                timeout=5
            )
            return {"success": True, "task": match}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def format_task_list(self, tasks: list[dict]) -> str:
        """Format tasks into a readable string for AI."""
        if not tasks:
            return "No pending tasks."
        lines = []
        pending = [t for t in tasks if t["status"] != "done"]
        for t in pending[:10]:
            p = {1: "🔴", 2: "🟠", 3: "🟡", 4: "🟢"}.get(t["priority"], "⚪")
            deadline = f" (due {t['deadline'][:10]})" if t.get("deadline") else ""
            lines.append(f"{p} {t['title']}{deadline}")
        return "\n".join(lines) if lines else "No pending tasks."