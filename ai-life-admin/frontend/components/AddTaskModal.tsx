"use client";
import React, { useState, useEffect } from "react";
import { createTask } from "@/lib/api";
import { X, Calendar, Flag, Send, Loader2, Zap, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddTaskModalProps {
  onClose: () => void;
  onAdded: () => void;
}

const priorities = [
  { value: 1, label: "Critical", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
  { value: 2, label: "High", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
  { value: 3, label: "Medium", color: "text-brand-purple", bg: "bg-brand-purple/5", border: "border-brand-purple/10" },
  { value: 4, label: "Low", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
];

export default function AddTaskModal({ onClose, onAdded }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(2);
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      setError("Please enter a task title");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await createTask({
        title: title.trim(),
        priority,
        deadline: deadline ? deadline + "T23:59:00+00:00" : undefined,
      });
      onAdded();
      onClose();
    } catch (err) {
      setError("Failed to create task. Please try again.");
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
              <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/20">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-brand-textMain uppercase tracking-tighter">New Action Item</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Omni Priority Matrix</p>
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

            {/* Title Input */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Task Definition</label>
              <input 
                type="text"
                placeholder="What is the objective?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-6 text-brand-textMain placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-blue focus:bg-white transition-all font-bold shadow-inner"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Priority Select */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Urgency Tier</label>
                <div className="grid grid-cols-2 gap-3">
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={cn(
                        "flex items-center justify-center gap-2 py-3 rounded-xl border text-[11px] font-black uppercase transition-all",
                        priority === p.value 
                          ? cn(p.bg, p.border, p.color, "shadow-md scale-[1.02]") 
                          : "bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200"
                      )}
                    >
                      <Flag className={cn("w-3.5 h-3.5", priority === p.value ? p.color : "text-gray-300")} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deadline Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Due Date</label>
                <div className="relative group">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-blue transition-colors" />
                  <input 
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-14 pr-6 text-xs text-brand-textMain font-bold focus:outline-none focus:border-brand-blue focus:bg-white transition-all shadow-inner"
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
                disabled={loading || !title.trim()}
                className="flex-1 bg-gradient-to-r from-brand-blue to-brand-purple py-4 rounded-2xl text-[11px] font-black text-white shadow-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 group btn-glow uppercase tracking-[0.2em]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current group-hover:rotate-12 transition-transform" />
                    <span>Deploy Action</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* Background Aura */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>
    </div>
  );
}