"use client";

import { useMemo } from "react";
import { taskStatusLabel } from "@/lib/utils";

interface GanttTask {
  id: string;
  text: string;
  due: string;
  endDate?: string;
  status: string;
  priority: string;
  owner: string;
  sboId: string;
  sboName?: string;
}

interface GanttGroup {
  id: string;
  name: string;
  tasks: GanttTask[];
}

interface GanttChartProps {
  groups: GanttGroup[];
  onTaskClick?: (task: GanttTask) => void;
}

const STATUS_COLORS: Record<string, string> = {
  "not-started": "var(--color-text-3)",
  "in-progress": "var(--color-blue)",
  blocked: "var(--color-red)",
  complete: "var(--color-green)",
};

function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function generateWeeks(start: Date, days: number) {
  const result: { label: string; startCol: number; span: number }[] = [];
  let current = new Date(start);
  let col = 0;

  while (col < days) {
    const weekStart = col;
    const label = formatShortDate(current);
    const daysUntilSunday = (7 - current.getDay()) % 7 || 7;
    const span = Math.min(daysUntilSunday, days - col);
    result.push({ label, startCol: weekStart, span });
    col += span;
    current = new Date(current.getTime() + span * 24 * 60 * 60 * 1000);
  }
  return result;
}

export function GanttChart({ groups, onTaskClick }: GanttChartProps) {
  const { timelineStart, totalDays, weeks } = useMemo(() => {
    const allDates: Date[] = [];
    for (const g of groups) {
      for (const t of g.tasks) {
        const start = parseDate(t.due);
        const end = parseDate(t.endDate || "");
        if (start) allDates.push(start);
        if (end) allDates.push(end);
      }
    }

    if (allDates.length === 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      return {
        timelineStart: start,
        totalDays: daysBetween(start, end) + 1,
        weeks: generateWeeks(start, daysBetween(start, end) + 1),
      };
    }

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    const start = new Date(minDate);
    start.setDate(start.getDate() - 7);
    const end = new Date(maxDate);
    end.setDate(end.getDate() + 14);

    const days = daysBetween(start, end) + 1;
    return {
      timelineStart: start,
      totalDays: Math.max(days, 30),
      weeks: generateWeeks(start, Math.max(days, 30)),
    };
  }, [groups]);

  const todayOffset = daysBetween(timelineStart, new Date());

  if (groups.every((g) => g.tasks.length === 0)) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-[13px] text-text-3">
        No tasks with due dates to display on the Gantt chart. Add tasks with due dates to see them here.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface overflow-x-auto">
      <div className="min-w-[800px]" style={{ display: "grid", gridTemplateColumns: `220px 1fr` }}>
        {/* Header row */}
        <div className="bg-surface-2 border-b border-r border-border px-3 py-2 text-[11px] font-semibold text-text-2 uppercase tracking-wider sticky left-0 z-10">
          Task
        </div>
        <div className="bg-surface-2 border-b border-border relative" style={{ height: 32 }}>
          <div className="flex h-full" style={{ width: `${totalDays * 3}px`, minWidth: "100%" }}>
            {weeks.map((w, i) => (
              <div
                key={i}
                className="border-r border-border-lt text-[9.5px] text-text-3 px-1 py-1 flex-shrink-0"
                style={{ width: `${w.span * 3}px` }}
              >
                {w.label}
              </div>
            ))}
          </div>
        </div>

        {/* Groups + tasks */}
        {groups.map((group) => (
          <div key={group.id} className="contents">
            {/* Group header */}
            <div className="bg-surface-2/60 border-b border-r border-border px-3 py-1.5 text-[11.5px] font-semibold text-text sticky left-0 z-10 col-span-2">
              {group.name}
              <span className="ml-2 text-text-3 font-normal">{group.tasks.length} tasks</span>
            </div>

            {group.tasks.map((task) => {
              const start = parseDate(task.due);
              const end = parseDate(task.endDate || "") || start;
              if (!start) {
                return (
                  <div key={task.id} className="contents">
                    <div className="border-b border-r border-border px-3 py-2 text-[12px] text-text-3 truncate sticky left-0 z-10 bg-surface">
                      {task.text}
                    </div>
                    <div className="border-b border-border relative bg-surface">
                      <div className="py-2 px-2 text-[10px] text-text-3 italic">No due date</div>
                    </div>
                  </div>
                );
              }

              const startCol = daysBetween(timelineStart, start);
              const duration = Math.max(daysBetween(start, end!) + 1, 1);

              return (
                <div key={task.id} className="contents">
                  <div
                    className="border-b border-r border-border px-3 py-2 text-[12px] text-text truncate sticky left-0 z-10 bg-surface cursor-pointer hover:bg-surface-2 transition-colors"
                    onClick={() => onTaskClick?.(task)}
                    title={`${task.text} (${taskStatusLabel(task.status)})`}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[task.status] || "var(--color-text-3)" }}
                    />
                    {task.text}
                  </div>
                  <div
                    className="border-b border-border relative bg-surface"
                    style={{ minWidth: `${totalDays * 3}px` }}
                  >
                    {todayOffset >= 0 && todayOffset <= totalDays && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-accent/30 z-[1]"
                        style={{ left: `${(todayOffset / totalDays) * 100}%` }}
                      />
                    )}
                    <div
                      className="absolute top-1.5 h-[18px] rounded-[4px] cursor-pointer hover:opacity-80 transition-opacity flex items-center px-1.5"
                      style={{
                        left: `${(startCol / totalDays) * 100}%`,
                        width: `${Math.max((duration / totalDays) * 100, 1.5)}%`,
                        backgroundColor: STATUS_COLORS[task.status] || "var(--color-text-3)",
                      }}
                      onClick={() => onTaskClick?.(task)}
                      title={`${formatShortDate(start)}${end && end !== start ? ` — ${formatShortDate(end)}` : ""}`}
                    >
                      <span className="text-[9px] text-white font-medium truncate">
                        {task.owner || taskStatusLabel(task.status)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
