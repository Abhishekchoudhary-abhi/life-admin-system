import json
import operator
from typing import TypedDict, Annotated, Optional
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from backend.core.config import settings

# ── State ─────────────────────────────────────────────────────────
class AgentState(TypedDict):
    user_message:   str
    session_id:     str          # e.g. Telegram chat_id or "test"
    intent:         str
    entities:       dict
    agent_result:   str
    final_response: str
    memory_context: str          # recent conversation history injected into prompts

# ── LLM ──────────────────────────────────────────────────────────
def get_llm():
    return ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0,
        api_key=settings.GROQ_API_KEY
    )

# ── Node 0: Load Memory ──────────────────────────────────────────
def load_memory(state: AgentState) -> AgentState:
    """Load recent conversation history for this session."""
    try:
        from backend.agents.memory_agent import MemoryAgent
        mem     = MemoryAgent(session_id=state.get("session_id", "default"))
        context = mem.as_context_string(max_turns=6)
    except Exception as e:
        print(f"[Memory] Load error: {e}")
        context = ""
    return {**state, "memory_context": context}


# ── Node 1: Classify Intent ───────────────────────────────────────
def classify_intent(state: AgentState) -> AgentState:
    """Understand what the user wants to do."""
    llm     = get_llm()
    context = state.get("memory_context", "")
    history_note = (
        f"\n\nRecent conversation context (use for reference only):\n{context}"
        if context and context != "No previous conversation history."
        else ""
    )
    result = llm.invoke([
        SystemMessage(content=f"""Classify the user message into exactly ONE intent.

Available intents:
- add_task          : user wants to add/create a task
- list_tasks        : user wants to see their tasks
- complete_task     : user wants to mark a task as done/complete
- add_assignment    : user wants to add an assignment
- list_assignments  : user wants to see assignments
- check_emails      : user wants to check/read emails
- get_briefing      : user wants a summary of their day
- get_schedule      : user wants a study/work plan or schedule suggestion
- general_chat      : anything else

Reply with ONLY the intent name. Nothing else.{history_note}"""),
        HumanMessage(content=state["user_message"])
    ])
    intent = result.content.strip().lower().replace(" ", "_")
    print(f"[Orchestrator] Intent: {intent}")
    return {**state, "intent": intent}

# ── Node 2: Extract Entities ──────────────────────────────────────
def extract_entities(state: AgentState) -> AgentState:
    """Pull out the key details from the user message."""
    llm    = get_llm()
    intent = state["intent"]

    prompts = {
        "add_task": """Extract task details. Return JSON only.
{
  "title": "task title",
  "priority": 1-4,
  "deadline": "YYYY-MM-DD or null"
}
Priority: 1=critical, 2=high, 3=medium, 4=low""",

        "complete_task": """Extract the keyword to search for the task. Return JSON only.
{
  "keyword": "word to search"
}""",

        "add_assignment": """Extract assignment details. Return JSON only.
{
  "course_code": "e.g. CS301",
  "title": "assignment title",
  "due_date": "YYYY-MM-DD",
  "weight_percent": number or null,
  "estimated_hours": number or null
}""",
    }

    prompt = prompts.get(intent, 'Return empty JSON: {}')

    result = llm.invoke([
        SystemMessage(content=f"Extract entities from the user message.\n\n{prompt}"),
        HumanMessage(content=state["user_message"])
    ])

    try:
        content = result.content.strip()
        if content.startswith("```"):
            lines   = content.split("\n")
            content = "\n".join(lines[1:-1])
        entities = json.loads(content)
    except Exception:
        entities = {}

    print(f"[Orchestrator] Entities: {entities}")
    return {**state, "entities": entities}

# ── Node 3: Route to Agent ────────────────────────────────────────
def route_to_agent(state: AgentState) -> str:
    """Decide which agent handles this intent."""
    routes = {
        "add_task":         "task_agent",
        "list_tasks":       "task_agent",
        "complete_task":    "task_agent",
        "add_assignment":   "assignment_agent",
        "list_assignments": "assignment_agent",
        "check_emails":     "email_agent",
        "get_briefing":     "briefing_agent",
        "get_schedule":     "schedule_agent",
        "general_chat":     "chat_agent",
    }
    route = routes.get(state["intent"], "chat_agent")
    print(f"[Orchestrator] Routing to: {route}")
    return route

