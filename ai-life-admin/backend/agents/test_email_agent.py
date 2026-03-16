from backend.agents.email_agent import EmailAgent

agent = EmailAgent()

fake_email = {
    "sender": "professor@university.edu",
    "subject": "Assignment 3 due Friday",
    "date": "Thu, 12 Mar 2026",
    "body": "Hi students, Assignment 3 is due this Friday at 11:59 PM. Submit via the portal.",
    "snippet": "Assignment 3 due Friday"
}

result = agent.analyze(fake_email)

print(result)