import json
import requests
from datetime import datetime, timezone
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from backend.core.config import settings
from backend.agents.memory_agent import MemoryAgent


class PlanningAgent:
    """
    Generates intelligent daily briefings and plans
    using real data + user memory.
    """

    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.3,
            api_key=settings.GROQ_API_KEY
        )
        self.memory = MemoryAgent()

    def process_data(self, tasks: list[dict], assignments: list[dict]) -> dict:
        """Process pre-fetched data for planning."""
        now = datetime.now(timezone.utc)

        # Filter and sort
        pending  = [t for t in tasks if t["status"] == "todo"]
        urgent   = [t for t in pending if t["priority"] == 1]
        overdue  = []
        due_soon = []

        for a in assignments:
            if not a.get("due_date") or a["status"] == "submitted":
                continue
            try:
                due        = datetime.fromisoformat(
                    a["due_date"].replace("Z", "+00:00")
                )
                hours_left = (due - now).total_seconds() / 3600
                if hours_left < 0:
                    overdue.append(a)
                elif hours_left <= 48:
                    due_soon.append(a)
            except Exception:
                continue

        return {
            "pending_tasks":  pending,
            "urgent_tasks":   urgent,
            "all_assignments": assignments,
            "overdue":        overdue,
            "due_soon":       due_soon,
            "total_tasks":    len(pending),
            "total_urgent":   len(urgent),
        }

    def generate_briefing(self, tasks: list, assignments: list) -> str:
        """Generate a time-aware AI briefing (Morning, Afternoon, or Evening)."""
        data    = self.process_data(tasks, assignments)
        context = self.memory.get_context_for_ai()
        now     = datetime.now() # Use local time for better period detection
        
        # Local hour for prompt context
        hour = now.hour 
        period = "Morning"
        if 12 <= hour < 18:
            period = "Afternoon"
        elif hour >= 18 or hour < 5:
            period = "Evening"

        # Build data summary for AI
        task_lines = "\n".join(
            f"- [{t['priority']}] {t['title']}"
            for t in data["pending_tasks"][:8]
        ) or "No pending tasks"

        assign_lines = "\n".join(
            f"- {a['course_code']}: {a['title']} (due {a['due_date'][:10]})"
            for a in data["all_assignments"][:5]
        ) or "No assignments"

        overdue_lines = "\n".join(
            f"- {a['course_code']}: {a['title']} OVERDUE!"
            for a in data["overdue"]
        ) or "None"

        due_soon_lines = "\n".join(
            f"- {a['course_code']}: {a['title']} due soon!"
            for a in data["due_soon"]
        ) or "None"

        result = self.llm.invoke([
            SystemMessage(content=f"""You are an intelligent personal productivity assistant
generating a {period} briefing for a student.

Rules:
- Morning: Focus on the upcoming day and priorities.
- Afternoon: Focus on maintaining momentum and completing tasks.
- Evening: Focus on wind-down, reflection, and preparation for tomorrow.

Be warm, motivating, and concise. Use emojis.
Structure your response as:
1. A warm greeting with the state of the day
2. Critical alerts (overdue or due within 48h) if any
3. Top 3 actions to focus on for this {period}
4. A motivating closing line

Keep total response under 200 words."""),
            HumanMessage(content=f"""
Current Date: {now.strftime('%A, %B %d %Y')}
Current Time: {now.strftime('%I:%M %p')}
Period: {period}

TASKS ({data['total_tasks']} pending, {data['total_urgent']} urgent):
{task_lines}

ASSIGNMENTS:
{assign_lines}

OVERDUE:
{overdue_lines}

DUE WITHIN 48H:
{due_soon_lines}

USER CONTEXT:
{context}

Generate {period} briefing:
""")
        ])

        briefing = result.content

        # Save to memory if it's a significant summary
        if period == "Evening":
            self.memory.save_daily_summary(briefing)
        
        if period == "Morning":
            self.memory.increment_stat("days_active")

        return briefing

    def generate_daily_plan(self, tasks: list, assignments: list) -> str:
        """Generate a time-blocked daily plan."""
        data = self.process_data(tasks, assignments)
        now  = datetime.now(timezone.utc)

        task_lines = "\n".join(
            f"- [{t['priority']}] {t['title']} "
            f"(~{t.get('estimated_minutes', 30)} min)"
            for t in data["pending_tasks"][:6]
        ) or "No tasks"

        result = self.llm.invoke([
            SystemMessage(content="""You are a productivity planner.
Create a realistic time-blocked daily plan.
Use 9 AM - 6 PM working hours.
Put high priority tasks in morning.
Include short breaks.
Format as a clean schedule with times.
Keep it under 150 words."""),
            HumanMessage(content=f"""
Date: {now.strftime('%A, %B %d')}

Tasks to schedule (priority 1=critical, 4=low):
{task_lines}

Create a time-blocked plan:
""")
        ])

        return result.content

    def generate_academic_roadmap(self, topics: str, milestones: dict, days: int) -> str:
        """Generate a multi-day academic roadmap based on syllabus and specific exams."""
        prompt = f"""You are an elite academic strategy consultant.
Create a high-performance study roadmap based on the following:

SYLLABUS TOPICS:
{topics}

MILESTONES / EXAMS:
- MST 1: {milestones.get('mst1', 'Not specified')}
- MST 2: {milestones.get('mst2', 'Not specified')}
- Practicals: {milestones.get('practicals', 'Not specified')}
- Final Exams: {milestones.get('finals', 'Not specified')}

TARGET DURATION: {days} Days

Rules for the Roadmap:
1. Divide the topics logically across the {days} days.
2. Prioritize foundational topics first.
3. Include specific "Review & Mock Test" days before each MST and Final.
4. Allocate time for practical preparation and record work.
5. Use a clear, day-by-day or phase-by-phase format.
6. Make it actionable and intense but realistic.

Format your response in professional Markdown with:
- A catchy title for the study roadmap.
- High-level phases (e.g., Phase 1: Foundations, Phase 2: Core Deep Dive, Phase 3: Revision & Sprint).
- Daily or semi-daily topic breakdowns.
- Key success metrics for each phase.
"""
        result = self.llm.invoke([
            SystemMessage(content="You generate detailed, highly structured academic study roadmaps."),
            HumanMessage(content=prompt)
        ])
        return result.content

    def generate_lifestyle_plan(self) -> str:
        """
        Generates a high-level study and life strategy based on 
        the user's occupation, daily routine, and learned facts.
        """
        context = self.memory.get_context_for_ai()
        
        result = self.llm.invoke([
            SystemMessage(content="""You are a high-level productivity architect and life coach.
Your goal is to design a long-term "Life & Study Strategy" for the user.

Rules:
- Analyze their occupation and daily routine (from the provided context).
- Suggest an ideal daily structure (e.g., Deep Work blocks, Rest phases).
- Recommend growth levers (e.g., "Use active recall for Math", "Sleep 8h for cognitive load").
- Advise on balancing MST/Finals with mental health.

Tone: Professional, expert, strategic. 
Format: Beautiful Markdown with sections.
"""),
            HumanMessage(content=f"USER DATA & MEMORIES:\n{context}\n\nGenerate my personalized life philosophy and study strategy:")
        ])
        return result.content