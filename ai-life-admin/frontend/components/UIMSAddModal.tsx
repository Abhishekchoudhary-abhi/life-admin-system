"use client";
import React, { useState } from "react";
import { X, Plus, Book, User, Calendar, Clock, MapPin, Gauge } from "lucide-react";

interface UIMSAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "subject" | "slot" | "mark";
  subjects: any[];
  onAdd: (type: string, data: any) => Promise<void>;
}

export default function UIMSAddModal({ isOpen, onClose, type, subjects, onAdd }: UIMSAddModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Subject State
  const [subName, setSubName] = useState("");
  const [faculty, setFaculty] = useState("");

  // Slot State
  const [selectedSub, setSelectedSub] = useState("");
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [room, setRoom] = useState("");

  // Mark State
  const [category, setCategory] = useState("assignment");
  const [title, setTitle] = useState("");
  const [obtained, setObtained] = useState("");
  const [total, setTotal] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === "subject") {
        await onAdd("subject", { name: subName, faculty });
      } else if (type === "slot") {
        await onAdd("slot", { subject_id: selectedSub, day, start_time: startTime, end_time: endTime, room });
      } else if (type === "mark") {
        await onAdd("mark", { subject_id: selectedSub, category, title, obtained: parseFloat(obtained), total: parseFloat(total) });
      }
      onClose();
    } catch (err) {
      alert("Failed to add entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-brand-textMain uppercase tracking-tight">
                Add {type.charAt(0).toUpperCase() + type.slice(1)}
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">UIMS Registry Entry</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {type === "subject" && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Subject Name</label>
                  <div className="relative">
                    <Book className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      required
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      placeholder="e.g. Data Structures"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-black/5 text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Faculty Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={faculty}
                      onChange={(e) => setFaculty(e.target.value)}
                      placeholder="e.g. Prof. R. Sharma"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-black/5 text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {(type === "slot" || type === "mark") && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select Subject</label>
                <select
                  required
                  value={selectedSub}
                  onChange={(e) => setSelectedSub(e.target.value)}
                  className="w-full px-4 py-4 rounded-2xl bg-gray-50 border border-black/5 text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all appearance-none"
                >
                  <option value="">Choose Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {type === "slot" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Day</label>
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="w-full px-4 py-4 rounded-2xl bg-gray-50 border border-black/5 text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    >
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Room</label>
                    <input
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="e.g. B-302"
                      className="w-full px-4 py-4 rounded-2xl bg-gray-50 border border-black/5 text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Starts At</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-4 rounded-2xl bg-gray-50 border border-black/5 text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Ends At</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-4 rounded-2xl bg-gray-50 border border-black/5 text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {type === "mark" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-4 rounded-2xl bg-gray-50 border border-black/5 text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    >
                      <option value="assignment">Assignment</option>
                      <option value="mst1">MST 1</option>
                      <option value="mst2">MST 2</option>
                      <option value="practical">Practical</option>
                      <option value="final">Final Exam</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Entry Title</label>
                    <input
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Unit Test 1"
                      className="w-full px-4 py-4 rounded-2xl bg-gray-50 border border-black/5 text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Obtained</label>
                    <input
                      required
                      type="number"
                      step="0.5"
                      value={obtained}
                      onChange={(e) => setObtained(e.target.value)}
                      placeholder="18"
                      className="w-full px-4 py-4 rounded-2xl bg-gray-50 border border-black/5 text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Total Marks</label>
                    <input
                      required
                      type="number"
                      step="0.5"
                      value={total}
                      onChange={(e) => setTotal(e.target.value)}
                      placeholder="20"
                      className="w-full px-4 py-4 rounded-2xl bg-gray-50 border border-black/5 text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Registering..." : (
                <>
                  <Plus className="w-4 h-4" /> Finalize Addition
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
