import asyncio
import httpx
from telegram.ext import MessageHandler, filters
from telegram import Update
from telegram.ext import (
    ApplicationBuilder, CommandHandler, ContextTypes
)
from backend.core.config import settings

API = "http://localhost:8000"

PRIORITY_EMOJI = {1: "🔴", 2: "🟠", 3: "🟡", 4: "🟢"}
STATUS_EMOJI   = {
    "todo":        "⬜",
    "in_progress": "🔄",
    "done":        "✅",
    "blocked":     "🚫",
    "cancelled":   "❌"
}

# ── /start ────────────────────────────────────────────────────────
async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👋 *Welcome to AI Life Admin!*\n\n"
        "💬 *Just type naturally:*\n"
        "  'Add a task to study for exams'\n"
        "  'What tasks do I have?'\n"
        "  'Mark math homework as done'\n"
        "  'Show my assignments'\n"
        "  'Give me a briefing'\n"
        "  'Remember that I work best in mornings'\n\n"
        "📋 *Commands:*\n"
        "/tasks — list tasks\n"
        "/add <title> — add a task\n"
        "/done <keyword> — complete a task\n"
        "/assignments — list assignments\n"
        "/newasgn COURSE|TITLE|DATE|WEIGHT — add assignment\n"
        "/emails — check and summarize Gmail\n"
        "/schedule — AI time-blocked schedule\n"
        "/aiplan — AI 3-day study plan\n"
        "/brief — morning briefing\n"
        "/plan — daily plan\n"
        "/memory — what I remember about you\n"
        "/forget — clear conversation memory\n"
        "/help — show this message",
        parse_mode="Markdown"
    )

