"use client";
import React from "react";
import { 
  Search, 
  Bell, 
  Plus,
  Bolt
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onAddTask: () => void;
  onAddAssignment: () => void;
  onRequestNotifications?: () => void;
  apiOk: boolean;
}

export default function Navbar({ onAddTask, onAddAssignment, onRequestNotifications, apiOk }: NavbarProps) {
  return (
    <header className="p-4 lg:p-8 pb-4 space-y-4 lg:space-y-8 sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-black/5">
      <div className="flex items-center justify-between gap-4">
        {/* Mobile Logo */}
        <div className="flex lg:hidden items-center space-x-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center shadow-md">
            <Bolt className="text-white w-5 h-5 fill-current" />
          </div>
        </div>

        <div className="relative w-full max-w-2xl hidden md:block">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search for anything... (⌘ K)"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-14 pr-6 text-sm text-brand-textMain focus:ring-1 focus:ring-brand-blue/30 focus:border-brand-blue/40 focus:bg-white transition-all placeholder-gray-400"
          />
        </div>
        
        <div className="flex items-center space-x-3 lg:space-x-5">
          {/* Status Indicator */}
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold tracking-wider uppercase border whitespace-nowrap",
            apiOk 
              ? "text-emerald-600 bg-emerald-50 border-emerald-100" 
              : "text-rose-600 bg-rose-50 border-rose-100"
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", apiOk ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
            <span className="hidden sm:inline">{apiOk ? "Live" : "Offline"}</span>
          </div>

          <button
            onClick={onRequestNotifications}
            className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:text-brand-textMain transition-all relative group shrink-0"
            title="Enable notifications"
          >
            <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand-blue rounded-full border-2 border-white group-hover:scale-110 transition-transform"></span>
          </button>
          
          <div className="h-6 lg:h-8 w-[1px] bg-gray-100 hidden sm:block"></div>
          
          <button 
            onClick={onAddTask}
            className="bg-black lg:bg-gradient-to-r lg:from-brand-blue lg:to-brand-purple px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl text-[10px] lg:text-xs font-black text-white shadow-md hover:brightness-110 transition-all flex items-center space-x-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="uppercase tracking-wider hidden xs:inline">New Action</span>
          </button>
        </div>
      </div>
    </header>
  );
}

