# AI Life Admin 🚀

A premium, AI-powered personal productivity dashboard designed to handle life, study, and automation.

## ✨ Core Features

### 🗺️ Academic Voyager (NEW)
- **Syllabus-to-Strategy**: Paste your core topics and get a day-by-day study roadmap.
- **Milestone Tracking**: Integrated support for MST 1, MST 2, Practicals, and Final Exams.
- **Flexible Pacing**: Customize your completion timeline from 7 to 60 days.

### 📅 Smart AI Scheduling
- **Time-Blocked Plans**: AI-generated daily roadmaps optimized for your focus hours.
- **Dynamic Briefings**: Personalized Morning, Afternoon, and Evening updates based on your current agenda.

### 📧 Intelligent Inbox
- **Gmail Sync**: Direct integration with Gmail API to fetch unread priorities.
- **Action Matrix**: Transition emails directly into tasks and mark them as read from the dashboard.

### 🎨 Premium Experience
- **Mobile-Responsive**: Fluid transitions between desktop sidebar and mobile bottom navigation.
- **Modern Aesthetics**: Glassmorphism, radiant gradients, and micro-animations for a high-end feel.
- **Personalization**: Customize your name, email, and preferences; reflected instantly in AI greetings.

---

## 🛠️ Technology Stack

**Frontend**:
- Framework: Next.js 16 (Turbopack)
- Styling: Tailwind CSS 4
- Icons: Lucide React
- Components: Glass-polished responsive architecture

**Backend**:
- API: FastAPI (Python)
- Database: SQLite with SQLAlchemy ORM
- AI Engine: LangChain with Groq LLM (Llama 3.1)
- Scheduler: APScheduler for background briefings and recaps

---

## 🚀 Getting Started

1. **Environment Setup**:
   - Install requirements: `pip install -r requirements.txt`
   - Setup `.env` with your `GROQ_API_KEY`, `DATABASE_URL`, and Gmail credentials.

2. **Authorization**:
   - Place your `credentials.json` in the project root.
   - Run the app; follow the terminal link to authorize Gmail on first sync.

3. **Running the App**:
   - Use the provided `start.bat` on Windows to launch both Backend and Frontend.
   - Or run separately:
     - Backend: `uvicorn backend.main:app --reload`
     - Frontend: `npm run dev`

---

## 🏗️ Architecture

- **Orchestrator**: Manages state between memory agents, task agents, and assignment agents.
- **Memory Agent**: Persists long-term user context and learns habits.
- **Planning Agent**: Generates the strategic briefings and academic roadmaps.
- **Direct-DB Workers**: Optimized background workers that access the database directly to prevent deadlocks.

---
**Crafted for High-Efficiency Students and Professionals.**
