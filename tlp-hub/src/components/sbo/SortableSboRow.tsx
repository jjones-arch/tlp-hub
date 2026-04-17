"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface SortableSboRowProps {
  sbo: {
    id: string;
    name: string;
    owner: string;
    division: string;
    status: string;
    taskCount: number;
    tasksDone: number;
    nextMeeting: { title: string; date: string } | null;
    meetingCount: number;
  };
}

export function SortableSboRow({ sbo }: SortableSboRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sbo.id });
  const pct = sbo.taskCount > 0 ? Math.round((sbo.tasksDone / sbo.taskCount) * 100) : 0;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <li ref={setNodeRef} style={style} className="list-none">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 hover:border-accent/40 transition-colors group">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-text-3 hover:text-text-2 focus:outline-none"
          aria-label="Drag to reorder"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5.5" cy="3.5" r="1.2" />
            <circle cx="10.5" cy="3.5" r="1.2" />
            <circle cx="5.5" cy="8" r="1.2" />
            <circle cx="10.5" cy="8" r="1.2" />
            <circle cx="5.5" cy="12.5" r="1.2" />
            <circle cx="10.5" cy="12.5" r="1.2" />
          </svg>
        </button>

        {/* Status badge */}
        <div className="flex-shrink-0">
          <StatusBadge status={sbo.status} />
        </div>

        {/* Name + owner (link to detail) */}
        <Link href={`/sbos/${sbo.id}`} className="flex-1 min-w-0">
          <span className="font-serif text-[14px] font-semibold text-text group-hover:text-accent transition-colors">
            {sbo.name}
          </span>
          {sbo.owner && <span className="text-[12px] text-text-3 ml-2">{sbo.owner}</span>}
        </Link>

        {/* Division pill */}
        {sbo.division && (
          <span className="flex-shrink-0 text-[10px] text-text-3 font-medium uppercase tracking-wide bg-surface-2 px-2 py-0.5 rounded">
            {sbo.division}
          </span>
        )}

        {/* Task progress */}
        <div className="flex items-center gap-2 flex-shrink-0 min-w-[100px] justify-end">
          <div className="relative w-7 h-7">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-border)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke={pct === 100 ? "var(--color-green)" : "var(--color-accent)"}
                strokeWidth="3"
                strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-text-2">
              {pct}%
            </span>
          </div>
          <span className="text-[11px] text-text-2 whitespace-nowrap">
            {sbo.tasksDone} of {sbo.taskCount} tasks
          </span>
        </div>

        {/* Next meeting */}
        <div className="flex-shrink-0 min-w-[160px] text-right">
          {sbo.nextMeeting ? (
            <span className="text-[11px] text-text-3">
              Next: <span className="text-text font-medium">{sbo.nextMeeting.date}</span>
            </span>
          ) : (
            <span className="text-[11px] text-text-3 italic">No upcoming meetings</span>
          )}
        </div>

        {/* Chevron */}
        <Link href={`/sbos/${sbo.id}`} className="flex-shrink-0 text-text-3 group-hover:text-accent transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </Link>
      </div>
    </li>
  );
}
