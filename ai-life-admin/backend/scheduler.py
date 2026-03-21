from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
import requests
import os
import json
from datetime import datetime, timezone, timedelta
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from backend.core.database import SessionLocal
from backend.models.task import Task
from backend.models.assignment import Assignment
from sqlalchemy import select

scheduler = BackgroundScheduler(timezone="Asia/Kolkata")  # IST

def send_telegram_message(message: str):
    token   = os.getenv("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        return
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        requests.post(url, json={
            "chat_id":    chat_id,
            "text":       message,
            "parse_mode": "Markdown"
        }, timeout=10)
    except Exception as e:
        print(f"Telegram error: {e}")

def morning_briefing():
    """AI-written personalised good-morning brief, sent to Telegram at 8 AM IST."""
    print(f"[{datetime.now()}] Running AI morning briefing (DB mode)...")
    db = SessionLocal()
    try:
        # Fetch data directly from DB
        tasks = db.query(Task).filter(Task.status == "todo").all()
        assignments = db.query(Assignment).filter(Assignment.status != "submitted").all()

        pending = tasks
        urgent  = [t for t in pending if t.priority == 1]
        now     = datetime.now(timezone.utc)

        # Process assignments due within 48h
        due_soon = []
        for a in assignments:
            if a.due_date:
                # Ensure a.due_date is timezone-aware for comparison if it's stored as UTC
                due = a.due_date
                if due.tzinfo is None:
                    due = due.replace(tzinfo=timezone.utc)
                hrs = (due - now).total_seconds() / 3600
                if 0 < hrs <= 48:
                    due_soon.append((a, int(hrs)))

        # Build data block for LLM
        task_lines   = "\n".join(
            f"- [{('CRITICAL' if t.priority==1 else 'HIGH' if t.priority==2 else 'MEDIUM')}] {t.title}"
            for t in pending[:8]
        ) or "No pending tasks"
        assign_lines = "\n".join(
            f"- {a.course_code}: {a.title} (due {a.due_date.strftime('%Y-%m-%d')})"
            for a in assignments[:5]
        ) or "No upcoming assignments"
        due_soon_lines = "\n".join(
            f"- {a.course_code}: {a.title} — DUE IN {hrs}h!"
            for a, hrs in due_soon
        ) or "None"
        today_str = datetime.now().strftime("%A, %d %B %Y")

        groq_key = os.getenv("GROQ_API_KEY", "")
        if not groq_key:
            raise ValueError("GROQ_API_KEY not set")

        llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.4, api_key=groq_key)

        data = (
            f"Today: {today_str}\n"
            f"Pending tasks ({len(pending)}, {len(urgent)} urgent):\n{task_lines}\n\n"
            f"Upcoming assignments ({len(assignments)}):\n{assign_lines}\n\n"
            f"Due within 48 hours:\n{due_soon_lines}"
        )

        ai_result = llm.invoke([
            SystemMessage(content="""You are an enthusiastic personal productivity coach.
Write a motivating, emoji-rich Telegram message for a student's morning briefing.
Format for Telegram Markdown:
- Start with greeting + today's date
- Highlight urgent items clearly
- Give 1-2 sentences of personalised motivation at the end
- Max 25 lines total
- Use *bold* for section headers
Write the Telegram message directly — no preamble."""),
            HumanMessage(content=data)
        ])

        msg = ai_result.content.strip()
        send_telegram_message(msg)
        print("AI morning briefing sent")

    except Exception as e:
        print(f"AI briefing error: {e}")
    finally:
        db.close()

def evening_recap():
    """AI-powered evening recap at 9 PM IST."""
    print(f"[{datetime.now()}] Running evening recap (DB mode)...")
    db = SessionLocal()
    try:
        tasks = db.query(Task).all()
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        done_today = [
            t for t in tasks
            if t.status == "done"
            and t.updated_at.strftime("%Y-%m-%d") == today_str
        ]
        pending = [t for t in tasks if t.status == "todo"]

        if not done_today and not pending:
            return

        done_lines    = "\n".join(f"- {t.title}" for t in done_today) or "None"
        pending_lines = "\n".join(f"- {t.title}" for t in pending[:5]) or "None"

        groq_key = os.getenv("GROQ_API_KEY", "")
        llm      = ChatGroq(model="llama-3.1-8b-instant", temperature=0.4, api_key=groq_key)

        ai_result = llm.invoke([
            SystemMessage(content="""You are an encouraging productivity coach.
Write a short evening recap Telegram message. celebrate completed tasks. gently remind about remaining ones. restful note."""),
            HumanMessage(content=f"Completed today:\n{done_lines}\n\nStill pending:\n{pending_lines}")
        ])
        send_telegram_message(ai_result.content.strip())
        print("Evening recap sent")
    except Exception as e:
        print(f"Evening recap error: {e}")
    finally:
        db.close()

def monitor_deadlines():
    print(f"[{datetime.now()}] Checking deadlines (DB mode)...")
    db = SessionLocal()
    try:
        assignments = db.query(Assignment).filter(Assignment.status != "submitted").all()
        now = datetime.now(timezone.utc)

        for a in assignments:
            if not a.due_date: continue
            
            due = a.due_date
            if due.tzinfo is None:
                due = due.replace(tzinfo=timezone.utc)
                
            hours_left = (due - now).total_seconds() / 3600

            if hours_left < 0:
                send_telegram_message(f"🚨 *OVERDUE!* {a.course_code}: {a.title}")
            elif hours_left <= 24:
                send_telegram_message(f"⚠️ *Due in {int(hours_left)} hours!* {a.course_code}: {a.title}")
            elif hours_left <= 48:
                send_telegram_message(f"📌 *Due Tomorrow!* {a.course_code}: {a.title}")

        print("Deadline check complete")
    except Exception as e:
        print(f"Deadline monitor error: {e}")
    finally:
        db.close()

def check_emails_job():
    """Wrapper that calls the email check function."""
    try:
        from backend.workers.email_tasks import check_new_emails
        check_new_emails()
    except Exception as e:
        print(f"Email job error: {e}")

# ── Register all jobs ─────────────────────────────────────────────

scheduler.add_job(
    morning_briefing,
    CronTrigger(hour=8, minute=0),
    id="morning_briefing",
    replace_existing=True
)

scheduler.add_job(
    evening_recap,
    CronTrigger(hour=21, minute=0),
    id="evening_recap",
    replace_existing=True
)

scheduler.add_job(
    monitor_deadlines,
    IntervalTrigger(hours=1),
    id="deadline_monitor",
    replace_existing=True
)

scheduler.add_job(
    check_emails_job,
    IntervalTrigger(minutes=15),
    id="email_check",
    replace_existing=True
)