"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: "blue" | "purple" | "orange" | "cyan" | "emerald" | "rose";
  trend?: {
    value: number;
    isUp: boolean;
  };
}

const colorVariants = {
  blue: "bg-brand-blue/10 text-brand-blue",
  purple: "bg-brand-purple/10 text-brand-purple",
  orange: "bg-orange-100 text-orange-600",
  cyan: "bg-cyan-100 text-cyan-600",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  rose: "bg-rose-50 text-rose-600 border-rose-100",
};

export default function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  return (
    <div className="card-polish p-5 rounded-2xl group relative overflow-hidden bg-white">
      <div className="flex justify-between items-start mb-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
          colorVariants[color]
        )}>
          <Icon className="w-5 h-5" />
        </div>
        
        {trend && (
          <div className={cn(
            "flex items-center text-[11px] font-bold px-2 py-0.5 rounded-lg border",
            trend.isUp ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-rose-600 bg-rose-50 border-rose-100"
          )}>
            <span className="mr-1">{trend.isUp ? "↑" : "↓"}</span>
            {trend.value}%
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-brand-textMain">{value}</p>
    </div>
  );
}