# ── Node 4a: Task Agent ───────────────────────────────────────────
def task_agent_node(state: AgentState) -> AgentState:
    from backend.agents.task_agent import TaskAgent
    agent  = TaskAgent()
    intent = state["intent"]
    e      = state["entities"]

    if intent == "add_task":
        result = agent.create_task(
            title    = e.get("title", "New Task"),
            priority = e.get("priority", 2),
            deadline = e.get("deadline"),
        )
        if result["success"]:
            agent_result = f"CREATED_TASK:{e.get('title', 'New Task')}"
        else:
            agent_result = f"ERROR:{result['error']}"

    elif intent == "list_tasks":
        tasks        = agent.get_all_tasks()
        agent_result = f"TASK_LIST:{agent.format_task_list(tasks)}"

    elif intent == "complete_task":
        result = agent.complete_task(e.get("keyword", ""))
        if result["success"]:
            agent_result = f"COMPLETED_TASK:{result['task']['title']}"
        else:
            agent_result = f"ERROR:{result['error']}"

    else:
        agent_result = "ERROR:Unknown task intent"

    return {**state, "agent_result": agent_result}

# ── Node 4b: Assignment Agent ─────────────────────────────────────
def assignment_agent_node(state: AgentState) -> AgentState:
    from backend.agents.assignment_agent import AssignmentAgent
    agent  = AssignmentAgent()
    intent = state["intent"]
    e      = state["entities"]

    if intent == "add_assignment":
        if not e.get("due_date"):
            agent_result = "ERROR:No due date found in message"
        else:
            result = agent.create_assignment(
                course_code    = e.get("course_code", "MISC"),
                title          = e.get("title", "Assignment"),
                due_date       = e["due_date"],
                weight_percent = e.get("weight_percent"),
                estimated_hours= e.get("estimated_hours"),
            )
            if result["success"]:
                agent_result = f"CREATED_ASSIGNMENT:{e.get('title')}"
            else:
                agent_result = f"ERROR:{result['error']}"

    elif intent == "list_assignments":
        assignments  = agent.get_all_assignments()
        agent_result = f"ASSIGNMENT_LIST:{agent.format_assignment_list(assignments)}"

    else:
        agent_result = "ERROR:Unknown assignment intent"

    return {**state, "agent_result": agent_result}

# ── Node 4c: Email Agent ──────────────────────────────────────────
def email_agent_node(state: AgentState) -> AgentState:
    try:
        from backend.tools.gmail_tool import GmailTool
        from backend.agents.email_agent import EmailAgent

        gmail  = GmailTool()
        agent  = EmailAgent()
        emails = gmail.get_unread_emails(max_results=3)

        if not emails:
            return {**state, "agent_result": "EMAIL_RESULT:No unread emails"}

        summaries = []
        for email in emails:
            analysis = agent.analyze(email)
            emoji    = {
                "urgent":          "🚨",
                "action_required": "⚠️",
                "fyi":             "ℹ️",
                "spam":            "🗑️",
            }.get(analysis.classification, "📩")
            summaries.append(
                f"{emoji} {email['subject'][:50]}\n"
                f"   {analysis.summary[:100]}"
            )

        agent_result = "EMAIL_RESULT:" + "\n\n".join(summaries)

    except Exception as e:
        agent_result = f"ERROR:{str(e)}"

    return {**state, "agent_result": agent_result}

# ── Node 4d: Briefing Agent ───────────────────────────────────────
def briefing_agent_node(state: AgentState) -> AgentState:
    try:
        import requests
        tasks_resp  = requests.get("http://localhost:8000/tasks/",       timeout=5)
        assign_resp = requests.get("http://localhost:8000/assignments/", timeout=5)
        tasks       = tasks_resp.json()
        assignments = assign_resp.json()

        pending  = [t for t in tasks if t["status"] == "todo"]
        urgent   = [t for t in pending if t["priority"] == 1]
        upcoming = assignments[:3]

        parts = [
            f"TASKS:{len(pending)} pending, {len(urgent)} urgent",
            f"TOP_TASKS:{', '.join(t['title'] for t in pending[:3])}",
            f"ASSIGNMENTS:{len(upcoming)} upcoming",
            f"TOP_ASSIGNMENTS:{', '.join(a['course_code'] + ': ' + a['title'] for a in upcoming[:2])}",
        ]
        agent_result = "BRIEFING:" + " | ".join(parts)

    except Exception as e:
        agent_result = f"ERROR:{str(e)}"

    return {**state, "agent_result": agent_result}

