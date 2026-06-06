"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAdminStore } from "../../../hooks/adminStore";

export default function DateRangePicker() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dateRange = useAdminStore((s) => s.dateRange);
  const setDateRange = useAdminStore((s) => s.setDateRange);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateString = (dateObj) => {
    if (!dateObj) return "";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return dateObj.toLocaleDateString('en-US', options);
  };

  const getWeekRange = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return { start: startOfWeek, end: endOfWeek };
  };

  // Initialize with this week if null
  useEffect(() => {
    if (!dateRange.start) {
      setDateRange(getWeekRange());
    }
  }, []);

  const handleApply = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const startStr = fd.get("start");
    const endStr = fd.get("end");
    
    if (startStr && endStr) {
      setDateRange({
        start: new Date(startStr),
        end: new Date(endStr)
      });
      setIsOpen(false);
    }
  };

  const setPreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setDateRange({ start, end });
    setIsOpen(false);
  };

  const displayString = dateRange.start && dateRange.end 
    ? `${formatDateString(dateRange.start)} - ${formatDateString(dateRange.end)}`
    : "Select Date Range";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`hidden xl:flex h-11 items-center gap-2 rounded-xl border border-white/[0.09] px-4 text-sm font-medium transition active:scale-95 cursor-pointer ${
          isOpen ? "bg-white/[0.06] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]" : "bg-white/[0.03] text-white hover:bg-white/[0.06]"
        }`}
      >
        <CalendarDays className="h-4 w-4 text-neutral-400" />
        <span className="min-w-[170px] text-left">{displayString}</span>
        <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-white/[0.09] bg-[#0b141b]/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-[fadeIn_0.15s_ease-out]">
          <h3 className="text-sm font-bold text-white mb-4">Date Range</h3>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => setPreset(7)} className="rounded-lg border border-white/5 bg-white/[0.02] py-2 text-xs font-semibold text-neutral-300 hover:bg-white/[0.06] hover:text-white transition cursor-pointer">
              Last 7 Days
            </button>
            <button onClick={() => setPreset(30)} className="rounded-lg border border-white/5 bg-white/[0.02] py-2 text-xs font-semibold text-neutral-300 hover:bg-white/[0.06] hover:text-white transition cursor-pointer">
              Last 30 Days
            </button>
            <button onClick={() => setPreset(90)} className="rounded-lg border border-white/5 bg-white/[0.02] py-2 text-xs font-semibold text-neutral-300 hover:bg-white/[0.06] hover:text-white transition cursor-pointer">
              Last 90 Days
            </button>
            <button onClick={() => { setDateRange(getWeekRange()); setIsOpen(false); }} className="rounded-lg border border-white/5 bg-white/[0.02] py-2 text-xs font-semibold text-neutral-300 hover:bg-white/[0.06] hover:text-white transition cursor-pointer">
              This Week
            </button>
          </div>

          <div className="my-4 h-px w-full bg-white/[0.06]" />

          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Start Date</label>
              <input 
                name="start" 
                type="date" 
                required
                defaultValue={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-green-500/50 transition [color-scheme:dark]" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">End Date</label>
              <input 
                name="end" 
                type="date" 
                required
                defaultValue={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-green-500/50 transition [color-scheme:dark]" 
              />
            </div>
            <button type="submit" className="w-full rounded-lg bg-green-500 py-2.5 text-sm font-bold text-black hover:bg-green-400 active:scale-95 transition cursor-pointer">
              Apply Filter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
