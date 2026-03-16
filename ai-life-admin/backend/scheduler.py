from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
import requests
import os
from datetime import datetime, timezone, timedelta
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

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
    print(f"[{datetime.now()}] Running AI morning briefing...")
    try:
        tasks_resp  = requests.get("http://localhost:8000/tasks/",       timeout=5)
        assign_resp = requests.get("http://localhost:8000/assignments/", timeout=5)
        tasks       = tasks_resp.json()
        assignments = assign_resp.json()

        pending  = [t for t in tasks if t.get("status") == "todo"]
        urgent   = [t for t in pending if t.get("priority") == 1]
        now      = datetime.now(timezone.utc)

        # Find assignments due within 48h
        due_soon = []
        for a in assignments:
            if a.get("due_date"):
                try:
                    due = datetime.fromisoformat(a["due_date"].replace("Z", "+00:00"))
                    hrs = (due - now).total_seconds() / 3600
                    if 0 < hrs <= 48:
                        due_soon.append((a, int(hrs)))
                except Exception:
                    pass

        # Build data block for LLM
        task_lines   = "\n".join(
            f"- [{('CRITICAL' if t.get('priority')==1 else 'HIGH' if t.get('priority')==2 else 'MEDIUM')}] {t['title']}"
            for t in pending[:8]
        ) or "No pending tasks"
        assign_lines = "\n".join(
            f"- {a['course_code']}: {a['title']} (due {a['due_date'][:10]})"
            for a in assignments[:5]
        ) or "No upcoming assignments"
        due_soon_lines = "\n".join(
            f"- {a['course_code']}: {a['title']} — DUE IN {hrs}h!"
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
        # Fallback to simple version
        print(f"AI briefing error, using fallback: {e}")
        try:
            tasks_resp  = requests.get("http://localhost:8000/tasks/",       timeout=5)
            assign_resp = requests.get("http://localhost:8000/assignments/", timeout=5)
            tasks       = tasks_resp.json()
            assignments = assign_resp.json()
            pending     = [t for t in tasks if t.get("status") == "todo"]
            urgent      = [t for t in pending if t.get("priority") == 1]
            task_lines  = ""
            for t in pending[:5]:
                emoji = "\U0001f534" if t["priority"] == 1 else "\U0001f7e0" if t["priority"] == 2 else "\U0001f7e1"
                task_lines += f"\n{emoji} {t['title']}"
            assign_lines = ""
            for a in assignments[:3]:
                due = a["due_date"][:10] if a.get("due_date") else "No date"
                assign_lines += f"\n\U0001f4d8 {a['course_code']}: {a['title']} (due {due})"
            msg = (
                f"\u2600\ufe0f *Good Morning!*\n\n"
                f"\U0001f4cb *Tasks:* {len(pending)} pending, {len(urgent)} urgent"
                f"{task_lines}\n\n"
                f"\U0001f4da *Assignments:* {len(assignments)} upcoming"
                f"{assign_lines}\n\n"
                f"_Have a productive day!_ \U0001f4aa"
            )
            send_telegram_message(msg)
        except Exception as e2:
            print(f"Fallback briefing error: {e2}")


def evening_recap():
    """AI-powered evening recap at 9 PM IST — what was done, what's left."""
    print(f"[{datetime.now()}] Running evening recap...")
    try:
        resp  = requests.get("http://localhost:8000/tasks/", timeout=5)
        tasks = resp.json()
        done_today = [
            t for t in tasks
            if t.get("status") == "done"
            and t.get("updated_at", "")[:10] == datetime.now().strftime("%Y-%m-%d")
        ]
        pending = [t for t in tasks if t.get("status") == "todo"]

        if not done_today and not pending:
            return

        done_lines    = "\n".join(f"- {t['title']}" for t in done_today) or "None"
        pending_lines = "\n".join(f"- {t['title']}" for t in pending[:5]) or "None"

        groq_key = os.getenv("GROQ_API_KEY", "")
        llm      = ChatGroq(model="llama-3.1-8b-instant", temperature=0.4, api_key=groq_key)

        ai_result = llm.invoke([
            SystemMessage(content="""You are an encouraging productivity coach.
Write a short evening recap Telegram message for a student.
Format:
- Celebrate completed tasks enthusiastically
- Gently remind about remaining tasks
- End with a positive, restful note
- Max 15 lines, emoji-rich, Telegram Markdown"""),
            HumanMessage(content=f"Completed today:\n{done_lines}\n\nStill pending:\n{pending_lines}")
        ])
        send_telegram_message(ai_result.content.strip())
        print("Evening recap sent")
    except Exception as e:
        print(f"Evening recap error: {e}")

def monitor_deadlines():
    print(f"[{datetime.now()}] Checking deadlines...")
    try:
        resp        = requests.get("http://localhost:8000/assignments/", timeout=5)
        assignments = resp.json()
        now         = datetime.now(timezone.utc)

        for a in assignments:
            if a["status"] == "submitted":
                continue
            if not a.get("due_date"):
                continue

            due        = datetime.fromisoformat(
                a["due_date"].replace("Z", "+00:00")
            )
            hours_left = (due - now).total_seconds() / 3600

            if hours_left < 0:
                send_telegram_message(
                    f"🚨 *OVERDUE!*\n"
                    f"📘 {a['course_code']}: {a['title']}\n"
                    f"Was due {abs(int(hours_left))} hours ago!"
                )
            elif hours_left <= 24:
                send_telegram_message(
                    f"⚠️ *Due in {int(hours_left)} hours!*\n"
                    f"📘 {a['course_code']}: {a['title']}\n"
                    f"Due: {a['due_date'][:10]}"
                )
            elif hours_left <= 48:
                send_telegram_message(
                    f"📌 *Due Tomorrow!*\n"
                    f"📘 {a['course_code']}: {a['title']}\n"
                    f"Due: {a['due_date'][:10]}"
                )

        print("Deadline check complete")
    except Exception as e:
        print(f"Deadline monitor error: {e}")

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
    CronTrigger(hour=8, minute=0),   # 8:00 AM IST
    id="morning_briefing",
    replace_existing=True
)

scheduler.add_job(
    evening_recap,
    CronTrigger(hour=21, minute=0),  # 9:00 PM IST
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

print("✅ Scheduler configured with jobs: morning_briefing, evening_recap, deadline_monitor, email_check")