# ── Node 4e: Chat Agent ───────────────────────────────────────────
def chat_agent_node(state: AgentState) -> AgentState:
    llm     = get_llm()
    context = state.get("memory_context", "")
    history_note = (
        f"Recent conversation:\n{context}\n\n"
        if context and context != "No previous conversation history."
        else ""
    )
    result = llm.invoke([
        SystemMessage(content=f"""You are a helpful personal productivity assistant.
You help students manage tasks, assignments, and emails.
Be friendly, concise, and use emojis occasionally.
Keep replies under 3 sentences.
{history_note}"""),
        HumanMessage(content=state["user_message"])
    ])
    return {**state, "agent_result": f"CHAT:{result.content}"}


# ── Node 4f: Schedule Agent ───────────────────────────────────────
def schedule_agent_node(state: AgentState) -> AgentState:
    try:
        from backend.agents.smart_scheduler import SmartSchedulerAgent
        agent = SmartSchedulerAgent()
        plan  = agent.generate_plan(days_ahead=3)
        return {**state, "agent_result": f"SCHEDULE:{plan}"}
    except Exception as e:
        return {**state, "agent_result": f"ERROR:{str(e)}"}

# ── Node 5: Synthesize Response ───────────────────────────────────
def synthesize_response(state: AgentState) -> AgentState:
    """Turn the agent result into a friendly user-facing message."""
    llm          = get_llm()
    agent_result = state["agent_result"]
    intent       = state["intent"]

    # Handle chat directly without extra LLM call
    if agent_result.startswith("CHAT:"):
        final = agent_result[5:]

    # Handle errors
    elif agent_result.startswith("ERROR:"):
        error = agent_result[6:]
        final = f"❌ Sorry, something went wrong: {error}"

    # Schedule response — already formatted — pass through
    elif agent_result.startswith("SCHEDULE:"):
        final = agent_result[9:]

    else:
        result = llm.invoke([
            SystemMessage(content="""You are a friendly productivity assistant.
Convert the agent result into a natural, helpful reply.
Use emojis. Be concise. Max 5 lines.
Do not mention 'agent result' or technical terms."""),
            HumanMessage(content=f"""User said: "{state['user_message']}"
Agent result: {agent_result}
Write a friendly reply:""")
        ])
        final = result.content

    # ── Save this exchange to memory ──────────────────────────────
    try:
        from backend.agents.memory_agent import MemoryAgent
        mem = MemoryAgent(session_id=state.get("session_id", "default"))
        mem.save("user",      state["user_message"])
        mem.save("assistant", final)
    except Exception as e:
        print(f"[Memory] Save error: {e}")

    return {**state, "final_response": final}

# ── Build the Graph ───────────────────────────────────────────────
def build_orchestrator():
    graph = StateGraph(AgentState)

    # Add all nodes
    graph.add_node("load_memory",      load_memory)
    graph.add_node("classify",         classify_intent)
    graph.add_node("extract",          extract_entities)
    graph.add_node("task_agent",       task_agent_node)
    graph.add_node("assignment_agent", assignment_agent_node)
    graph.add_node("email_agent",      email_agent_node)
    graph.add_node("briefing_agent",   briefing_agent_node)
    graph.add_node("schedule_agent",   schedule_agent_node)
    graph.add_node("chat_agent",       chat_agent_node)
    graph.add_node("synthesize",       synthesize_response)

    # Flow: load_memory → classify → extract → route → agent → synthesize → END
    graph.set_entry_point("load_memory")
    graph.add_edge("load_memory", "classify")
    graph.add_edge("classify",    "extract")

    graph.add_conditional_edges(
        "extract",
        route_to_agent,
        {
            "task_agent":       "task_agent",
            "assignment_agent": "assignment_agent",
            "email_agent":      "email_agent",
            "briefing_agent":   "briefing_agent",
            "schedule_agent":   "schedule_agent",
            "chat_agent":       "chat_agent",
        }
    )

    graph.add_edge("task_agent",       "synthesize")
    graph.add_edge("assignment_agent", "synthesize")
    graph.add_edge("email_agent",      "synthesize")
    graph.add_edge("briefing_agent",   "synthesize")
    graph.add_edge("schedule_agent",   "synthesize")
    graph.add_edge("chat_agent",       "synthesize")
    graph.add_edge("synthesize",       END)

    return graph.compile()

# Create single instance
orchestrator = build_orchestrator()

def run_orchestrator(user_message: str, session_id: str = "default") -> str:
    """Main entry point — takes user message, returns AI response."""
    try:
        state = orchestrator.invoke({
            "user_message":   user_message,
            "session_id":     session_id,
            "intent":         "",
            "entities":       {},
            "agent_result":   "",
            "final_response": "",
            "memory_context": "",
        })
        return state["final_response"]
    except Exception as e:
        print(f"Orchestrator error: {e}")
        return f"❌ Sorry, I ran into an error: {str(e)[:100]}"