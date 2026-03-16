import json
from pydantic import BaseModel
from typing import Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq


# ── Data models ───────────────────────────────────────────────────

class ActionItem(BaseModel):
    title: str
    deadline: Optional[str] = None
    priority: int = 2


class EmailAnalysis(BaseModel):
    summary: str
    urgency_score: float
    classification: str
    action_items: list[ActionItem]


# ── System prompt ─────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a precision email analyst for a student's personal productivity assistant.

Your job:
1. Summarize the email in 2-3 sentences maximum
2. Score urgency from 0.0 (not urgent) to 1.0 (extremely urgent)
3. Classify the email
4. Extract all action items the student needs to do

Classification guide:
- urgent: needs response or action within 24 hours
- action_required: needs action but not immediately
- fyi: informational only, no action needed
- spam: promotional or irrelevant

Priority guide for action items:
- 1 = due today or critical
- 2 = due this week
- 3 = due this month
- 4 = someday / no deadline

IMPORTANT: Return ONLY valid JSON. No markdown. No explanation. No extra text.

JSON format:

{{
  "summary": "2-3 sentence summary here",
  "urgency_score": 0.0,
  "classification": "fyi",
  "action_items": [
    {{
      "title": "action to take",
      "deadline": "2026-03-20",
      "priority": 2
    }}
  ]
}}
"""

# ── Email Agent ───────────────────────────────────────────────────

class EmailAgent:

    def __init__(self):
        from backend.core.config import settings

        # Default LLM → Groq (free tier friendly)
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0,
            api_key=settings.GROQ_API_KEY
        )

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            ("human",
             "From: {sender}\n"
             "Subject: {subject}\n"
             "Date: {date}\n\n"
             "Email body:\n{body}"
             ),
        ])

        self.chain = self.prompt | self.llm


    def analyze(self, email: dict) -> EmailAnalysis:
        """Analyze one email and return structured result."""
        try:
            result = self.chain.invoke({
                "sender":  email["sender"],
                "subject": email["subject"],
                "date":    email.get("date", ""),
                "body":    email["body"][:1500],
            })

            content = result.content.strip()

            # Sometimes models return markdown fences
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1])

            data = json.loads(content)

            return EmailAnalysis(**data)

        except json.JSONDecodeError as e:
            print(f"JSON parse error for '{email['subject']}': {e}")
            print(f"Raw response: {result.content[:200]}")

            return EmailAnalysis(
                summary=email.get("snippet", "Could not summarize"),
                urgency_score=0.2,
                classification="fyi",
                action_items=[]
            )

        except Exception as e:
            print(f"Email analysis error: {e}")

            return EmailAnalysis(
                summary="Error analyzing email",
                urgency_score=0.0,
                classification="fyi",
                action_items=[]
            )


    def analyze_batch(self, emails: list[dict]) -> list[dict]:
        """Analyze a list of emails."""

        results = []

        for email in emails:
            print(f"Analyzing: {email['subject'][:50]}")

            analysis = self.analyze(email)

            results.append({
                "email": email,
                "analysis": analysis
            })

        return results