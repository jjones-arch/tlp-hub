"use client";

import { useState, useMemo } from "react";
import { MeetingOccurrence, expandMeetings } from "@/lib/recurrence";

interface RawMeeting {
  id: string;
  title: string;
  date: string;
  endDate: string;
  sboId: string;
  recurrence: string;
  recurrenceEnd: string;
  attendees: string;
  description: string;
  agenda: string;
  notes: string;
  actionItems: string;
  sbo?: { id: string; name: string };
}

interface CalendarGridProps {
  meetings: RawMeeting[];
  sboColors?: Record<string, string>;
  onMeetingClick?: (occurrence: MeetingOccurrence) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DEFAULT_COLORS = [
  "var(--color-accent)",
  "var(--color-blue)",
  "var(--color-green)",
  "var(--color-amber)",
  "var(--color-red)",
  "#7C3AED",
  "#0891B2",
  "#BE185D",
  "#65A30D",
  "#CA8A04",
  "#DC2626",
  "#2563EB",
  "#9333EA",
  "#059669",
];

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { date: string; day: number; isCurrentMonth: boolean }[] = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    cells.push({
      date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      day: d,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      day: d,
      isCurrentMonth: true,
    });
  }

  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const m = month + 2 > 12 ? 1 : month + 2;
      const y = month + 2 > 12 ? year + 1 : year;
      cells.push({
        date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        day: d,
        isCurrentMonth: false,
      });
    }
  }

  return cells;
}

export function CalendarGrid({ meetings, sboColors: externalColors, onMeetingClick }: CalendarGridProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const cells = useMemo(() => getMonthDays(year, month), [year, month]);
  const rangeStart = cells[0].date;
  const rangeEnd = cells[cells.length - 1].date;

  const sboColors = useMemo(() => {
    if (externalColors) return externalColors;
    const map: Record<string, string> = {};
    const sboIds = [...new Set(meetings.map((m) => m.sboId))];
    sboIds.forEach((id, i) => {
      map[id] = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
    });
    return map;
  }, [meetings, externalColors]);

  const occurrences = useMemo(() => expandMeetings(meetings, rangeStart, rangeEnd), [meetings, rangeStart, rangeEnd]);

  const byDate = useMemo(() => {
    const map: Record<string, MeetingOccurrence[]> = {};
    for (const occ of occurrences) {
      (map[occ.date] ??= []).push(occ);
    }
    return map;
  }, [occurrences]);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  function prevMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else setMonth(month + 1);
  }
  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-7 h-7 rounded border border-border flex items-center justify-center text-text-2 hover:bg-surface-2 text-sm"
          >
            &lt;
          </button>
          <h3 className="font-serif text-[16px] font-semibold text-text min-w-[180px] text-center">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button
            onClick={nextMonth}
            className="w-7 h-7 rounded border border-border flex items-center justify-center text-text-2 hover:bg-surface-2 text-sm"
          >
            &gt;
          </button>
        </div>
        <button onClick={goToday} className="text-[12px] font-medium text-accent hover:underline">
          Today
        </button>
      </div>

      <div className="grid grid-cols-7 border border-border rounded-lg overflow-hidden">
        {DAYS.map((d) => (
          <div
            key={d}
            className="bg-surface-2 text-center text-[11px] font-semibold text-text-2 uppercase tracking-wider py-2 border-b border-border"
          >
            {d}
          </div>
        ))}

        {cells.map((cell) => {
          const dayMeetings = byDate[cell.date] || [];
          const isToday = cell.date === todayStr;
          return (
            <div
              key={cell.date}
              className={`min-h-[85px] border-b border-r border-border p-1.5 ${
                cell.isCurrentMonth ? "bg-surface" : "bg-surface-2/50"
              }`}
            >
              <div
                className={`text-[11px] font-medium mb-1 ${
                  isToday
                    ? "w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center"
                    : cell.isCurrentMonth
                      ? "text-text-2"
                      : "text-text-3"
                }`}
              >
                {cell.day}
              </div>
              <div className="space-y-0.5">
                {dayMeetings.slice(0, 3).map((occ) => (
                  <button
                    key={occ.id}
                    onClick={() => onMeetingClick?.(occ)}
                    className="block w-full text-left rounded px-1 py-0.5 text-[10px] font-medium text-white truncate hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: sboColors[occ.sboId] || "var(--color-accent)" }}
                    title={`${occ.title}${occ.sboName ? ` — ${occ.sboName}` : ""}`}
                  >
                    {occ.title}
                  </button>
                ))}
                {dayMeetings.length > 3 && (
                  <div className="text-[9px] text-text-3 pl-1">+{dayMeetings.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
