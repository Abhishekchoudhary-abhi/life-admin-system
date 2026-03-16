"""
MemoryAgent — persists conversation history per session in PostgreSQL
and reconstructs it for LLM context on every request.

Usage:
    memory = MemoryAgent(session_id="6279258919")  # Telegram chat_id
    history = memory.load(max_turns=10)             # Returns last N turns
    memory.save("user", "Add a task...")
    memory.save("assistant", "✅ Task added!")
"""
import requests
from typing import List
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage

API = "http://localhost:8000"


class MemoryAgent:

    def __init__(self, session_id: str = "default"):
        self.session_id = str(session_id)

    # ── Save a turn ────────────────────────────────────────────────
    def save(self, role: str, content: str) -> bool:
        """Persist a single message turn to the database."""
        try:
            resp = requests.post(
                f"{API}/memory/",
                json={
                    "session_id": self.session_id,
                    "role":       role,
                    "content":    content,
                },
                timeout=5,
            )
            return resp.status_code == 201
        except Exception as e:
            print(f"[Memory] Save error: {e}")
            return False

    # ── Load recent turns ──────────────────────────────────────────
    def load(self, max_turns: int = 10) -> List[dict]:
        """Return the last N turns as plain dicts [{'role': ..., 'content': ...}]."""
        try:
            resp = requests.get(
                f"{API}/memory/{self.session_id}",
                params={"limit": max_turns * 2},   # *2 because each turn = 2 rows
                timeout=5,
            )
            if resp.status_code == 200:
                return resp.json()
            return []
        except Exception as e:
            print(f"[Memory] Load error: {e}")
            return []

    # ── Build LangChain messages ───────────────────────────────────
    def as_langchain_messages(self, max_turns: int = 8) -> List[BaseMessage]:
        """Return history as LangChain message objects for direct use in LLM calls."""
        rows = self.load(max_turns=max_turns)
        messages: List[BaseMessage] = []
        for row in rows:
            if row["role"] == "user":
                messages.append(HumanMessage(content=row["content"]))
            else:
                messages.append(AIMessage(content=row["content"]))
        return messages

    # ── Build a plain summary string ───────────────────────────────
    def as_context_string(self, max_turns: int = 6) -> str:
        """Return recent history as a formatted string for prompt injection."""
        rows = self.load(max_turns=max_turns)
        if not rows:
            return "No previous conversation history."
        lines = []
        for row in rows:
            label = "User" if row["role"] == "user" else "Assistant"
            lines.append(f"{label}: {row['content'][:200]}")
        return "\n".join(lines)

    # ── Clear session ──────────────────────────────────────────────
    def clear(self) -> bool:
        """Delete all memory for this session."""
        try:
            resp = requests.delete(
                f"{API}/memory/{self.session_id}",
                timeout=5,
            )
            return resp.status_code == 200
        except Exception as e:
            print(f"[Memory] Clear error: {e}")
            return False
