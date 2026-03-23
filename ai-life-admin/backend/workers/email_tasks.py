import sys
from datetime import datetime, timezone
from backend.core.database import SessionLocal
from backend.models.task import Task

def send_notification(message: str):
    """Local notification sink after Telegram removal."""
    print(f"Notification: {message[:120]}")

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

        # Send alert for urgent emails
        for item in urgent_emails:
            email    = item["email"]
            analysis = item["analysis"]
            send_notification(
                f"🚨 *Urgent Email!*\n\n"
                f"From: {email['sender'][:50]}\n"
                f"Subject: {email['subject'][:80]}\n\n"
                f"📝 {analysis.summary}"
            )

        # Create tasks from action items
        tasks_created = 0
        db = SessionLocal()
        try:
            for action in all_action_items:
                due = None
                if action.get("deadline"):
                    try:
                        due = datetime.fromisoformat(action["deadline"].replace("Z", "+00:00"))
                    except Exception:
                        pass
                
                new_task = Task(
                    title    = action["title"],
                    priority = action["priority"],
                    deadline = due,
                    source   = "email"
                )
                db.add(new_task)
                tasks_created += 1
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Task creation error: {e}")
        finally:
            db.close()

        # Send summary notification
        if urgent_emails or action_emails or tasks_created > 0:
            send_notification(
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