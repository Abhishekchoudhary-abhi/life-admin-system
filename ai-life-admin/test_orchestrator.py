from backend.agents.orchestrator import run_orchestrator

print("Testing AI Orchestrator...")
print("=" * 50)

tests = [
    "Add a task to review lecture notes by Friday",
    "What tasks do I have?",
    "Mark lecture notes as done",
    "Add CS301 assignment called Database Project due 2026-03-25 worth 30 percent",
    "Show my assignments",
    "Give me a briefing of my day",
    "What is the capital of France?",
]

for message in tests:
    print(f"\nYou: {message}")
    response = run_orchestrator(message)
    print(f"Bot: {response}")
    print("-" * 40)