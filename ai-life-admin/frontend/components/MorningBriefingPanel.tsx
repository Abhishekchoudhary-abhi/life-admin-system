"use client";
import React, { useMemo } from "react";
import { Sun, CloudSun, Moon, Bolt, Expand, CheckCircle2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface MorningBriefingPanelProps {
  briefing: string;
  isLoading: boolean;
  tasksCount: number;
  urgentCount: number;
  username?: string;
  onApplySuggestions?: () => void;
}

export default function MorningBriefingPanel({ 
  briefing, 
  isLoading, 
  tasksCount, 
  urgentCount,
  username,
  onApplySuggestions
}: MorningBriefingPanelProps) {
  const periodData = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { title: "Morning Briefing", greeting: "Good morning", icon: <Sun className="w-48 h-48 text-orange-500" />, subIcon: <Sun className="w-5 h-5 text-orange-500" /> };
    if (hour >= 12 && hour < 18) return { title: "Afternoon Update", greeting: "Good afternoon", icon: <CloudSun className="w-48 h-48 text-brand-blue" />, subIcon: <CloudSun className="w-5 h-5 text-brand-blue" /> };
    return { title: "Evening Wrap-Up", greeting: "Good evening", icon: <Moon className="w-48 h-48 text-brand-purple" />, subIcon: <Moon className="w-5 h-5 text-brand-purple" /> };
  }, []);

  return (
    <section className="card-polish rounded-3xl p-8 relative overflow-hidden flex flex-col gradient-border shrink-0 bg-white shadow-xl shadow-black/5" data-purpose="morning-briefing">
      <div className="absolute top-0 right-0 p-12 opacity-[0.05]">
        {periodData.icon}
      </div>
      
      <div className="relative z-10 flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-brand-textMain mb-1">{periodData.title}</h2>
          <p className="text-xs text-gray-500 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • 
            <span className="text-brand-blue font-bold ml-1">{periodData.greeting}, {username?.split(' ')[0] || "User"}.</span> 
            {urgentCount > 0 ? ` You have ${urgentCount} urgent priorities.` : " Your day looks balanced."}
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
          <button className="px-4 py-2 rounded-lg bg-white shadow-sm text-[11px] font-black text-brand-textMain">Briefing</button>
          <button className="px-4 py-2 rounded-lg text-[11px] font-black text-gray-500 hover:text-brand-textMain transition-colors">Insights</button>
        </div>
      </div>
      
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Bolt className="w-8 h-8 text-brand-blue animate-pulse" />
              <p className="text-sm font-bold text-gray-400 animate-pulse uppercase tracking-widest">Synthesizing Briefing...</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-brand-textMain whitespace-pre-wrap leading-relaxed bg-brand-light-gray/50 p-6 rounded-2xl border border-black/5">
              {briefing || "No briefing available yet. Generate one to see your AI-curated daily overview."}
            </div>
          )}
          
          {/* Example Timeline Items (Fixed placeholders for design parity) */}
          <div className="space-y-4">
            <div className="flex items-center gap-6 group cursor-pointer">
              <span className="text-[11px] font-bold text-gray-500 w-12 text-right">09:30 AM</span>
              <div className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl p-4 flex items-center justify-between transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                    <Bolt className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-brand-textMain block">AI Strategy Review</span>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Automatic sync with assignments</p>
                  </div>
                </div>
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4 flex flex-col h-fit">
          <p className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em]">AI Smart Actions</p>
          <div className="space-y-3 flex-1">
            <label className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors group">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 bg-white text-brand-blue focus:ring-brand-blue/20" />
              <span className="text-[11px] font-medium text-gray-600 group-hover:text-brand-textMain italic">Optimize study slots for exams</span>
            </label>
            <label className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors group">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 bg-white text-brand-blue focus:ring-brand-blue/20" />
              <span className="text-[11px] font-medium text-gray-600 group-hover:text-brand-textMain italic">Draft summary for latest task</span>
            </label>
          </div>
          <button 
            onClick={onApplySuggestions}
            className="w-full py-3 text-[11px] font-black bg-white hover:bg-brand-blue/5 hover:text-brand-blue text-gray-500 rounded-xl border border-gray-100 shadow-sm transition-all uppercase tracking-wider"
          >
            Apply All Suggestions
          </button>
        </div>
      </div>
    </section>
  );
}
