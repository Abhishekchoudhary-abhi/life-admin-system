"""
SmartSchedulerAgent — AI-powered study/work planner.

Given a list of tasks and assignments, it analyses deadlines,
priorities and estimated hours, then produces a concrete daily
schedule recommendation using the Groq LLM.

Usage:
    agent = SmartSchedulerAgent()
    plan  = agent.generate_plan()   # returns a formatted string
    slots = agent.suggest_slots()   # returns structured list of slots
"""
import json
import requests
from datetime import datetime, timezone, timedelta
from typing import Optional
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from backend.core.config import settings

API = "http://localhost:8000"


class SmartSchedulerAgent:

    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.3,
            api_key=settings.GROQ_API_KEY,
        )

    # ── Fetch data ──────────────────────────────────────────────────
    def _fetch_tasks(self) -> list[dict]:
        try:
            resp = requests.get(f"{API}/tasks/", timeout=5)
            tasks = resp.json()
            return [t for t in tasks if t.get("status") not in ("done", "cancelled")]
        except Exception as e:
            print(f"[Scheduler] Fetch tasks error: {e}")
            return []

    def _fetch_assignments(self) -> list[dict]:
        try:
            resp = requests.get(f"{API}/assignments/", timeout=5)
            return resp.json()
        except Exception as e:
            print(f"[Scheduler] Fetch assignments error: {e}")
            return []

    # ── Core: generate a natural language schedule ──────────────────
    def generate_plan(self, days_ahead: int = 3) -> str:
        """
        Ask the LLM to produce a day-by-day study/work plan
        for the next N days based on current tasks and assignments.
        Returns a formatted markdown string.
        """
        tasks       = self._fetch_tasks()
        assignments = self._fetch_assignments()
        now         = datetime.now(timezone.utc)

        if not tasks and not assignments:
            return "📭 No tasks or assignments to schedule. You're free! 🎉"

        # Build a compact data summary for the LLM
        task_lines = []
        for t in tasks[:10]:
            p      = {1: "CRITICAL", 2: "HIGH", 3: "MEDIUM", 4: "LOW"}.get(t["priority"], "MEDIUM")
            dl     = t["deadline"][:10] if t.get("deadline") else "no deadline"
            mins   = f", ~{t['estimated_minutes']}min" if t.get("estimated_minutes") else ""
            task_lines.append(f"  - [{p}] {t['title']} (due: {dl}{mins})")

        assign_lines = []
        for a in assignments[:8]:
            due    = a["due_date"][:10] if a.get("due_date") else "no date"
            weight = f", {a['weight_percent']}% of grade" if a.get("weight_percent") else ""
            est    = f", ~{a['estimated_hours']}h" if a.get("estimated_hours") else ""
            assign_lines.append(
                f"  - {a['course_code']}: {a['title']} (due: {due}{weight}{est})"
            )

        today        = now.strftime("%A %Y-%m-%d")
        horizon_date = (now + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

        data_block = (
            f"TODAY: {today}\n"
            f"PLANNING HORIZON: next {days_ahead} days (until {horizon_date})\n\n"
            f"PENDING TASKS ({len(tasks)}):\n" + "\n".join(task_lines or ["  - none"]) + "\n\n"
            f"UPCOMING ASSIGNMENTS ({len(assignments)}):\n" + "\n".join(assign_lines or ["  - none"])
        )

        result = self.llm.invoke([
            SystemMessage(content="""You are an expert study and productivity planner for a student.
Given their tasks and assignments, create a practical day-by-day schedule.

Rules:
- Group work logically (don't switch topics every 10 minutes)
- Prioritise by deadline urgency AND grade weight
- Suggest specific time blocks (e.g., "9:00–11:00 AM")
- Leave buffer time between sessions (15–30 min breaks)
- Use emojis to make it readable
- Max 3 study blocks per day
- Be realistic — don't pack 10 hours of work into one day
- Format as Day headings with bullet points under each

Reply ONLY with the schedule. No preamble."""),
            HumanMessage(content=data_block),
        ])

        return result.content.strip()

    # ── Core: structured slot suggestions ──────────────────────────
    def suggest_slots(self) -> list[dict]:
        """
        Returns structured slot recommendations:
        [{"day": "Mon 2026-03-16", "time": "9:00 AM", "task": "...", "hours": 2}, ...]
        """
        tasks       = self._fetch_tasks()
        assignments = self._fetch_assignments()
        now         = datetime.now(timezone.utc)

        items = []
        # Merge tasks and assignments, score by urgency
        for t in tasks[:8]:
            dl = None
            if t.get("deadline"):
                try:
                    dl = datetime.fromisoformat(t["deadline"].replace("Z", "+00:00"))
                except Exception:
                    pass
            hours_left = ((dl - now).total_seconds() / 3600) if dl else 999
            est_hours  = (t.get("estimated_minutes") or 60) / 60
            items.append({
                "label":      t["title"],
                "type":       "task",
                "urgency":    max(0, 1 - hours_left / 168),  # 0=chill, 1=due now
                "est_hours":  round(est_hours, 1),
                "deadline_str": t["deadline"][:10] if t.get("deadline") else "flexible",
            })

        for a in assignments[:6]:
            dl = None
            if a.get("due_date"):
                try:
                    dl = datetime.fromisoformat(a["due_date"].replace("Z", "+00:00"))
                except Exception:
                    pass
            hours_left = ((dl - now).total_seconds() / 3600) if dl else 999
            est_hours  = float(a.get("estimated_hours") or 3)
            weight     = float(a.get("weight_percent") or 10)
            items.append({
                "label":      f"{a['course_code']}: {a['title']}",
                "type":       "assignment",
                "urgency":    max(0, 1 - hours_left / 168) + weight / 200,
                "est_hours":  est_hours,
                "deadline_str": a["due_date"][:10] if a.get("due_date") else "flexible",
            })

        # Sort by urgency descending
        items.sort(key=lambda x: x["urgency"], reverse=True)

        # Build simple daily slots (9 AM start, max 6h/day)
        slots     = []
        day_delta = 0
        day_hours = 0.0

        for item in items:
            if day_hours + item["est_hours"] > 6:
                day_delta += 1
                day_hours  = 0.0

            day_date  = (now + timedelta(days=day_delta)).strftime("%a %Y-%m-%d")
            start_h   = 9 + day_hours
            start_str = f"{int(start_h):02d}:{int((start_h % 1) * 60):02d}"
            end_h     = start_h + item["est_hours"]
            end_str   = f"{int(end_h):02d}:{int((end_h % 1) * 60):02d}"

            slots.append({
                "day":      day_date,
                "start":    start_str,
                "end":      end_str,
                "label":    item["label"],
                "type":     item["type"],
                "deadline": item["deadline_str"],
            })
            day_hours += item["est_hours"] + 0.5   # 30min break

        return slots

    # ── Format slots as Telegram-friendly text ──────────────────────
    def format_slots_telegram(self) -> str:
        slots = self.suggest_slots()
        if not slots:
            return "📭 Nothing to schedule!"

        by_day: dict[str, list] = {}
        for s in slots:
            by_day.setdefault(s["day"], []).append(s)

        lines = ["📅 *Smart Schedule Suggestion:*\n"]
        emoji = {"task": "✅", "assignment": "📘"}

        for day, day_slots in by_day.items():
            lines.append(f"*{day}*")
            for s in day_slots:
                e = emoji.get(s["type"], "📌")
                lines.append(f"  {e} {s['start']}–{s['end']} {s['label']}")
                lines.append(f"      _(deadline: {s['deadline']})_")
            lines.append("")

        return "\n".join(lines)
