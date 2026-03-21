"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  TimelineNode,
  AttendanceState,
  AttendanceStats,
  generateTimelineNodesFromTimetable,
  getTodaySchedule,
  calculateAttendanceStats,
  getNextState,
  getStateColors,
  getStateIcon,
  formatTimelineDate,
  formatDayShort,
  TimetableSlot,
} from "@/lib/AttendanceUtils";

interface AttendanceTimelineProps {
  currentTotal: number;
  currentAttended: number;
  subjectName: string;
  subjectId: string;
  timetableSlots: TimetableSlot[];
  onUpdatePredictions?: (nodes: TimelineNode[]) => void;
}

export default function AttendanceTimeline({
  currentTotal,
  currentAttended,
  subjectName,
  subjectId,
  timetableSlots,
  onUpdatePredictions,
}: AttendanceTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<TimelineNode[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TimetableSlot[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalClasses: currentTotal,
    attendedClasses: currentAttended,
    percentage: currentTotal > 0 ? (currentAttended / currentTotal) * 100 : 0,
    canMiss: 0,
    neededFor75: 0,
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // End date for prediction
  const today = new Date();
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 30);
  const [endDate, setEndDate] = useState<string>(
    defaultEndDate.toISOString().split("T")[0]
  );

  // Generate timeline on mount or when subject/timetable/endDate changes
  useEffect(() => {
    const generatedNodes = generateTimelineNodesFromTimetable(
      timetableSlots,
      subjectId,
      new Date(endDate)
    );
    setNodes(generatedNodes);

    // Get today's schedule
    const todayClasses = getTodaySchedule(timetableSlots, subjectId);
    setTodaySchedule(todayClasses);

    // Calculate stats
    const calculatedStats = calculateAttendanceStats(
      currentTotal,
      currentAttended,
      generatedNodes
    );
    setStats(calculatedStats);
  }, [currentTotal, currentAttended, subjectId, timetableSlots, endDate]);

  // Handle node state toggle
  const handleNodeClick = (index: number) => {
    const newNodes = [...nodes];
    const currentState = newNodes[index].state;
    newNodes[index].state = getNextState(currentState);

    setNodes(newNodes);
    setSelectedNodeId(newNodes[index].id);

    // Recalculate stats
    const newStats = calculateAttendanceStats(
      currentTotal,
      currentAttended,
      newNodes
    );
    setStats(newStats);

    // Callback for backend sync (if needed)
    if (onUpdatePredictions) {
      onUpdatePredictions(newNodes);
    }
  };

  // Scroll to node
  const scrollToNode = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 300;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Percentage change
  const originalPercentage =
    currentTotal > 0 ? (currentAttended / currentTotal) * 100 : 0;
  const percentageChange = stats.percentage - originalPercentage;
  const percentageChangeSign = percentageChange > 0 ? "+" : "";

  // Status color
  const getStatusColor = (percentage: number) => {
    if (percentage < 60) return "text-rose-600";
    if (percentage < 75) return "text-amber-600";
    return "text-emerald-600";
  };

  const getStatusBg = (percentage: number) => {
    if (percentage < 60) return "bg-rose-50";
    if (percentage < 75) return "bg-amber-50";
    return "bg-emerald-50";
  };

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Attendance */}
        <motion.div
          className="card-polish rounded-[28px] p-6 bg-white border-2 border-gray-100"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Current Attendance
          </div>
          <div className="text-3xl font-black text-brand-textMain">
            {Math.round(originalPercentage)}%
          </div>
          <div className="text-[9px] text-gray-400 font-bold mt-2">
            {currentAttended} / {currentTotal} classes
          </div>
        </motion.div>

        {/* Predicted Attendance */}
        <motion.div
          className={`card-polish rounded-[28px] p-6 bg-white border-2 ${getStatusBg(stats.percentage)} border-2`}
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Predicted Attendance
          </div>
          <div className={`text-3xl font-black ${getStatusColor(stats.percentage)}`}>
            {Math.round(stats.percentage)}%
          </div>
          <div className="text-[9px] text-gray-400 font-bold mt-2">
            {stats.attendedClasses} / {stats.totalClasses} classes
          </div>
        </motion.div>

        {/* Change */}
        <motion.div
          className={`card-polish rounded-[28px] p-6 bg-white border-2 ${
            percentageChange > 0 ? "border-emerald-200" : percentageChange < 0 ? "border-rose-200" : "border-gray-200"
          }`}
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Change
          </div>
          <div
            className={`text-3xl font-black ${
              percentageChange > 0
                ? "text-emerald-600"
                : percentageChange < 0
                  ? "text-rose-600"
                  : "text-gray-400"
            }`}
          >
            {percentageChangeSign}{Math.abs(percentageChange).toFixed(1)}%
          </div>
          <div className="text-[9px] text-gray-400 font-bold mt-2">
            {percentageChange !== 0 ? (percentageChange > 0 ? "Improvement" : "Decline") : "No change"}
          </div>
        </motion.div>
      </div>

      {/* Today's Schedule */}
      {todaySchedule.length > 0 && (
        <div className="bg-gradient-to-r from-brand-blue/5 to-brand-purple/5 rounded-[28px] p-6 border-2 border-brand-blue/20">
          <div className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mb-4">
            📅 Today's Classes
          </div>
          <div className="space-y-3">
            {todaySchedule.map((classItem, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white rounded-xl p-3 border border-brand-blue/10">
                <div>
                  <p className="text-sm font-black text-brand-textMain">{classItem.start_time} - {classItem.end_time}</p>
                  <p className="text-[9px] text-gray-500 font-bold">{classItem.room || "Room TBA"}</p>
                </div>
                <div className="text-right">
                  <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-black">
                    ✓
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prediction Date Range */}
      <div className="bg-brand-blue/5 rounded-[28px] p-6 border-2 border-brand-blue/20">
        <div className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mb-4">
          📅 Prediction Period
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
              From
            </label>
            <div className="text-sm font-black text-brand-textMain">
              {today.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
          <div className="text-gray-400 text-xl">→</div>
          <div className="flex-1">
            <label htmlFor="endDate" className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
              To
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={today.toISOString().split("T")[0]}
              className="w-full px-4 py-2 rounded-xl border-2 border-brand-blue/30 focus:border-brand-blue bg-white text-sm font-bold text-brand-textMain outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black text-brand-textMain uppercase tracking-widest">
            Interactive Timeline
          </h3>
          <p className="text-[9px] text-gray-400 font-bold">Click nodes to toggle states</p>
        </div>

        <div className="relative">
          {/* Scroll Buttons */}
          <button
            onClick={() => scrollToNode("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-xl bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto no-scrollbar px-16"
          >
            <div className="flex gap-6 py-6 min-w-min">
              {nodes.map((node, index) => {
                const colors = getStateColors(node.state);
                const isSelected = selectedNodeId === node.id;
                const isToday = node.isToday;

                return (
                  <motion.button
                    key={node.id}
                    onClick={() => handleNodeClick(index)}
                    className={`relative flex flex-col items-center gap-3 group transition-all ${
                      isSelected ? "scale-110" : "hover:scale-105"
                    }`}
                    whileTap={{ scale: 0.95 }}
                    layout
                  >
                    {/* Circle Node */}
                    <motion.div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black border-2 cursor-pointer transition-all ${
                        colors.bg
                      } ${colors.border} ${colors.text} ${isSelected ? `shadow-lg ${colors.glow}` : ""} ${
                        isToday ? "ring-4 ring-brand-blue ring-offset-2" : ""
                      }`}
                      whileHover={{ scale: 1.1 }}
                      animate={
                        isSelected
                          ? {
                              boxShadow: `0 0 20px rgba(var(--color-rgb), 0.4)`,
                            }
                          : {}
                      }
                    >
                      {getStateIcon(node.state)}
                    </motion.div>

                    {/* Date Label */}
                    <div className="text-center">
                      <div className="text-[10px] font-black text-brand-textMain uppercase tracking-tight">
                        {formatDayShort(node.dayOfWeek)}
                      </div>
                      <div className="text-[9px] font-bold text-gray-400">
                        {formatTimelineDate(node.date)}
                      </div>
                    </div>

                    {/* State Badge */}
                    <motion.div
                      className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${colors.badge} ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`}
                      initial={{ opacity: isSelected ? 1 : 0 }}
                      animate={{ opacity: isSelected ? 1 : 0 }}
                    >
                      {node.state}
                    </motion.div>

                    {/* Today Indicator */}
                    {isToday && (
                      <motion.div
                        className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[8px] font-black text-brand-blue uppercase"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="w-2 h-2 rounded-full bg-brand-blue"></div>
                        TODAY
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Right Scroll Button */}
          <button
            onClick={() => scrollToNode("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-xl bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Can Miss */}
        <motion.div
          className="card-polish rounded-[24px] p-6 bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-100"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                Can Miss
              </p>
              <p className="text-4xl font-black text-blue-600">{stats.canMiss}</p>
              <p className="text-[9px] text-blue-500 font-bold mt-2">
                classes while maintaining 75% attendance
              </p>
            </div>
            <div className="text-5xl opacity-20">📚</div>
          </div>
        </motion.div>

        {/* Needed for 75% */}
        <motion.div
          className={`card-polish rounded-[24px] p-6 bg-gradient-to-br ${
            stats.percentage >= 75
              ? "from-emerald-50 to-emerald-50/50 border-emerald-100"
              : "from-amber-50 to-amber-50/50 border-amber-100"
          } border`}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p
                className={`text-[10px] font-bold ${
                  stats.percentage >= 75 ? "text-emerald-600" : "text-amber-600"
                } uppercase tracking-widest mb-1`}
              >
                {stats.percentage >= 75 ? "Target Reached! ✓" : "Needed for 75%"}
              </p>
              <p
                className={`text-4xl font-black ${
                  stats.percentage >= 75 ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {stats.neededFor75}
              </p>
              <p
                className={`text-[9px] font-bold mt-2 ${
                  stats.percentage >= 75 ? "text-emerald-500" : "text-amber-500"
                }`}
              >
                {stats.percentage >= 75
                  ? "You're above 75% attendance"
                  : "classes to reach 75% attendance"}
              </p>
            </div>
            <div className="text-5xl opacity-20">{stats.percentage >= 75 ? "🎯" : "📈"}</div>
          </div>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-[24px] p-6 border border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
          State Legend
        </p>
        <div className="grid grid-cols-3 gap-4">
          {(["present", "absent", "leave"] as const).map((state) => {
            const colors = getStateColors(state);
            return (
              <div key={state} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 ${colors.bg} ${colors.border} ${colors.text}`}
                >
                  {getStateIcon(state)}
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-600 uppercase">
                    {state}
                  </p>
                  <p className="text-[8px] text-gray-400">
                    {state === "present"
                      ? "+1 Class"
                      : state === "absent"
                        ? "+1 Skipped"
                        : "Excluded"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
