import os
import sys
import requests
from datetime import datetime, timezone

def send_telegram(message: str):
    """Send a Telegram notification."""
    token   = os.getenv("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        print("Telegram not configured")
        return
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        requests.post(url, json={
            "chat_id":    chat_id,
            "text":       message,
            "parse_mode": "Markdown"
        }, timeout=10)
        print(f"Telegram sent: {message[:50]}")
    except Exception as e:
        print(f"Telegram error: {e}")

def check_new_emails():
    """
    Main email processing function.
    Called by scheduler every 15 minutes.
    """
    print(f"\n[{datetime.now()}] Starting email check...")

    try:
        # Import here to avoid circular imports
        from backend.tools.gmail_tool import GmailTool
        from backend.agents.email_agent import EmailAgent

        gmail = GmailTool()
        agent = EmailAgent()

        # Get unread emails
        emails = gmail.get_unread_emails(max_results=5)

        if not emails:
            print("No unread emails found")
            return

        print(f"Found {len(emails)} unread emails")

        urgent_emails    = []
        action_emails    = []
        all_action_items = []

        for email in emails:
            print(f"  Processing: {email['subject'][:50]}")
            analysis = agent.analyze(email)

            # Collect by type
            if analysis.classification == "urgent":
                urgent_emails.append({
                    "email": email, "analysis": analysis
                })
            elif analysis.classification == "action_required":
                action_emails.append({
                    "email": email, "analysis": analysis
                })

            # Collect action items
            for item in analysis.action_items:
                all_action_items.append({
                    "title":    item.title,
                    "deadline": item.deadline,
                    "priority": item.priority,
                    "source":   "email",
                })

        # Send Telegram alert for urgent emails
        for item in urgent_emails:
            email    = item["email"]
            analysis = item["analysis"]
            send_telegram(
                f"🚨 *Urgent Email!*\n\n"
                f"From: {email['sender'][:50]}\n"
                f"Subject: {email['subject'][:80]}\n\n"
                f"📝 {analysis.summary}"
            )

        # Create tasks from action items
        tasks_created = 0
        for action in all_action_items:
            try:
                resp = requests.post(
                    "http://localhost:8000/tasks/",
                    json={
                        "title":    action["title"],
                        "priority": action["priority"],
                        "deadline": action["deadline"] + "T23:59:00+00:00"
                                    if action.get("deadline") else None,
                        "source":   "email",
                    },
                    timeout=5
                )
                if resp.status_code == 201:
                    tasks_created += 1
            except Exception as e:
                print(f"Task creation error: {e}")

        # Send summary notification
        if urgent_emails or action_emails or tasks_created > 0:
            send_telegram(
                f"📧 *Email Check Complete*\n\n"
                f"🚨 Urgent: {len(urgent_emails)}\n"
                f"📋 Action required: {len(action_emails)}\n"
                f"✅ Tasks created: {tasks_created}"
            )

        print(f"Email check done — {tasks_created} tasks created")

    except FileNotFoundError:
        print("credentials.json not found — Gmail not configured yet")
    except Exception as e:
        print(f"Email check error: {e}")