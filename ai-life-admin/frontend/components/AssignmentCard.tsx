"use client";
import React from "react";
import { Assignment, updateAssignment } from "@/lib/api";
import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Timer
} from "lucide-react";

interface AssignmentCardProps {
  assignment: Assignment;
  onUpdate: () => void;
}

const statusConfig = {
  pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  in_progress: { label: "Working", color: "text-brand-blue", bg: "bg-brand-blue/10", border: "border-brand-blue/20" },
  submitted: { label: "Submitted", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  graded: { label: "Graded", color: "text-brand-purple", bg: "bg-brand-purple/10", border: "border-brand-purple/20" },
};

export default function AssignmentCard({ assignment, onUpdate }: AssignmentCardProps) {
  const status = statusConfig[assignment.status as keyof typeof statusConfig] || statusConfig.pending;
  const isSubmitted = assignment.status === "submitted";
  
  const now = new Date();
  const due = new Date(assignment.due_date);
  const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isOverdue = hoursLeft < 0 && !isSubmitted;
  const isDueSoon = hoursLeft > 0 && hoursLeft <= 48;

  const handleStatusChange = async (newStatus: string) => {
    await updateAssignment(assignment.id, { status: newStatus });
    onUpdate();
  };

  const getUrgencyText = () => {
    if (isOverdue) return `Overdue by ${Math.abs(Math.floor(hoursLeft))}h`;
    if (isDueSoon) return `${Math.floor(hoursLeft)}h to go`;
    return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className={cn(
      "card-polish p-5 rounded-2xl group flex flex-col gap-4 bg-white relative overflow-hidden",
      isOverdue && "border-rose-300 ring-1 ring-rose-300/10",
      isDueSoon && "border-amber-300 ring-1 ring-amber-300/10"
    )}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1.5 flex-1 pr-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-brand-blue/10 border border-brand-blue/20 rounded text-[10px] font-bold text-brand-blue uppercase tracking-wider">
              {assignment.course_code}
            </span>
            {assignment.weight_percent && (
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {assignment.weight_percent}% Grade
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-brand-textMain">
            {assignment.title}
          </h4>
        </div>

        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase border whitespace-nowrap",
          status.color, status.bg, status.border
        )}>
          {isSubmitted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          {status.label}
        </div>
      </div>

      {/* Details List */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-500">
          <Clock className="w-4 h-4" />
          <span className={cn("text-xs font-bold uppercase tracking-wider", (isOverdue || isDueSoon) ? "text-brand-textMain" : "text-gray-400")}>
            {getUrgencyText()}
          </span>
        </div>
        {assignment.estimated_hours && (
          <div className="flex items-center gap-2 text-gray-500">
            <Timer className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {assignment.estimated_hours}h EST. EFFORT
            </span>
          </div>
        )}
      </div>

      {!isSubmitted && (
        <button 
          onClick={() => handleStatusChange("submitted")}
          className="mt-2 w-full py-2.5 bg-gray-50 hover:bg-brand-blue/10 text-[10px] font-black text-gray-500 hover:text-brand-blue rounded-xl transition-all border border-gray-100 uppercase tracking-wider shadow-sm"
        >
          Mark as Submitted
        </button>
      )}

      {isOverdue && (
        <div className="absolute top-0 right-0 p-2 opacity-50">
          <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
        </div>
      )}
    </div>
  );
}