import json
import os
from datetime import datetime, timezone
from pathlib import Path

MEMORY_FILE = "user_memory.json"

class MemoryAgent:
    """
    Simple persistent memory system.
    Stores facts, preferences, and context about the user.
    """

    def __init__(self):
        self.memory = self._load()

    def _load(self) -> dict:
        """Load memory from file."""
        if os.path.exists(MEMORY_FILE):
            try:
                with open(MEMORY_FILE, "r") as f:
                    return json.load(f)
            except Exception:
                pass
        # Default memory structure
        return {
            "facts":         [],   # things the AI learned about you
            "preferences":   {},   # your preferences
            "daily_summaries": [], # past daily summaries
            "conversation":  [],   # recent conversation history
            "stats": {
                "tasks_completed": 0,
                "emails_processed": 0,
                "days_active": 0,
            }
        }

    def _save(self):
        """Save memory to file."""
        with open(MEMORY_FILE, "w") as f:
            json.dump(self.memory, f, indent=2, default=str)

    def remember_fact(self, fact: str, category: str = "general"):
        """Store a new fact about the user."""
        self.memory["facts"].append({
            "fact":       fact,
            "category":   category,
            "learned_at": datetime.now(timezone.utc).isoformat(),
        })
        # Keep only last 100 facts
        self.memory["facts"] = self.memory["facts"][-100:]
        self._save()
        print(f"[Memory] Remembered: {fact}")

    def set_preference(self, key: str, value):
        """Store a user preference."""
        self.memory["preferences"][key] = value
        self._save()
        print(f"[Memory] Preference set: {key} = {value}")

    def get_preference(self, key: str, default=None):
        """Get a user preference."""
        return self.memory["preferences"].get(key, default)

    def get_recent_facts(self, n: int = 10) -> list[dict]:
        """Get the most recent N facts."""
        return self.memory["facts"][-n:]

    def get_facts_by_category(self, category: str) -> list[dict]:
        """Get all facts of a specific category."""
        return [f for f in self.memory["facts"] if f["category"] == category]

    def save_daily_summary(self, summary: str):
        """Save today's daily summary."""
        self.memory["daily_summaries"].append({
            "date":    datetime.now(timezone.utc).date().isoformat(),
            "summary": summary,
        })
        # Keep only last 30 days
        self.memory["daily_summaries"] = self.memory["daily_summaries"][-30:]
        self._save()

    def get_last_summary(self) -> str:
        """Get the most recent daily summary."""
        if self.memory["daily_summaries"]:
            return self.memory["daily_summaries"][-1]["summary"]
        return "No previous summary available."

    def add_conversation(self, role: str, content: str):
        """Add a message to conversation history."""
        self.memory["conversation"].append({
            "role":      role,
            "content":   content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        # Keep only last 20 messages
        self.memory["conversation"] = self.memory["conversation"][-20:]
        self._save()

    def get_conversation_history(self, n: int = 10) -> list[dict]:
        """Get recent conversation history."""
        return self.memory["conversation"][-n:]

    def increment_stat(self, stat: str):
        """Increment a usage statistic."""
        if stat in self.memory["stats"]:
            self.memory["stats"][stat] += 1
            self._save()

    def get_context_for_ai(self) -> str:
        """
        Build a context string to inject into AI prompts.
        This gives the AI memory of who you are.
        """
        parts = []

        # Recent facts
        facts = self.get_recent_facts(5)
        if facts:
            fact_lines = [f["fact"] for f in facts]
            parts.append("What I know about you:\n" + "\n".join(f"- {f}" for f in fact_lines))

        # Preferences
        prefs = self.memory["preferences"]
        if prefs:
            pref_lines = [f"{k}: {v}" for k, v in prefs.items()]
            parts.append("Your preferences:\n" + "\n".join(f"- {p}" for p in pref_lines))

        # Stats
        stats = self.memory["stats"]
        parts.append(
            f"Your stats: {stats['tasks_completed']} tasks completed, "
            f"{stats['emails_processed']} emails processed"
        )

        return "\n\n".join(parts) if parts else "No memory yet."