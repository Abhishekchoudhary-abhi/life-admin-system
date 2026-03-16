from backend.agents.email_agent import EmailAgent

agent = EmailAgent()

fake_email = {
    "sender": "professor@university.edu",
    "subject": "Assignment 3 due Friday",
    "date": "Thu, 12 Mar 2026",
    "body": "Hi students, Assignment 3 is due this Friday at 11:59 PM. Submit via the portal.",
    "snippet": "Assignment 3 due Friday"
}

print("Testing Email Agent...\n")

result = agent.analyze(fake_email)

print("Classification:", result.classification)
print("Urgency:", result.urgency_score)
print("Summary:", result.summary)

print("\nAction items:")
for item in result.action_items:
    print(f"- {item.title} (priority {item.priority}, deadline {item.deadline})")

print("\nAI agent working!")