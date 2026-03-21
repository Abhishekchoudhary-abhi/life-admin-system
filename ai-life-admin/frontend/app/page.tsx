"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  getTasks, 
  getAssignments, 
  Task, 
  Assignment, 
  createTask,
  getAIBriefing,
  getAILifestyleStrategy,
  getUnreadEmails,
  markEmailAsRead,
  getSettings,
  updateSettings,
  clearMemoryCache,
  generateRoadmap,
  getSubjects,
  createSubject,
  updateAttendance,
  decreaseAttendance,
  getTimetable,
  addTimetableSlot,
  getMarks,
  addMark,
  generateAttendancePredictions,
  getAttendancePredictions,
  updatePredictionStatus
} from "@/lib/api";
import { 
  CheckCircle2, 
  Clock, 
  Plus,
  RefreshCcw,
  AlertTriangle,
  Zap,
  BarChart3,
  BookOpen,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  Mail,
  Inbox,
  Settings,
  User,
  Shield,
  Bell,
  Trash2,
  Brain,
  Sparkles,
  Calendar,
  Map as MapIcon,
  Book,
  Timer,
  GraduationCap,
  History,
  TrendingDown,
  ChevronRight
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import TaskCard from "@/components/TaskCard";
import AssignmentCard from "@/components/AssignmentCard";
import AddTaskModal from "@/components/AddTaskModal";
import AddAssignmentModal from "@/components/AddAssignmentModal";
import UIMSAddModal from "@/components/UIMSAddModal";
import MorningBriefingPanel from "@/components/MorningBriefingPanel";
import ProductivityInsight from "@/components/ProductivityInsight";
import ProductivityChart from "@/components/ProductivityChart";
import AttendanceTimeline from "@/components/AttendanceTimeline";
import { cn } from "@/lib/utils";
import { generateAISchedule } from "@/lib/api";

type Tab = "overview" | "tasks" | "assignments" | "roadmap" | "schedule" | "insights" | "mail" | "settings" | "uims";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiOk, setApiOk] = useState(true);

  // Roadmap State
  const [syllabusTopics, setSyllabusTopics] = useState("");
  const [mst1, setMst1] = useState("");
  const [mst2, setMst2] = useState("");
  const [practicals, setPracticals] = useState("");
  const [finals, setFinals] = useState("");
  const [roadmapDays, setRoadmapDays] = useState(14);
  const [roadmapResult, setRoadmapResult] = useState("");
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  // UIMS State
  const [subjects, setSubjects] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selectedSubjectForTimeline, setSelectedSubjectForTimeline] = useState<string | null>(null);
  const [uimsSubTab, setUimsSubTab] = useState<"home" | "attendance" | "timetable" | "marks" | "prediction">("home");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAsgModal, setShowAsgModal] = useState(false);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState(0);
  const [showUIMSModal, setShowUIMSModal] = useState<{ open: boolean; type: "subject" | "slot" | "mark" }>({ open: false, type: "subject" });
  
  // AI States
  const [briefing, setBriefing] = useState("");
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [lifestyleStrategy, setLifestyleStrategy] = useState("");
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [schedulePlan, setSchedulePlan] = useState("");
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [isFetchingMail, setIsFetchingMail] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [isFetchingSettings, setIsFetchingSettings] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  const loadSettings = useCallback(async () => {
    setIsFetchingSettings(true);
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (err) {
      console.error("Settings error:", err);
    } finally {
      setIsFetchingSettings(false);
    }
  }, []);

  const handleUpdateSettings = async (updates: any) => {
    try {
      await updateSettings(updates);
      setSettings((prev: any) => ({ ...prev, ...updates }));
    } catch (err) {
      console.error("Update settings error:", err);
    }
  };

  const handleClearCache = async () => {
    try {
      await clearMemoryCache();
      alert("AI Memory Cache Cleared Successfully");
    } catch (err) {
      console.error("Clear cache error:", err);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!syllabusTopics) return alert("Please provide syllabus topics.");
    setIsGeneratingRoadmap(true);
    try {
      const data = await generateRoadmap(syllabusTopics, { mst1, mst2, practicals, finals }, roadmapDays);
      setRoadmapResult(data.roadmap);
    } catch (err) {
      console.error("Roadmap error:", err);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const loadUIMSData = useCallback(async () => {
    try {
      const [subs, tt, mrks] = await Promise.all([
        getSubjects(),
        getTimetable(),
        getMarks()
      ]);
      setSubjects(subs);
      setTimetable(tt);
      setMarks(mrks);
      // Set first subject as default for timeline
      if (subs.length > 0 && !selectedSubjectForTimeline) {
        setSelectedSubjectForTimeline(subs[0].id);
      }
    } catch (err) {
      console.error("UIMS load error:", err);
    }
  }, [selectedSubjectForTimeline]);

  const loadBriefing = useCallback(async () => {
    setIsGeneratingBriefing(true);
    try {
      const data = await getAIBriefing();
      setBriefing(data.briefing);
    } catch (err) {
      console.error("Briefing error:", err);
    } finally {
      setIsGeneratingBriefing(false);
    }
  }, []);

  const loadEmails = useCallback(async () => {
    setIsFetchingMail(true);
    try {
      const data = await getUnreadEmails();
      setEmails(data.emails);
    } catch (err) {
      console.error("Mail error:", err);
    } finally {
      setIsFetchingMail(false);
    }
  }, []);

  const handleGenerateStrategy = async () => {
    setIsGeneratingStrategy(true);
    try {
      const data = await getAILifestyleStrategy();
      setLifestyleStrategy(data.strategy);
    } catch (err) {
      console.error("Strategy error:", err);
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleGenerateSchedule = async () => {
    setIsGeneratingSchedule(true);
    setActiveTab("schedule");
    try {
      const data = await generateAISchedule(7);
      setSchedulePlan(data.plan);
    } catch (err) {
      console.error("Schedule error:", err);
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const handleUIMSAdd = async (type: string, data: any) => {
    try {
      if (type === "subject") {
        await createSubject(data.name, data.faculty);
      } else if (type === "slot") {
        await addTimetableSlot(data);
      } else if (type === "mark") {
        await addMark(data);
      }
      await loadUIMSData();
    } catch (err) {
      console.error("UIMS Add error:", err);
      throw err;
    }
  };

  const loadPredictions = useCallback(async (subjectId: string) => {
    try {
      const preds = await getAttendancePredictions(subjectId);
      setPredictions(preds);
    } catch (err) {
      console.error("Predictions load error:", err);
    }
  }, []);

  const handleGeneratePredictions = async (subjectId: string) => {
    try {
      await generateAttendancePredictions(subjectId, 30);
      await loadPredictions(subjectId);
    } catch (err) {
      console.error("Generate predictions error:", err);
    }
  };

  const currentPeriod = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    return "evening";
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [t, a] = await Promise.all([getTasks(), getAssignments()]);
      setTasks(t);
      setAssignments(a);
      setApiOk(true);
    } catch (err) {
      setApiOk(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("This browser does not support notifications.");
      return;
    }

    const result = await Notification.requestPermission();
    setNotificationPermission(result);
    if (result === "granted") {
      new Notification("Notifications enabled", {
        body: "Lecture and task reminders are active.",
      });
    }
  }, []);

  const parseTimeToMinutes = useCallback((time: string) => {
    const value = (time || "00:00").trim().toLowerCase();
    const ampmMatch = value.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);
    if (ampmMatch) {
      let h = parseInt(ampmMatch[1], 10);
      const m = parseInt(ampmMatch[2], 10);
      const meridiem = ampmMatch[3];
      if (meridiem === "pm" && h < 12) h += 12;
      if (meridiem === "am" && h === 12) h = 0;
      return (h * 60) + m;
    }

    const [hText, mText] = value.split(":");
    let h = parseInt(hText || "0", 10);
    const m = parseInt(mText || "0", 10);
    if (h >= 1 && h <= 6) h += 12;
    return (h * 60) + m;
  }, []);

  const shouldNotifyNow = useCallback((target: Date, minutesBefore: number = 10) => {
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    return diffMinutes >= 0 && diffMinutes <= minutesBefore;
  }, []);

  const sendReminder = useCallback((key: string, title: string, body: string) => {
    if (typeof window === "undefined" || notificationPermission !== "granted") return;

    const storageKey = `notify:${key}`;
    if (localStorage.getItem(storageKey)) return;

    new Notification(title, { body });
    localStorage.setItem(storageKey, new Date().toISOString());
  }, [notificationPermission]);

  const notificationConfig = useMemo(() => {
    const lead = Number(settings?.notification_lead_minutes ?? 10);
    return {
      enabled: settings?.notifications_enabled ?? true,
      lectures: settings?.notify_lectures ?? true,
      tasks: settings?.notify_tasks ?? true,
      assignments: settings?.notify_assignments ?? true,
      emails: settings?.notify_emails ?? false,
      leadMinutes: Number.isFinite(lead) ? Math.max(1, Math.min(60, lead)) : 10,
    };
  }, [settings]);

  const checkLectureReminders = useCallback(() => {
    if (notificationPermission !== "granted" || !notificationConfig.enabled || !notificationConfig.lectures) return;

    const dayMap = {
      0: "Sunday",
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday",
    } as const;

    const now = new Date();
    const todayName = dayMap[now.getDay() as keyof typeof dayMap];
    const todaySlots = timetable.filter((slot) => slot.day === todayName);

    for (const slot of todaySlots) {
      const lectureMinutes = parseTimeToMinutes(slot.start_time);
      const lectureDate = new Date(now);
      lectureDate.setHours(Math.floor(lectureMinutes / 60), lectureMinutes % 60, 0, 0);

      if (shouldNotifyNow(lectureDate, notificationConfig.leadMinutes)) {
        const subjectName = subjects.find((s) => s.id === slot.subject_id)?.name || "Lecture";
        sendReminder(
          `lecture:${slot.id}:${lectureDate.toDateString()}`,
          `Upcoming lecture: ${subjectName}`,
          `Starts at ${slot.start_time}${slot.room ? ` in ${slot.room}` : ""} (in about ${notificationConfig.leadMinutes} minutes).`
        );
      }
    }
  }, [notificationConfig.enabled, notificationConfig.lectures, notificationConfig.leadMinutes, notificationPermission, parseTimeToMinutes, sendReminder, shouldNotifyNow, subjects, timetable]);

  const checkTaskAndAssignmentReminders = useCallback(() => {
    if (notificationPermission !== "granted" || !notificationConfig.enabled) return;

    if (notificationConfig.tasks) {
      for (const task of tasks) {
        if (task.status === "done") continue;
        const candidate = task.scheduled_at || task.deadline;
        if (!candidate) continue;

        const when = new Date(candidate);
        if (Number.isNaN(when.getTime())) continue;

        if (shouldNotifyNow(when, notificationConfig.leadMinutes)) {
          sendReminder(
            `task:${task.id}:${when.toISOString()}`,
            `Upcoming task: ${task.title}`,
            `Reminder at ${when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
          );
        }
      }
    }

    if (notificationConfig.assignments) {
      for (const assignment of assignments) {
        if (assignment.status === "done" || assignment.status === "submitted") continue;

        const due = new Date(assignment.due_date);
        if (Number.isNaN(due.getTime())) continue;
        if (!assignment.due_date.includes("T")) {
          due.setHours(9, 0, 0, 0);
        }

        if (shouldNotifyNow(due, notificationConfig.leadMinutes)) {
          sendReminder(
            `assignment:${assignment.id}:${due.toISOString()}`,
            `Upcoming assignment: ${assignment.title}`,
            `Due soon (${assignment.course_code}) at ${due.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
          );
        }
      }
    }
  }, [assignments, notificationConfig.assignments, notificationConfig.enabled, notificationConfig.leadMinutes, notificationConfig.tasks, notificationPermission, sendReminder, shouldNotifyNow, tasks]);

  const checkEmailReminders = useCallback(() => {
    if (notificationPermission !== "granted" || !notificationConfig.enabled || !notificationConfig.emails) return;

    for (const mail of emails) {
      const key = `email:${mail.id}`;
      sendReminder(
        key,
        "Unread email reminder",
        `${mail.subject || "New email"}${mail.from ? ` from ${mail.from}` : ""}`
      );
    }
  }, [emails, notificationConfig.emails, notificationConfig.enabled, notificationPermission, sendReminder]);

  useEffect(() => {
    loadBriefing();
    loadEmails();
    loadSettings();
    loadUIMSData();
  }, [currentPeriod, loadBriefing, loadEmails, loadSettings, loadUIMSData]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setNotificationPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (notificationPermission !== "granted") return;

    checkLectureReminders();
    checkTaskAndAssignmentReminders();
    checkEmailReminders();

    const interval = setInterval(() => {
      checkLectureReminders();
      checkTaskAndAssignmentReminders();
      checkEmailReminders();
    }, 60000);

    return () => clearInterval(interval);
  }, [
    checkLectureReminders,
    checkTaskAndAssignmentReminders,
    checkEmailReminders,
    notificationPermission,
  ]);

  // Logic
  const pendingTasks = useMemo(() => tasks.filter((t: Task) => t.status !== "done"), [tasks]);
  const completedToday = useMemo(() => tasks.filter((t: Task) => {
    if (t.status !== "done" || !t.updated_at) return false;
    return new Date(t.updated_at).toDateString() === new Date().toDateString();
  }), [tasks]);
  const urgentTasks = useMemo(() => pendingTasks.filter((t: Task) => t.priority === 1), [pendingTasks]);
  
  const filteredTasks = useMemo(() => {
    return pendingTasks
      .filter((t: Task) => priorityFilter === 0 || t.priority === priorityFilter)
      .filter((t: Task) => !search || t.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a: Task, b: Task) => a.priority - b.priority);
  }, [pendingTasks, priorityFilter, search]);

  const efficiencyScore = useMemo(() => {
    const total = pendingTasks.length + completedToday.length;
    return total > 0 ? Math.round((completedToday.length / total) * 100) : 0;
  }, [pendingTasks, completedToday]);

  const todayTimetable = useMemo(() => {
    const dayMap = {
      0: "Sunday",
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday",
    } as const;

    const todayName = dayMap[new Date().getDay() as keyof typeof dayMap];

    const toMinutes = (time: string) => {
      const value = (time || "00:00").trim().toLowerCase();
      const ampmMatch = value.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);
      if (ampmMatch) {
        let h = parseInt(ampmMatch[1], 10);
        const m = parseInt(ampmMatch[2], 10);
        const meridiem = ampmMatch[3];
        if (meridiem === "pm" && h < 12) h += 12;
        if (meridiem === "am" && h === 12) h = 0;
        return (h * 60) + m;
      }

      const [hText, mText] = value.split(":");
      let h = parseInt(hText || "0", 10);
      const m = parseInt(mText || "0", 10);

      if (h >= 1 && h <= 6) {
        h += 12;
      }

      return (h * 60) + m;
    };

    return [...timetable]
      .filter((slot) => slot.day === todayName)
      .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
  }, [timetable]);

  const timetableByDay = useMemo(() => {
    const toMinutes = (time: string) => {
      const value = (time || "00:00").trim().toLowerCase();
      const ampmMatch = value.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);
      if (ampmMatch) {
        let h = parseInt(ampmMatch[1], 10);
        const m = parseInt(ampmMatch[2], 10);
        const meridiem = ampmMatch[3];
        if (meridiem === "pm" && h < 12) h += 12;
        if (meridiem === "am" && h === 12) h = 0;
        return (h * 60) + m;
      }

      const [hText, mText] = value.split(":");
      let h = parseInt(hText || "0", 10);
      const m = parseInt(mText || "0", 10);

      if (h >= 1 && h <= 6) {
        h += 12;
      }

      return (h * 60) + m;
    };

    const dayMap: Record<string, any[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    };

    for (const slot of timetable) {
      if (dayMap[slot.day]) {
        dayMap[slot.day].push(slot);
      }
    }

    for (const day of Object.keys(dayMap)) {
      dayMap[day].sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
    }

    return dayMap;
  }, [timetable]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center shadow-2xl animate-bounce">
          <Zap className="w-8 h-8 text-white fill-current" />
        </div>
        <div className="text-center space-y-2">
          <p className="font-black text-brand-textMain uppercase tracking-[0.2em] animate-pulse">Life Admin</p>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Syncing your life admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-white overflow-hidden text-brand-textMain font-sans relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={settings} />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar
          onAddTask={() => setShowTaskModal(true)}
          onAddAssignment={() => setShowAsgModal(true)}
          onRequestNotifications={requestNotificationPermission}
          apiOk={apiOk}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === "overview" && (
            <div className="p-4 pb-32 lg:p-8 space-y-8 animate-in fade-in duration-700">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <StatCard label="Tasks" value={pendingTasks.length} icon={CheckCircle2} color="blue" trend={{ value: 12, isUp: true }} />
                <StatCard label="Course" value={assignments.length} icon={BookOpen} color="purple" trend={{ value: 5, isUp: true }} />
                <StatCard label="Inbox" value={emails.length} icon={Mail} color="cyan" />
                <StatCard label="Efficiency" value={`${efficiencyScore}%`} icon={Zap} color="rose" />
              </div>

              <div className="grid grid-cols-12 gap-6 lg:gap-8">
                {/* Left Column */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
                  <MorningBriefingPanel 
                    briefing={briefing} 
                    isLoading={isGeneratingBriefing} 
                    tasksCount={pendingTasks.length} 
                    urgentCount={urgentTasks.length} 
                    username={settings?.username}
                    onApplySuggestions={() => handleGenerateSchedule()}
                  />
                  
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-brand-blue rounded-full shadow-[0_0_8px_rgba(0,209,255,0.3)]"></div>
                        <h3 className="text-sm font-black text-brand-textMain uppercase tracking-[0.15em]">Priority Focus</h3>
                      </div>
                      <button onClick={() => setActiveTab("tasks")} className="text-[11px] font-bold text-gray-500 hover:text-brand-textMain flex items-center gap-2 transition-colors">
                        Action Matrix <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid gap-4">
                      {pendingTasks.slice(0, 5).map(task => (
                        <TaskCard key={task.id} task={task} onUpdate={loadData} />
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Column */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
                  <ProductivityChart />
                  
                  {/* Strategy Advisor Component */}
                  <section className="card-polish rounded-3xl p-8 bg-white relative overflow-hidden gradient-border flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/20">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-brand-textMain">AI Advisor</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Personalized Strategy</p>
                      </div>
                    </div>

                    <div className="flex-1 bg-gray-50 rounded-2xl p-5 border border-gray-100 min-h-[150px] flex flex-col">
                      <div className="text-xs text-gray-600 leading-relaxed font-medium overflow-hidden line-clamp-6">
                        {lifestyleStrategy || "Your AI is computing a personalized growth strategy based on your study patterns and habits."}
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveTab("insights")}
                      className="w-full py-4 rounded-2xl bg-gray-50 hover:bg-white border border-gray-100 text-brand-textMain font-black text-[11px] shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-3 uppercase tracking-[0.2em]"
                    >
                      <Sparkles className="w-4 h-4 text-brand-blue" />
                      <span>Full Insights</span>
                    </button>
                  </section>
                </div>
              </div>
            </div>
          )}

          {activeTab === "uims" && (
            <div className="p-4 pb-32 lg:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               {/* UIMS Header & Sub-nav */}
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-brand-textMain uppercase tracking-tight">UIMS Academic Hub</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Unified Institutional Management Simulator</p>
                  </div>
                  <div className="flex bg-gray-50 p-1 rounded-2xl border border-black/5 self-start md:self-auto overflow-x-auto no-scrollbar">
                    {["home", "attendance", "timetable", "marks", "prediction"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setUimsSubTab(tab as any)}
                        className={cn(
                          "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                          uimsSubTab === tab ? "bg-white text-brand-blue shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
               </div>

               {/* UIMS Home View */}
               {uimsSubTab === "home" && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="card-polish rounded-[32px] p-6 bg-white flex flex-col justify-between aspect-square lg:aspect-auto">
                            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                                <History className="w-5 h-5" />
                            </div>
                            <div className="mt-4">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Avg Attendance</p>
                                <h3 className="text-2xl font-black text-brand-textMain">
                                    {subjects.length > 0 ? Math.round(subjects.reduce((acc, s) => acc + (s.attended_classes / (s.total_classes || 1)) * 100, 0) / subjects.length) : 0}%
                                </h3>
                            </div>
                        </div>

                        <div className="card-polish rounded-[32px] p-6 bg-white flex flex-col justify-between">
                            <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                                <Plus className="w-5 h-5" />
                            </div>
                            <div className="mt-4">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Subjects</p>
                                <h3 className="text-2xl font-black text-brand-textMain">{subjects.length}</h3>
                            </div>
                        </div>

                        <div className="card-polish rounded-[32px] p-6 bg-white flex flex-col justify-between">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div className="mt-4">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Top Scored</p>
                                <h3 className="text-2xl font-black text-brand-textMain">{subjects[0]?.name || "N/A"}</h3>
                            </div>
                        </div>

                        <div className="card-polish rounded-[32px] p-6 bg-white flex flex-col justify-between">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                                <TrendingDown className="w-5 h-5" />
                            </div>
                            <div className="mt-4">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Low Attendance</p>
                                <h3 className="text-lg font-black text-brand-textMain truncate">
                                    {subjects.find(s => (s.attended_classes / (s.total_classes || 1)) < 0.75)?.name || "All Clear"}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <button 
                            onClick={() => setUimsSubTab("attendance")}
                            className="px-6 py-3 rounded-2xl bg-brand-blue/10 text-brand-blue text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-blue/20 transition-all"
                        >
                            <History className="w-4 h-4" /> Update Attendance
                        </button>
                        <button 
                            onClick={() => setShowUIMSModal({ open: true, type: "mark" })}
                            className="px-6 py-3 rounded-2xl bg-brand-purple/10 text-brand-purple text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-purple/20 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Add Marks
                        </button>
                        <button 
                            onClick={() => setUimsSubTab("timetable")}
                            className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-200 transition-all"
                        >
                            <Calendar className="w-4 h-4" /> View Timetable
                        </button>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-brand-textMain uppercase tracking-widest">Today's Schedule</h3>
                                <button className="text-[10px] font-black text-brand-blue uppercase tracking-widest flex items-center gap-1">Update Full <ChevronRight className="w-3 h-3" /></button>
                            </div>
                            <div className="space-y-4">
                              {todayTimetable.length > 0 ? todayTimetable.map(slot => (
                                    <div key={slot.id} className="card-polish rounded-3xl p-6 bg-white flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-gray-400 font-black text-[10px]">
                                                <span>{slot.start_time}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-brand-textMain">{subjects.find(s => s.id === slot.subject_id)?.name || "Unknown"}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">{slot.room || "Lab 1"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={async () => {
                                                    await updateAttendance(slot.subject_id, true);
                                                    loadUIMSData();
                                                }}
                                                className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-tight opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all border border-emerald-100"
                                            >
                                                Attend
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    await updateAttendance(slot.subject_id, false);
                                                    loadUIMSData();
                                                }}
                                                className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-tight opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all border border-rose-100"
                                            >
                                                Miss
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    await decreaseAttendance(slot.subject_id, "lecture");
                                                    loadUIMSData();
                                                }}
                                                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-tight opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all border border-blue-100"
                                            >
                                                - Lec
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center space-y-4 opacity-30">
                                        <Calendar className="w-10 h-10 mx-auto" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No classes assigned for this day</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="col-span-12 lg:col-span-4 card-polish rounded-[40px] p-8 bg-white space-y-6 border-l-4 border-l-brand-blue shadow-2xl">
                            <div className="flex items-center gap-2 text-brand-blue">
                                <Sparkles className="w-5 h-5" />
                                <h3 className="text-sm font-black uppercase tracking-widest">AI Hub Insights</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 rounded-3xl bg-blue-50/50 border border-blue-100/50 space-y-2">
                                    <p className="text-[11px] font-bold text-blue-900 leading-relaxed">
                                        Subject <span className="font-black">Maths-II</span> attendance is at 74%. You need to attend the next 4 classes to reach 75%.
                                    </p>
                                </div>
                                <div className="p-4 rounded-3xl bg-purple-50/50 border border-purple-100/50 space-y-2">
                                    <p className="text-[11px] font-bold text-purple-900 leading-relaxed">
                                        Final Exams start in 45 days. Suggesting focus on <span className="font-black">Data Structures</span> where marks are trending lower.
                                    </p>
                                </div>
                            </div>
                            <button className="w-full py-4 rounded-2xl bg-brand-blue text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20">Ask for study plan</button>
                        </div>
                    </div>
                  </div>
               )}

               {uimsSubTab === "attendance" && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-brand-textMain uppercase tracking-widest">Attendance Registry</h3>
                        <button 
                            onClick={() => setShowUIMSModal({ open: true, type: "subject" })}
                            className="bg-black text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-black/10 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Add Subject
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subjects.map(subject => {
                            const percent = subject.total_classes > 0 ? (subject.attended_classes / subject.total_classes) * 100 : 0;
                            const statusColor = percent < 75 ? "rose" : percent < 85 ? "amber" : "emerald";
                            // Insight calculation: How many classes needed to reach 75%
                            // (attended + x) / (total + x) = 0.75  => attended + x = 0.75total + 0.75x => 0.25x = 0.75total - attended => x = (0.75total - attended)/0.25
                            const needed = Math.max(0, Math.ceil((0.75 * subject.total_classes - subject.attended_classes) / 0.25));
                            // Classes can miss: (attended) / (total + x) = 0.75 => attended = 0.75total + 0.75x => 0.75x = attended - 0.75total => x = (attended - 0.75total)/0.75
                            const canMiss = Math.max(0, Math.floor((subject.attended_classes - 0.75 * subject.total_classes) / 0.75));

                            return (
                                <div key={subject.id} className="card-polish rounded-[40px] p-8 bg-white space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-lg font-black text-brand-textMain leading-tight">{subject.name}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">By {subject.faculty || "Prof. Chen"}</p>
                                        </div>
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[13px] border",
                                            statusColor === "rose" ? "bg-rose-50 text-rose-600 border-rose-100" :
                                            statusColor === "amber" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                            "bg-emerald-50 text-emerald-600 border-emerald-100"
                                        )}>
                                            {Math.round(percent)}%
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-400">
                                            <span>Progress</span>
                                            <span>{subject.attended_classes}/{subject.total_classes} Classes</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                           <div 
                                                className={cn("h-full transition-all duration-1000", 
                                                    statusColor === "rose" ? "bg-rose-500" : 
                                                    statusColor === "amber" ? "bg-amber-500" : 
                                                    "bg-emerald-500"
                                                )}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={async () => {
                                                await updateAttendance(subject.id, true);
                                                loadUIMSData();
                                            }}
                                            className="flex-1 py-3 rounded-2xl bg-gray-50 hover:bg-emerald-50 hover:text-emerald-600 text-gray-500 text-[10px] font-black uppercase tracking-widest border border-black/5 transition-all"
                                        >
                                            Attended
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                await updateAttendance(subject.id, false);
                                                loadUIMSData();
                                            }}
                                            className="flex-1 py-3 rounded-2xl bg-gray-50 hover:bg-rose-50 hover:text-rose-600 text-gray-500 text-[10px] font-black uppercase tracking-widest border border-black/5 transition-all"
                                        >
                                            Missed
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={async () => {
                                                await decreaseAttendance(subject.id, "lecture");
                                                loadUIMSData();
                                            }}
                                            className="flex-1 py-3 rounded-2xl bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-500 text-[10px] font-black uppercase tracking-widest border border-black/5 transition-all"
                                        >
                                            - Lecture
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                await decreaseAttendance(subject.id, "attendance");
                                                loadUIMSData();
                                            }}
                                            className="flex-1 py-3 rounded-2xl bg-gray-50 hover:bg-purple-50 hover:text-purple-600 text-gray-500 text-[10px] font-black uppercase tracking-widest border border-black/5 transition-all"
                                        >
                                            - Attendance
                                        </button>
                                    </div>

                                    <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Can Miss</span>
                                            <span className="text-xs font-black text-brand-textMain">{canMiss} Lecs</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Needed for 75%</span>
                                            <span className="text-xs font-black text-brand-textMain">{needed} Lecs</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                  </div>
               )}

               {uimsSubTab === "marks" && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                     <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-brand-textMain uppercase tracking-widest">Academic performance</h3>
                        <button 
                            onClick={() => setShowUIMSModal({ open: true, type: "mark" })}
                            className="bg-black text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-black/10 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Add Scores
                        </button>
                     </div>

                     <div className="space-y-6">
                        {subjects.map(subject => {
                            const subMarks = marks.filter(m => m.subject_id === subject.id);
                            const totalObtained = subMarks.reduce((acc, m) => acc + m.obtained, 0);
                            const totalPossible = subMarks.reduce((acc, m) => acc + m.total, 0);
                            const percent = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;

                            return (
                                <div key={subject.id} className="card-polish rounded-[40px] p-8 bg-white space-y-8 overflow-hidden">
                                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue font-black text-lg">
                                                {Math.round(percent)}%
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-brand-textMain">{subject.name}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Weightage Accumulation</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Obtained</p>
                                                <p className="text-lg font-black text-brand-textMain">{totalObtained} / {totalPossible}</p>
                                            </div>
                                        </div>
                                     </div>

                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                         {["assignment", "mst1", "mst2", "practical", "final"].map(cat => (
                                             <div key={cat} className="p-4 rounded-3xl bg-gray-50/50 border border-black/5 space-y-3">
                                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">{cat}</p>
                                                 <div className="space-y-1">
                                                     {subMarks.filter(m => m.category === cat).map(m => (
                                                         <div key={m.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl shadow-sm border border-black/5">
                                                             <span className="text-[10px] font-bold text-brand-textMain truncate max-w-[60px]">{m.title}</span>
                                                             <span className="text-[10px] font-black text-brand-blue shrink-0">{m.obtained}/{m.total}</span>
                                                         </div>
                                                     ))}
                                                     {subMarks.filter(m => m.category === cat).length === 0 && (
                                                         <p className="text-[9px] text-gray-300 font-bold uppercase text-center py-2">Empty</p>
                                                     )}
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                </div>
                            );
                        })}
                     </div>
                  </div>
               )}

               {uimsSubTab === "timetable" && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                     <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black text-brand-textMain uppercase tracking-widest">Timetable Manager</h3>
                            <p className="text-[10px] text-gray-400 font-bold">Manage your weekly lecture layout</p>
                        </div>
                        <button 
                            onClick={() => setShowUIMSModal({ open: true, type: "slot" })}
                            className="bg-black text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-black/10 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Add Slot
                        </button>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                         {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                             <div key={day} className="space-y-4">
                                 <div className="px-2">
                                     <h4 className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em]">{day}</h4>
                                 </div>
                                 <div className="space-y-3">
                            {timetableByDay[day].map(slot => (
                                        <div key={slot.id} className="card-polish rounded-2xl p-4 bg-white border-l-2 border-l-brand-purple space-y-2 group cursor-pointer hover:scale-105">
                                            <p className="text-[11px] font-black text-brand-textMain leading-tight">{subjects.find(s => s.id === slot.subject_id)?.name || "Subject"}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{slot.start_time} - {slot.end_time}</span>
                                                <span className="text-[9px] font-black text-brand-purple uppercase">{slot.room || "R102"}</span>
                                            </div>
                                        </div>
                                    ))}
                            {timetableByDay[day].length === 0 && (
                                        <div className="border border-dashed border-gray-200 rounded-2xl py-8 text-center">
                                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">No Classes</p>
                                        </div>
                                    )}
                                 </div>
                             </div>
                         ))}
                     </div>
                  </div>
               )}

               {uimsSubTab === "prediction" && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                     <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black text-brand-textMain uppercase tracking-widest">Attendance Predictions</h3>
                            <p className="text-[10px] text-gray-400 font-bold">Interactive timeline to plan and visualize future attendance</p>
                        </div>
                        {subjects.length > 0 && (
                            <button 
                                onClick={() => handleGeneratePredictions(selectedSubjectForTimeline || subjects[0]?.id)}
                                className="bg-brand-blue text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-brand-blue/20 active:scale-95 transition-all"
                            >
                                <RefreshCcw className="w-4 h-4" /> Generate Predictions
                            </button>
                        )}
                     </div>

                     {subjects.length === 0 ? (
                        <div className="card-polish rounded-[32px] p-12 bg-white border border-dashed border-gray-200 text-center space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-black text-gray-400">No subjects added yet</p>
                            <p className="text-[10px] text-gray-300">Add subjects and timetable to generate predictions</p>
                        </div>
                     ) : (
                        <div className="space-y-8">
                            {/* Subject Selector */}
                            <div className="flex items-center gap-3 bg-gray-50 rounded-[24px] p-4 border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                    Select Subject
                                </label>
                                <select
                                    value={selectedSubjectForTimeline || ""}
                                    onChange={(e) => {
                                        setSelectedSubjectForTimeline(e.target.value);
                                        loadPredictions(e.target.value);
                                    }}
                                    className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm font-bold text-brand-textMain focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                                >
                                    {subjects.map(subject => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name} - {subject.faculty || "Prof"} ({Math.round((subject.attended_classes / (subject.total_classes || 1)) * 100)}%)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Interactive Timeline - Show for selected subject */}
                            {selectedSubjectForTimeline && subjects.find(s => s.id === selectedSubjectForTimeline) && (
                                <div className="animate-in fade-in duration-500">
                                    {(() => {
                                        const selectedSubject = subjects.find(s => s.id === selectedSubjectForTimeline);
                                        return selectedSubject ? (
                                            <AttendanceTimeline 
                                                currentTotal={selectedSubject.total_classes || 0}
                                                currentAttended={selectedSubject.attended_classes || 0}
                                                subjectName={selectedSubject.name || ""}
                                                subjectId={selectedSubject.id}
                                                timetableSlots={timetable}
                                            />
                                        ) : null;
                                    })()}
                                </div>
                            )}

                            {/* Traditional Card View */}
                            <div className="space-y-6">
                                <div className="px-2">
                                    <h4 className="text-sm font-black text-brand-textMain uppercase tracking-widest">All Subjects Predictions</h4>
                                    <p className="text-[9px] text-gray-400 font-bold">Detailed breakdown for each subject</p>
                                </div>

                                {subjects.map(subject => {
                                    const subjectPredictions = predictions.filter(p => p.subject_id === subject.id);
                                    const attendance_percentage = subject.total_classes > 0 
                                        ? (subject.attended_classes / subject.total_classes) * 100 
                                        : 0;
                                    
                                    return (
                                        <div key={subject.id} className="card-polish rounded-[32px] p-8 bg-white space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-lg font-black text-brand-textMain">{subject.name}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold">By {subject.faculty || "Prof"}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Current Attendance</p>
                                                    <p className="text-sm font-black text-brand-blue">{Math.round(attendance_percentage)}%</p>
                                                </div>
                                            </div>

                                            {subjectPredictions.length === 0 ? (
                                                <div className="border border-dashed border-gray-200 rounded-2xl py-8 text-center">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No predictions generated</p>
                                                    <button 
                                                        onClick={() => handleGeneratePredictions(subject.id)}
                                                        className="mt-3 text-[9px] font-black text-brand-blue hover:text-brand-blue/70 uppercase"
                                                    >
                                                        Generate for this subject →
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {subjectPredictions.slice(0, 9).map(pred => {
                                                        const statusColors = {
                                                            present: "bg-emerald-50 text-emerald-600 border-emerald-100",
                                                            absent: "bg-rose-50 text-rose-600 border-rose-100",
                                                            leave: "bg-amber-50 text-amber-600 border-amber-100"
                                                        };
                                                        const statusIcons = {
                                                            present: "✓",
                                                            absent: "✕",
                                                            leave: "△"
                                                        };

                                                        return (
                                                            <div key={pred.id} className={`rounded-2xl p-4 border-2 ${statusColors[pred.status as keyof typeof statusColors]} group cursor-pointer hover:scale-105 transition-transform`}>
                                                                <div className="text-[10px] font-black uppercase tracking-tight mb-2 opacity-70">
                                                                    {new Date(pred.predicted_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                                </div>
                                                                <div className="text-[11px] font-bold mb-2">
                                                                    {pred.start_time} - {pred.end_time}
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-black uppercase">{pred.status}</span>
                                                                    <span className="text-lg font-black">{statusIcons[pred.status as keyof typeof statusIcons]}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {subjectPredictions.length > 9 && (
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                                                        +{subjectPredictions.length - 9} more predictions
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                );
                            })}
                        </div>
                    </div>
                     )}
                  </div>
               )}
            </div>
          )}

          {activeTab === "mail" && (
            <div className="p-4 pb-32 lg:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-brand-textMain">Communication Hub</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Gmail Integrated Inbox</p>
                </div>
                <button 
                  onClick={loadEmails}
                  className="px-6 py-2.5 bg-gray-50 hover:bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-textMain shadow-sm transition-all flex items-center gap-2"
                >
                  {isFetchingMail ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                  Refresh Sync
                </button>
               </div>

               <div className="grid gap-4">
                  {emails.length > 0 ? emails.map(email => (
                    <div key={email.id} className="card-polish rounded-3xl p-6 bg-white hover:border-brand-blue/30 group transition-all flex gap-6 items-start">
                      <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/20 shrink-0">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-black text-brand-textMain truncate pr-4">{email.subject}</h4>
                          <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">{email.date.split(',')[0]}</span>
                        </div>
                        <p className="text-[11px] font-bold text-brand-blue mb-2">{email.sender}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{email.snippet}</p>
                      </div>
                      <button 
                        onClick={async () => {
                          try {
                            await markEmailAsRead(email.id);
                            loadEmails();
                          } catch (err) {
                            console.error("Mark as read failed:", err);
                          }
                        }}
                        className="p-3 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </div>
                  )) : (
                    <div className="card-polish rounded-[40px] p-20 flex flex-col items-center justify-center text-center bg-gray-50/50 border-dashed">
                      <Mail className="w-16 h-16 text-gray-200 mb-6" />
                      <h3 className="text-lg font-black text-brand-textMain">Inbox Zero</h3>
                      <p className="text-sm text-gray-500 max-w-xs mt-2 font-medium">No unread emails detected in your synced Gmail account. High focus environment achieved.</p>
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === "insights" && (
            <div className="p-8 space-y-10 animate-in slide-in-from-bottom-4 duration-500">
               <div>
                  <h2 className="text-2xl font-black text-brand-textMain">AI Cognitive Analysis</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Behavioral & Productivity Intelligence</p>
               </div>

               <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-12 lg:col-span-7 space-y-8">
                    <section className="card-polish rounded-[40px] p-10 bg-white gradient-border flex flex-col gap-8 hover:transform-none">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-brand-purple/10 flex items-center justify-center text-brand-purple border border-brand-purple/20">
                          <Brain className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-brand-textMain">Master Growth Strategy</h3>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Optimized for Academic Excellence</p>
                        </div>
                        <button 
                          onClick={handleGenerateStrategy}
                          disabled={isGeneratingStrategy}
                          className="ml-auto p-4 rounded-2xl bg-gray-50 hover:bg-brand-purple/5 hover:text-brand-purple transition-all"
                        >
                          <RefreshCcw className={cn("w-5 h-5", isGeneratingStrategy && "animate-spin")} />
                        </button>
                      </div>
                      
                      <div className="prose prose-sm max-w-none text-brand-textMain whitespace-pre-wrap leading-loose font-medium bg-gray-50/50 p-8 rounded-[32px] border border-gray-100">
                        {lifestyleStrategy || "Generate your strategy to see deep AI analysis of your routine."}
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-brand-blue/5 p-6 rounded-3xl border border-brand-blue/10">
                          <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-1">Focus Type</p>
                          <p className="text-sm font-black text-brand-textMain">Deep Execution</p>
                        </div>
                        <div className="bg-brand-purple/5 p-6 rounded-3xl border border-brand-purple/10">
                          <p className="text-[10px] font-black text-brand-purple uppercase tracking-widest mb-1">Peak Hour</p>
                          <p className="text-sm font-black text-brand-textMain">10:00 AM</p>
                        </div>
                        <div className="bg-brand-rose/5 p-6 rounded-3xl border border-brand-rose/10">
                          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Recovery</p>
                          <p className="text-sm font-black text-brand-textMain">15.2% Daily</p>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="col-span-12 lg:col-span-5 space-y-8">
                    <ProductivityInsight score={efficiencyScore} timeSaved="2.4h" />
                    
                    <section className="card-polish rounded-[40px] p-10 bg-white flex flex-col gap-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                           <Zap className="w-6 h-6 fill-current" />
                         </div>
                         <h3 className="text-sm font-black uppercase tracking-widest text-brand-textMain">System Stats</h3>
                      </div>
                      <div className="space-y-4">
                         {[
                           { label: "AI Suggestions Applied", val: "12", color: "blue" },
                           { label: "Study Blocks Completed", val: "24", color: "purple" },
                           { label: "Inbox Sync Rate", val: "100%", color: "cyan" },
                           { label: "Memory Nodes", val: "154", color: "rose" },
                         ].map(s => (
                           <div key={s.label} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                             <span className="text-xs font-bold text-gray-500">{s.label}</span>
                             <span className="text-sm font-black text-brand-textMain">{s.val}</span>
                           </div>
                         ))}
                      </div>
                    </section>
                  </div>
               </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="p-8 max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500">
               <div>
                  <h2 className="text-2xl font-black text-brand-textMain">System Configuration</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Manage your profile and agent preferences</p>
               </div>

               <div className="space-y-6">
                  <section className="card-polish rounded-[40px] p-10 bg-white space-y-8 hover:transform-none">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-[32px] bg-brand-purple/10 flex items-center justify-center text-brand-purple text-3xl font-black border border-brand-purple/20">
                        {settings?.username?.split(' ').map((n: string) => n[0]).join('') || "AC"}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-brand-textMain">{settings?.username || "Alex Chen"}</h3>
                        <p className="text-sm font-bold text-gray-500">{settings?.email || "alex.chen@university.edu"}</p>
                        <div className="mt-3 flex gap-2">
                           <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue text-[10px] font-bold rounded-full uppercase tracking-widest">Pro Member</span>
                           <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full uppercase tracking-widest">Admin</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Full Name</label>
                           <input 
                              type="text"
                              value={settings?.username || ""}
                              onChange={(e) => handleUpdateSettings({ username: e.target.value })}
                              placeholder="Alex Chen"
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold text-brand-textMain focus:outline-none focus:border-brand-blue/30 transition-colors"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Email</label>
                           <input 
                              type="email"
                              value={settings?.email || ""}
                              onChange={(e) => handleUpdateSettings({ email: e.target.value })}
                              placeholder="alex.chen@university.edu"
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold text-brand-textMain focus:outline-none focus:border-brand-blue/30 transition-colors"
                           />
                        </div>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preferred AI Voice</label>
                        <select 
                        value={settings?.preferred_voice || "Nova"}
                        onChange={(e) => handleUpdateSettings({ preferred_voice: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold text-brand-textMain focus:outline-none focus:border-brand-blue/30 transition-colors"
                        >
                            <option value="Nova">Nova (Focused & Calm)</option>
                            <option value="Echo">Echo (Direct & Technical)</option>
                            <option value="Aria">Aria (Warm & Encouraging)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System Theme</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                            onClick={() => handleUpdateSettings({ theme: "Light" })}
                            className={cn(
                                "py-4 rounded-2xl flex flex-col items-center gap-2 transition-all",
                                settings?.theme === "Light" ? "bg-white border-2 border-brand-blue shadow-md" : "bg-gray-50 border border-gray-100 grayscale hover:grayscale-0"
                            )}
                            >
                            <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest">Premium Light</span>
                            </button>
                            <button 
                            onClick={() => handleUpdateSettings({ theme: "Dark" })}
                            className={cn(
                                "py-4 rounded-2xl flex flex-col items-center gap-2 transition-all",
                                settings?.theme === "Dark" ? "bg-white border-2 border-brand-blue shadow-md" : "bg-gray-50 border border-gray-100 grayscale hover:grayscale-0"
                            )}
                            >
                            <div className="w-6 h-6 rounded-full bg-gray-900 border border-black"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest">Onyx Dark</span>
                            </button>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="card-polish rounded-[32px] p-8 bg-white flex flex-col gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                           <Bell className="w-5 h-5" />
                        </div>
                        <div>
                           <h4 className="text-[13px] font-black text-brand-textMain">Notifications</h4>
                           <p className="text-[10px] text-gray-500 font-medium leading-tight mt-1">Priority alerts & briefing pings</p>
                        </div>
                        <button 
                          onClick={() => handleUpdateSettings({ notifications_enabled: !settings?.notifications_enabled })}
                          className={cn(
                            "w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            settings?.notifications_enabled ? "bg-brand-blue/10 text-brand-blue" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                          )}
                        >
                           {settings?.notifications_enabled ? "Enabled" : "Disabled"}
                        </button>
                     </div>

                     <div className="card-polish rounded-[32px] p-8 bg-white flex flex-col gap-4 opacity-60">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                           <Shield className="w-5 h-5" />
                        </div>
                        <div>
                           <h4 className="text-[13px] font-black text-brand-textMain">Sync Security</h4>
                           <p className="text-[10px] text-gray-500 font-medium leading-tight mt-1">Data encryption & OAuth status</p>
                        </div>
                        <button className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 cursor-not-allowed">
                           Active
                        </button>
                     </div>

                     <div className="card-polish rounded-[32px] p-8 bg-white flex flex-col gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                           <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                           <h4 className="text-[13px] font-black text-brand-textMain">System Memory</h4>
                           <p className="text-[10px] text-gray-500 font-medium leading-tight mt-1">Clear AI agent local cache</p>
                        </div>
                        <button 
                          onClick={handleClearCache}
                          className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all font-bold"
                        >
                           Wipe Cache
                        </button>
                     </div>
                  </div>

                  <section className="card-polish rounded-[32px] p-8 bg-white space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-[15px] font-black text-brand-textMain">Alert Preferences</h4>
                        <p className="text-[10px] text-gray-500 font-medium">Choose what should notify you and how early.</p>
                      </div>
                      <button
                        onClick={requestNotificationPermission}
                        className="px-4 py-2 rounded-xl bg-brand-blue/10 text-brand-blue text-[10px] font-black uppercase tracking-widest hover:bg-brand-blue/20 transition-all"
                      >
                        Allow Browser Notifications
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { key: "notify_lectures", label: "Lectures" },
                        { key: "notify_tasks", label: "Tasks" },
                        { key: "notify_assignments", label: "Assignments" },
                        { key: "notify_emails", label: "Emails" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => handleUpdateSettings({ [opt.key]: !(settings?.[opt.key] ?? (opt.key !== "notify_emails")) })}
                          className={cn(
                            "py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                            (settings?.[opt.key] ?? (opt.key !== "notify_emails"))
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                          )}
                        >
                          {opt.label}: {(settings?.[opt.key] ?? (opt.key !== "notify_emails")) ? "On" : "Off"}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lead Time For Alerts</label>
                      <select
                        value={settings?.notification_lead_minutes ?? 10}
                        onChange={(e) => handleUpdateSettings({ notification_lead_minutes: Number(e.target.value) })}
                        className="w-full md:w-64 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold text-brand-textMain focus:outline-none focus:border-brand-blue/30 transition-colors"
                      >
                        <option value={5}>5 minutes before</option>
                        <option value={10}>10 minutes before</option>
                        <option value={15}>15 minutes before</option>
                        <option value={30}>30 minutes before</option>
                        <option value={60}>60 minutes before</option>
                      </select>
                    </div>
                  </section>
               </div>
            </div>
          )}

          {activeTab === "roadmap" && (
            <div className="p-4 pb-32 lg:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-brand-textMain uppercase tracking-tight">Academic Voyager</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Syllabus-to-Strategy Roadmap Generator</p>
                </div>
               </div>

               <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="card-polish rounded-[40px] p-8 bg-white gradient-border space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em] flex items-center gap-2">
                                <Book className="w-4 h-4" /> Syllabus Topics
                            </label>
                            <textarea 
                                value={syllabusTopics}
                                onChange={(e) => setSyllabusTopics(e.target.value)}
                                placeholder="Paste your syllabus topics here (e.g. Unit 1: OS, Unit 2: Memory...)"
                                className="w-full h-40 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-brand-blue/30 transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">MST 1 Date</label>
                                <input type="text" value={mst1} onChange={(e) => setMst1(e.target.value)} placeholder="e.g. 15th April" className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">MST 2 Date</label>
                                <input type="text" value={mst2} onChange={(e) => setMst2(e.target.value)} placeholder="e.g. 2nd May" className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Practicals</label>
                                <input type="text" value={practicals} onChange={(e) => setPracticals(e.target.value)} placeholder="e.g. June" className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Final Exams</label>
                                <input type="text" value={finals} onChange={(e) => setFinals(e.target.value)} placeholder="e.g. July" className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold" />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                Complete In <span>{roadmapDays} Days</span>
                            </label>
                            <input 
                                type="range" 
                                min="7" max="60" 
                                value={roadmapDays}
                                onChange={(e) => setRoadmapDays(Number(e.target.value))}
                                className="w-full accent-brand-blue h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer"
                            />
                        </div>

                        <button 
                            onClick={handleGenerateRoadmap}
                            disabled={isGeneratingRoadmap}
                            className="w-full py-4 rounded-2xl bg-black text-white font-black text-[11px] uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isGeneratingRoadmap ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                            Construct Roadmap
                        </button>
                    </div>
                  </div>

                  <div className="col-span-12 lg:col-span-8">
                     <div className="card-polish rounded-[40px] p-10 bg-white gradient-border min-h-[500px] relative overflow-hidden">
                        {!roadmapResult && !isGeneratingRoadmap && (
                           <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                              <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-200">
                                 <MapIcon className="w-10 h-10" />
                              </div>
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Your AI architect is standing by.<br/>Fill in your syllabus to begin.</p>
                           </div>
                        )}

                        {isGeneratingRoadmap && (
                           <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                              <div className="w-16 h-16 rounded-3xl bg-brand-blue/10 flex items-center justify-center text-brand-blue animate-pulse">
                                 <Brain className="w-8 h-8 animate-bounce" />
                              </div>
                              <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Strategizing...</p>
                           </div>
                        )}

                        {roadmapResult && (
                           <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                              <div className="flex items-center gap-4 mb-8">
                                 <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
                                    <Sparkles className="w-5 h-5" />
                                 </div>
                                 <h3 className="font-black text-brand-textMain uppercase tracking-widest text-sm">Strategic Roadmap Ready</h3>
                              </div>
                              <div className="prose prose-sm max-w-none text-brand-textMain whitespace-pre-wrap leading-relaxed font-sans border-l-4 border-brand-blue/30 pl-8 py-2">
                                 {roadmapResult}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="p-4 pb-32 lg:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-brand-textMain">AI Smart Schedule</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Optimized temporal allocation</p>
                </div>
                <button 
                  onClick={handleGenerateSchedule}
                  disabled={isGeneratingSchedule}
                  className="px-6 py-2.5 bg-gray-50 hover:bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-textMain shadow-sm transition-all flex items-center gap-2"
                >
                  {isGeneratingSchedule ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                  Regenerate
                </button>
               </div>

               <div className="card-polish rounded-[40px] p-10 bg-white gradient-border min-h-[500px]">
                  {isGeneratingSchedule ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                      <div className="w-16 h-16 rounded-3xl bg-brand-blue/10 flex items-center justify-center text-brand-blue-glow animate-pulse">
                        <RefreshCcw className="w-8 h-8 animate-spin" />
                      </div>
                      <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Building your roadmap...</p>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none text-brand-textMain whitespace-pre-wrap leading-relaxed">
                      {schedulePlan || "No schedule generated yet. Trigger generation to see your optimized plan."}
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="p-4 pb-32 lg:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end">
                <div>
                   <h2 className="text-2xl font-black text-brand-textMain">Action Matrix</h2>
                   <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Manage your daily priorities</p>
                </div>
                <div className="flex gap-4">
                  <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(Number(e.target.value))}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-500 focus:outline-none"
                  >
                    <option value={0}>All Levels</option>
                    <option value={1}>Critical</option>
                    <option value={2}>High</option>
                    <option value={3}>Normal</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4">
                {filteredTasks.map(task => (
                  <TaskCard key={task.id} task={task} onUpdate={loadData} />
                ))}
              </div>
            </div>
          )}

          {activeTab === "assignments" && (
            <div className="p-4 pb-32 lg:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-2xl font-black text-brand-textMain">Academic Roadmap</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {assignments.map(asg => (
                    <AssignmentCard key={asg.id} assignment={asg} onUpdate={loadData} />
                  ))}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showTaskModal && <AddTaskModal onClose={() => setShowTaskModal(false)} onAdded={loadData} />}
      {showAsgModal && <AddAssignmentModal onClose={() => setShowAsgModal(false)} onAdded={loadData} />}
      <UIMSAddModal
          isOpen={showUIMSModal.open}
          onClose={() => setShowUIMSModal({ ...showUIMSModal, open: false })}
          type={showUIMSModal.type}
          subjects={subjects}
          onAdd={handleUIMSAdd}
      />
    </div>
  );
}