# ── /tasks ────────────────────────────────────────────────────────
async def list_tasks(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{API}/tasks/")
    if resp.status_code != 200:
        await update.message.reply_text("❌ Could not reach API. Is it running?")
        return
    tasks   = resp.json()
    pending = [t for t in tasks if t["status"] != "done"]
    if not pending:
        await update.message.reply_text("🎉 No pending tasks! You're all caught up.")
        return
    lines = []
    for t in pending[:15]:
        p        = PRIORITY_EMOJI.get(t["priority"], "⚪")
        s        = STATUS_EMOJI.get(t["status"], "⬜")
        deadline = f"  ⏰ {t['deadline'][:10]}" if t.get("deadline") else ""
        lines.append(f"{p}{s} {t['title']}{deadline}")
    text = "📋 *Your Tasks:*\n\n" + "\n".join(lines)
    if len(pending) > 15:
        text += f"\n\n_...and {len(pending)-15} more_"
    await update.message.reply_text(text, parse_mode="Markdown")

# ── /add ──────────────────────────────────────────────────────────
async def add_task(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not ctx.args:
        await update.message.reply_text("Usage: /add Finish math homework")
        return
    title = " ".join(ctx.args)
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{API}/tasks/", json={"title": title})
    if resp.status_code == 201:
        await update.message.reply_text(
            f"✅ Task added!\n📌 *{title}*", parse_mode="Markdown"
        )
    else:
        await update.message.reply_text("❌ Failed to add task.")

# ── /done ─────────────────────────────────────────────────────────
async def done_task(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not ctx.args:
        await update.message.reply_text("Usage: /done groceries")
        return
    keyword = " ".join(ctx.args).lower()
    async with httpx.AsyncClient() as client:
        resp  = await client.get(f"{API}/tasks/")
        tasks = resp.json()
    match = None
    for t in tasks:
        if keyword in t["title"].lower() and t["status"] != "done":
            match = t
            break
    if not match:
        await update.message.reply_text(
            f"❓ No task found matching '*{keyword}*'",
            parse_mode="Markdown"
        )
        return
    async with httpx.AsyncClient() as client:
        await client.patch(f"{API}/tasks/{match['id']}", json={"status": "done"})
    await update.message.reply_text(
        f"✅ Marked as done!\n📌 *{match['title']}*",
        parse_mode="Markdown"
    )

# ── /assignments ──────────────────────────────────────────────────
async def list_assignments(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{API}/assignments/")
    items = resp.json()
    if not items:
        await update.message.reply_text(
            "📚 No assignments tracked yet.\n"
            "Use: /newasgn CS301|Homework 3|2026-03-25|30"
        )
        return
    lines = []
    for a in items:
        due    = a["due_date"][:10] if a.get("due_date") else "No date"
        weight = f" ({a['weight_percent']}%)" if a.get("weight_percent") else ""
        lines.append(
            f"📘 *{a['course_code']}*{weight} — {a['title']}\n"
            f"   📅 Due: {due}"
        )
    await update.message.reply_text(
        "📚 *Your Assignments:*\n\n" + "\n\n".join(lines),
        parse_mode="Markdown"
    )

# ── /newasgn ──────────────────────────────────────────────────────
async def new_assignment(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not ctx.args:
        await update.message.reply_text(
            "Format: /newasgn COURSE|TITLE|YYYY-MM-DD|WEIGHT\n"
            "Example: /newasgn CS301|Homework 3|2026-03-25|30"
        )
        return
    text  = " ".join(ctx.args)
    parts = text.split("|")
    if len(parts) < 3:
        await update.message.reply_text(
            "❌ Wrong format.\n"
            "Use: /newasgn CS301|Homework 3|2026-03-25|30"
        )
        return
    course = parts[0].strip()
    title  = parts[1].strip()
    due    = parts[2].strip()
    weight = float(parts[3].strip()) if len(parts) > 3 else None
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{API}/assignments/", json={
            "course_code":    course,
            "title":          title,
            "due_date":       due + "T23:59:00+00:00",
            "weight_percent": weight
        })
    if resp.status_code == 201:
        await update.message.reply_text(
            f"✅ Assignment added!\n"
            f"📘 *{course}*: {title}\n"
            f"📅 Due: {due}",
            parse_mode="Markdown"
        )
    else:
        await update.message.reply_text(f"❌ Failed: {resp.text}")

# ── /emails ───────────────────────────────────────────────────────
async def check_emails_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("📧 Checking your emails... please wait")
    try:
        from backend.tools.gmail_tool import GmailTool
        from backend.agents.email_agent import EmailAgent
        gmail  = GmailTool()
        agent  = EmailAgent()
        emails = gmail.get_unread_emails(max_results=5)
        if not emails:
            await update.message.reply_text("📭 No unread emails!")
            return
        response_lines = [f"📧 *{len(emails)} unread emails:*\n"]
        for email in emails:
            analysis = agent.analyze(email)
            emoji    = {
                "urgent":          "🚨",
                "action_required": "⚠️",
                "fyi":             "ℹ️",
                "spam":            "🗑️",
            }.get(analysis.classification, "📩")
            response_lines.append(
                f"{emoji} *{email['subject'][:60]}*\n"
                f"From: {email['sender'][:40]}\n"
                f"_{analysis.summary[:120]}_"
            )
            if analysis.action_items:
                response_lines.append("📌 Actions:")
                for item in analysis.action_items:
                    deadline = f" (due {item.deadline})" if item.deadline else ""
                    response_lines.append(f"  • {item.title}{deadline}")
            response_lines.append("")
        await update.message.reply_text(
            "\n".join(response_lines), parse_mode="Markdown"
        )
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)[:100]}")

# ── /schedule ─────────────────────────────────────────────────────
async def schedule_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("📅 Building your smart schedule...")
    try:
        from backend.agents.smart_scheduler import SmartSchedulerAgent
        agent    = SmartSchedulerAgent()
        schedule = agent.format_slots_telegram()
        await update.message.reply_text(schedule, parse_mode="Markdown")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)[:100]}")

# ── /aiplan ───────────────────────────────────────────────────────
async def ai_plan(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🤖 Creating your AI study plan...")
    try:
        from backend.agents.smart_scheduler import SmartSchedulerAgent
        agent = SmartSchedulerAgent()
        plan  = agent.generate_plan(days_ahead=3)
        await update.message.reply_text(plan, parse_mode="Markdown")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)[:100]}")

