"use client";
import React, { useState } from "react";
import { createAssignment } from "@/lib/api";
import { X, BookOpen, Calendar, Percent, Timer, Send, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddAssignmentModalProps {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddAssignmentModal({ onClose, onAdded }: AddAssignmentModalProps) {
  const [course, setCourse] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [weight, setWeight] = useState("");
  const [hours, setHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!course.trim()) { setError("Course code is required"); return; }
    if (!title.trim()) { setError("Title is required"); return; }
    if (!dueDate) { setError("Due date is required"); return; }
    
    setLoading(true);
    setError("");
    
    try {
      await createAssignment({
        course_code: course.trim().toUpperCase(),
        title: title.trim(),
        due_date: dueDate + "T23:59:00+00:00",
        weight_percent: weight ? parseFloat(weight) : undefined,
        estimated_hours: hours ? parseFloat(hours) : undefined,
      });
      onAdded();
      onClose();
    } catch (err) {
      setError("Failed to create assignment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white/60 backdrop-blur-md animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl card-polish rounded-[40px] p-10 bg-white shadow-2xl shadow-black/10 overflow-hidden animate-in zoom-in-95 duration-500 gradient-border">
        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center text-brand-purple border border-brand-purple/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-brand-textMain uppercase tracking-tighter">Academic Roadmap</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Course Deliverable Entry</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-brand-textMain hover:bg-gray-100 rounded-2xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[11px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Course Code */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Course Identification</label>
                <input 
                  type="text"
                  placeholder="e.g. ECON402"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-6 text-brand-textMain font-bold uppercase focus:outline-none focus:ring-1 focus:ring-brand-purple focus:bg-white transition-all shadow-inner"
                  autoFocus
                />
              </div>

              {/* Due Date */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Final Deadline</label>
                <div className="relative group">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-purple transition-colors" />
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-14 pr-6 text-xs text-brand-textMain font-bold focus:outline-none focus:border-brand-purple focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Objective Title</label>
              <input 
                type="text"
                placeholder="Name of the assessment..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-6 text-brand-textMain placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-purple focus:bg-white transition-all font-bold shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Weight */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Grade Weight (%)</label>
                <div className="relative group">
                  <Percent className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-purple transition-colors" />
                  <input 
                    type="number"
                    placeholder="25"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-14 pr-6 text-xs text-brand-textMain font-bold focus:outline-none focus:border-brand-purple focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Estimated Hours */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Effort Estimate (H)</label>
                <div className="relative group">
                  <Timer className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-purple transition-colors" />
                  <input 
                    type="number"
                    placeholder="12"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-14 pr-6 text-xs text-brand-textMain font-bold focus:outline-none focus:border-brand-purple focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 text-[11px] font-black text-gray-500 hover:text-brand-textMain transition-colors uppercase tracking-[0.2em]"
              >
                Dismiss
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim() || !course.trim()}
                className="flex-1 bg-gradient-to-r from-brand-purple to-brand-blue py-4 rounded-2xl text-[11px] font-black text-white shadow-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 group btn-glow uppercase tracking-[0.2em]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current group-hover:rotate-12 transition-transform" />
                    <span>Log Deliverable</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* Background Aura */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>
    </div>
  );
}