import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000",
    timeout: 30000,
});

// ── Types ─────────────────────────────────────────────────────────
export type Task = {
    id: string;
    title: string;
    description?: string;
    priority: number;
    status: string;
    estimated_minutes?: number;
    deadline?: string;
    scheduled_at?: string;
    source: string;
    tags: string[];
    created_at: string;
    updated_at?: string;
};

export type Assignment = {
    id: string;
    course_code: string;
    title: string;
    description?: string;
    due_date: string;
    weight_percent?: number;
    estimated_hours?: number;
    status: string;
    grade?: number;
};

export type CreateTaskPayload = {
    title: string;
    priority?: number;
    deadline?: string;
    description?: string;
    tags?: string[];
};

export type CreateAssignmentPayload = {
    course_code: string;
    title: string;
    due_date: string;
    weight_percent?: number;
    estimated_hours?: number;
};

// ── Task API ──────────────────────────────────────────────────────
export const getTasks = async (): Promise<Task[]> => {
    const res = await api.get("/tasks/");
    return res.data;
};

export const createTask = async (payload: CreateTaskPayload): Promise<Task> => {
    const res = await api.post("/tasks/", payload);
    return res.data;
};

export const updateTask = async (id: string, payload: Partial<Task>): Promise<Task> => {
    const res = await api.patch(`/tasks/${id}`, payload);
    return res.data;
};

export const deleteTask = async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
};

export const completeTask = async (id: string): Promise<Task> => {
    return updateTask(id, { status: "done" });
};

// ── Assignment API ────────────────────────────────────────────────
export const getAssignments = async (): Promise<Assignment[]> => {
    const res = await api.get("/assignments/");
    return res.data;
};

export const createAssignment = async (
    payload: CreateAssignmentPayload
): Promise<Assignment> => {
    const res = await api.post("/assignments/", payload);
    return res.data;
};

export const updateAssignment = async (
    id: string,
    payload: Partial<Assignment>
): Promise<Assignment> => {
    const res = await api.patch(`/assignments/${id}`, payload);
    return res.data;
};

// ── Health ────────────────────────────────────────────────────────
export const getHealth = async (): Promise<{ status: string }> => {
    const res = await api.get("/health");
    return res.data;
};

// ── AI ────────────────────────────────────────────────────────────
export const getAIBriefing = async (): Promise<{ briefing: string }> => {
    const res = await api.get("/ai/briefing");
    return res.data;
};

export const generateAISchedule = async (days: number): Promise<{ plan: string }> => {
    const res = await api.post("/ai/schedule", { days });
    return res.data;
};

export const getSuggestedSlots = async (): Promise<{ slots: any[] }> => {
    const res = await api.get("/ai/slots");
    return res.data;
};

export const getAILifestyleStrategy = async (): Promise<{ strategy: string }> => {
    const res = await api.get("/ai/strategy");
    return res.data;
};

export const generateRoadmap = async (topics: string, milestones: any, days: number): Promise<{ roadmap: string }> => {
    const res = await api.post("/ai/roadmap", { topics, milestones, days });
    return res.data;
};

// ── Gmail API ─────────────────────────────────────────────────────
export const getUnreadEmails = async (): Promise<{ emails: any[] }> => {
    const res = await api.get("/gmail/unread");
    return res.data;
};

export const markEmailAsRead = async (id: string): Promise<void> => {
    await api.post(`/gmail/read/${id}`);
};

// ── Settings API ──────────────────────────────────────────────────
export const getSettings = async (): Promise<any> => {
    const res = await api.get("/settings/");
    return res.data;
};

export const updateSettings = async (settings: any): Promise<void> => {
    await api.patch("/settings/", settings);
};

export const clearMemoryCache = async (): Promise<void> => {
    await api.post("/settings/clear-cache");
};

// ── UIMS API ──────────────────────────────────────────────────────
export const getSubjects = async (): Promise<any[]> => {
    const res = await api.get("/uims/subjects");
    return res.data;
};

export const createSubject = async (name: string, faculty?: string): Promise<any> => {
    const res = await api.post("/uims/subjects", { name, faculty });
    return res.data;
};

export const updateAttendance = async (subject_id: string, attended: boolean): Promise<any> => {
    const res = await api.post("/uims/attendance/update", { subject_id, attended });
    return res.data;
};

export const decreaseAttendance = async (subject_id: string, type: "lecture" | "attendance"): Promise<any> => {
    const res = await api.post("/uims/attendance/decrease", { subject_id, type });
    return res.data;
};

export const getTimetable = async (): Promise<any[]> => {
    const res = await api.get("/uims/timetable");
    return res.data;
};

export const addTimetableSlot = async (payload: any): Promise<any> => {
    const res = await api.post("/uims/timetable", payload);
    return res.data;
};

export const getMarks = async (subject_id?: string): Promise<any[]> => {
    const res = await api.get("/uims/marks", { params: { subject_id } });
    return res.data;
};

export const addMark = async (payload: any): Promise<any> => {
    const res = await api.post("/uims/marks", payload);
    return res.data;
};

export const generateAttendancePredictions = async (subject_id: string, days_ahead: number = 30): Promise<any> => {
    const res = await api.post(`/uims/predictions/generate/${subject_id}`, { days_ahead });
    return res.data;
};

export const getAttendancePredictions = async (subject_id: string): Promise<any[]> => {
    const res = await api.get(`/uims/predictions/${subject_id}`);
    return res.data;
};

export const updatePredictionStatus = async (prediction_id: string, status: string): Promise<any> => {
    const res = await api.post("/uims/predictions/update-status", { prediction_id, status });
    return res.data;
};

export const deletePrediction = async (prediction_id: string): Promise<void> => {
    await api.delete(`/uims/predictions/${prediction_id}`);
};

export const clearPredictions = async (subject_id: string): Promise<void> => {
    await api.delete(`/uims/predictions/clear/${subject_id}`);
};