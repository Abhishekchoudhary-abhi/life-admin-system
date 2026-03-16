from backend.tools.gmail_tool import GmailTool
from backend.agents.email_agent import EmailAgent

gmail = GmailTool()
agent = EmailAgent()

messages = gmail.list_messages(3)

print("Fetched emails:", messages)

for msg in messages:
    print("\nProcessing email:", msg["id"])