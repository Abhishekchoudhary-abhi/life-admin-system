"use client";
import React from "react";
import { TrendingUp } from "lucide-react";

interface ProductivityInsightProps {
  score: number;
  timeSaved: string;
}

export default function ProductivityInsight({ score, timeSaved }: ProductivityInsightProps) {
  return (
    <section className="card-polish rounded-3xl p-8 bg-white relative overflow-hidden gradient-border" data-purpose="productivity-insight">
      <div className="flex justify-between items-start mb-8">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Efficiency Insight</h3>
        <div className="w-8 h-8 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>
      
      {/* Visual Chart Bars (Design parity) */}
      <div className="flex items-end justify-between h-28 mb-8 px-2 gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-1/3"></div>
        <div className="flex-1 bg-gray-100 rounded-full h-1/2"></div>
        <div className="flex-1 bg-brand-blue/20 rounded-full h-2/3"></div>
        <div className="flex-1 bg-brand-purple/20 rounded-full h-4/5"></div>
        <div className="flex-1 bg-gradient-to-t from-brand-blue to-cyan-400 rounded-full h-full shadow-lg relative group cursor-pointer">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-brand-textMain text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap font-black shadow-xl">Peak: {score}</div>
        </div>
        <div className="flex-1 bg-gray-100 rounded-full h-1/4"></div>
        <div className="flex-1 bg-gray-100 rounded-full h-1/5"></div>
      </div>
      
      <div className="flex justify-between items-center bg-gray-50 rounded-2xl p-6 border border-gray-100">
        <div className="text-center">
          <p className="text-4xl font-black text-brand-textMain neon-text-blue mb-1">{score}</p>
          <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Score</p>
        </div>
        <div className="h-10 w-[1px] bg-gray-200"></div>
        <div className="text-center">
          <p className="text-4xl font-black text-brand-blue mb-1">{timeSaved}</p>
          <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Time Saved</p>
        </div>
      </div>
    </section>
  );
}
