"use client";
import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Mon", tasks: 4 },
  { name: "Tue", tasks: 7 },
  { name: "Wed", tasks: 5 },
  { name: "Thu", tasks: 9 },
  { name: "Fri", tasks: 12 },
  { name: "Sat", tasks: 8 },
  { name: "Sun", tasks: 6 },
];

export default function ProductivityChart() {
  return (
    <div className="card-polish rounded-3xl p-8 bg-white relative overflow-hidden gradient-border flex flex-col gap-6 h-[340px]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-brand-textMain">System Output</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Weekly Efficiency Metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-blue" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Units Logged</span>
        </div>
      </div>
      
      <div className="flex-1 w-full opacity-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D1FF" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00D1FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#9ca3af", fontSize: 9, fontWeight: 800 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#9ca3af", fontSize: 9, fontWeight: 800 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#fff", 
                border: "1px solid #f3f4f6", 
                borderRadius: "16px",
                fontSize: "10px",
                fontWeight: "900",
                color: "#1A1A1A",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
              }}
              labelStyle={{ color: "#00D1FF", marginBottom: "4px" }}
              itemStyle={{ color: "#1A1A1A", textTransform: "uppercase" }}
              cursor={{ stroke: "#00D1FF", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="tasks"
              stroke="#00D1FF"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorTasks)"
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
