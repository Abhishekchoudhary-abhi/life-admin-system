"use client";
import React from "react";
import { Task, completeTask, deleteTask } from "@/lib/api";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  Trash2, 
  Clock,
  MoreVertical,
  Flag,
  Circle
} from "lucide-react";

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
}

const priorityConfig = {
  1: { label: "Critical", icon: Flag, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", bar: "bg-rose-500" },
  2: { label: "High", icon: Flag, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", bar: "bg-orange-500" },
  3: { label: "Medium", icon: Flag, color: "text-brand-purple", bg: "bg-brand-purple/5", border: "border-brand-purple/10", bar: "bg-brand-purple" },
  4: { label: "Low", icon: Flag, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", bar: "bg-emerald-500" },
};

export default function TaskCard({ task, onUpdate }: TaskCardProps) {
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig[3];
  const isDone = task.status === "done";
  
  const handleComplete = async () => {
    await completeTask(task.id);
    onUpdate();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this task?")) {
      await deleteTask(task.id);
      onUpdate();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !isDone;

  return (
    <div className={cn(
      "card-polish p-5 rounded-2xl group flex items-center justify-between bg-white relative overflow-hidden",
      isDone && "opacity-50 grayscale select-none",
      isOverdue && !isDone && "bg-rose-50/30 border-rose-100"
    )}>
      <div className="flex items-center space-x-5 flex-1 min-w-0">
        <div className={cn("w-1.5 h-12 rounded-full flex-shrink-0", isDone ? "bg-gray-200" : priority.bar)}></div>
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "text-sm font-bold transition-all mb-1 truncate",
            isDone ? "text-gray-400 line-through" : "text-brand-textMain"
          )}>
            {task.title}
          </h4>
          <div className="flex items-center gap-3">
            <span className={cn(
              "text-[10px] font-black px-2 py-0.5 rounded uppercase border",
              priority.color, priority.bg, priority.border
            )}>
              {priority.label}
            </span>
            {task.deadline && (
              <div className={cn(
                "flex items-center text-[10px] font-bold uppercase tracking-wider",
                isOverdue ? "text-rose-600" : "text-gray-500"
              )}>
                <Clock className="w-3.5 h-3.5 mr-1" />
                {isOverdue ? "Overdue" : formatDate(task.deadline)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
        <button 
          onClick={handleDelete}
          className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:text-rose-600 flex items-center justify-center transition-colors border border-gray-100"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button 
          onClick={handleComplete}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
            isDone 
              ? "bg-emerald-500 text-white border-emerald-600" 
              : "bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 border-brand-blue/20"
          )}
        >
          {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}