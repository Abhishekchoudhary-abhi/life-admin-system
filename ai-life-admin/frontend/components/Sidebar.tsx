"use client";
import React from "react";
import { 
  LayoutGrid, 
  CheckCircle, 
  BookOpen, 
  Calendar,
  Sparkles,
  Mail,
  Settings,
  Bolt,
  Map as MapIcon,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  user?: any;
}

export default function Sidebar({ activeTab, setActiveTab, user }: SidebarProps) {
  const navItems = [
    { id: "overview", label: "Home", icon: LayoutGrid },
    { id: "uims", label: "UIMS", icon: GraduationCap },
    { id: "mail", label: "Mail", icon: Mail },
    { id: "tasks", label: "Tasks", icon: CheckCircle },
    { id: "assignments", label: "Exams", icon: BookOpen },
    { id: "roadmap", label: "Roadmap", icon: MapIcon },
    { id: "schedule", label: "Calendar", icon: Calendar },
    { id: "insights", label: "AI", icon: Sparkles },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 glass-sidebar flex-col p-6 space-y-8 z-20 h-screen sticky top-0 overflow-y-auto custom-scrollbar">
        <div className="flex items-center space-x-3 px-2 mb-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center shadow-lg">
            <Bolt className="text-white w-6 h-6 fill-current" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-brand-textMain">LIFE ADMIN</span>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
          {navItems.filter(i => i.id !== 'settings').map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group relative",
                activeTab === item.id 
                  ? "bg-black/5 text-brand-blue active-nav-indicator" 
                  : "text-gray-500 hover:bg-black/5 hover:text-brand-textMain"
              )}
            >
              <item.icon className={cn(
                "w-6 h-6 transition-colors",
                activeTab === item.id ? "text-brand-blue" : "group-hover:text-brand-blue"
              )} />
              <span className={cn(
                "text-sm font-bold",
                activeTab === item.id ? "font-bold" : "font-medium"
              )}>{item.label === 'Home' ? 'Dashboard' : item.label === 'Exams' ? 'Assignments' : item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-black/5 space-y-4 shrink-0">
          <button 
            onClick={() => setActiveTab("settings")}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all group",
              activeTab === "settings" ? "bg-black/5 text-brand-blue" : "text-gray-500 hover:bg-black/5 hover:text-brand-textMain"
            )}
          >
            <Settings className="w-6 h-6" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          
          <div className="flex items-center space-x-3 px-3 bg-white p-3 rounded-2xl border border-black/5 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple font-bold">
              {user?.username?.split(' ').map((n: string) => n[0]).join('') || "AC"}
            </div>
            <div className="overflow-hidden">
              <p className="text-[13px] font-bold text-brand-textMain truncate">{user?.username || "Alex Chen"}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Pro Member</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="flex lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-black/5 rounded-[32px] p-2 z-50 shadow-2xl items-center w-[90%] max-w-md gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all relative overflow-hidden",
              activeTab === item.id ? "text-brand-blue bg-brand-blue/5" : "text-gray-400"
            )}
          >
            <item.icon className="w-6 h-6" />
            {activeTab === item.id && (
               <span className="text-[8px] font-black uppercase tracking-tighter mt-1 animate-in slide-in-from-bottom-1 duration-300">{item.label}</span>
            )}
          </button>
        ))}
      </nav>
    </>
  );
}
