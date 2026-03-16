from backend.tools.gmail_tool import GmailTool
from backend.agents.email_agent import EmailAgent

# Test 1 — Read emails
print("Connecting to Gmail...")
gmail = GmailTool()
emails = gmail.get_unread_emails(max_results=5)
print(f"Found {len(emails)} unread emails:")
print()

for e in emails:
    print(f"  Subject: {e['subject'][:60]}")
    print(f"  From:    {e['sender'][:50]}")
    print()

# Test 2 — AI analysis on first email
if emails:
    print("=" * 50)
    print("AI Analysis of first email:")
    print("=" * 50)
    agent = EmailAgent()
    result = agent.analyze(emails[0])
    print(f"Classification : {result.classification}")
    print(f"Urgency        : {result.urgency_score}")
    print(f"Summary        : {result.summary}")
    if result.action_items:
        print("Action items:")
        for item in result.action_items:
            print(f"  - {item.title} (priority {item.priority})")
else:
    print("No unread emails found.")