# ── /brief ────────────────────────────────────────────────────────
async def morning_brief(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("☀️ Generating your briefing...")
    try:
        from backend.agents.planning_agent import PlanningAgent
        agent    = PlanningAgent()
        briefing = agent.generate_morning_briefing()
        await update.message.reply_text(briefing, parse_mode="Markdown")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)[:100]}")

# ── /plan ─────────────────────────────────────────────────────────
async def daily_plan(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("📅 Generating your daily plan...")
    try:
        from backend.agents.planning_agent import PlanningAgent
        agent = PlanningAgent()
        plan  = agent.generate_daily_plan()
        await update.message.reply_text(plan, parse_mode="Markdown")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)[:100]}")

# ── /memory ───────────────────────────────────────────────────────
async def show_memory(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    try:
        from backend.agents.memory_agent import MemoryAgent
        memory = MemoryAgent()
        facts  = memory.get_recent_facts(5)
        prefs  = memory.memory["preferences"]
        stats  = memory.memory["stats"]
        lines  = ["🧠 *What I remember about you:*\n"]
        if facts:
            lines.append("*Recent facts:*")
            for f in facts:
                lines.append(f"  • {f['fact']}")
        else:
            lines.append("_No facts stored yet._")
        if prefs:
            lines.append("\n*Your preferences:*")
            for k, v in prefs.items():
                lines.append(f"  • {k}: {v}")
        lines.append(f"\n*Stats:*")
        lines.append(f"  • Tasks completed: {stats['tasks_completed']}")
        lines.append(f"  • Days active: {stats['days_active']}")
        await update.message.reply_text(
            "\n".join(lines), parse_mode="Markdown"
        )
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)[:100]}")

# ── /forget ───────────────────────────────────────────────────────
async def forget_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    try:
        from backend.agents.memory_agent import MemoryAgent
        memory = MemoryAgent()
        memory.memory["conversation"] = []
        memory._save()
        await update.message.reply_text(
            "🧹 Conversation memory cleared!\n"
            "I still remember your facts and preferences."
        )
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)[:100]}")

# ── /help ─────────────────────────────────────────────────────────
async def help_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await start(update, ctx)

# ── Natural language ──────────────────────────────────────────────
async def handle_natural_language(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user_message = update.message.text
    print(f"[Bot] Received: {user_message}")
    await ctx.bot.send_chat_action(
        chat_id=update.effective_chat.id,
        action="typing"
    )
    try:
        from backend.agents.orchestrator import run_orchestrator
        response = run_orchestrator(user_message)
        await update.message.reply_text(response, parse_mode="Markdown")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)[:100]}")

# ── Main ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🤖 Starting Telegram bot...")
    print(f"Bot token: {settings.TELEGRAM_BOT_TOKEN[:10]}...")

    app = ApplicationBuilder().token(settings.TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler("start",         start))
    app.add_handler(CommandHandler("help",          help_cmd))
    app.add_handler(CommandHandler("tasks",         list_tasks))
    app.add_handler(CommandHandler("add",           add_task))
    app.add_handler(CommandHandler("done",          done_task))
    app.add_handler(CommandHandler("assignments",   list_assignments))
    app.add_handler(CommandHandler("newasgn",       new_assignment))
    app.add_handler(CommandHandler("emails",        check_emails_cmd))
    app.add_handler(CommandHandler("schedule",      schedule_cmd))
    app.add_handler(CommandHandler("aiplan",        ai_plan))
    app.add_handler(CommandHandler("brief",         morning_brief))
    app.add_handler(CommandHandler("plan",          daily_plan))
    app.add_handler(CommandHandler("memory",        show_memory))
    app.add_handler(CommandHandler("forget",        forget_cmd))
    app.add_handler(MessageHandler(
        filters.TEXT & ~filters.COMMAND,
        handle_natural_language
    ))

    print("✅ Bot is running! Open Telegram and type /start")
    app.run_polling()