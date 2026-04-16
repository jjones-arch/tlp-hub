"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface SboCardProps {
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

export function SboCard({ sbo }: SboCardProps) {
  const pct = sbo.taskCount > 0 ? Math.round((sbo.tasksDone / sbo.taskCount) * 100) : 0;

  return (
    <Link
      href={`/sbos/${sbo.id}`}
      className="block rounded-lg border border-border bg-surface p-5 hover:border-accent/40 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <StatusBadge status={sbo.status} />
        {sbo.division && (
          <span className="text-[10px] text-text-3 font-medium uppercase tracking-wide bg-surface-2 px-1.5 py-0.5 rounded">
            {sbo.division}
          </span>
        )}
      </div>

      <h3 className="font-serif text-[15px] font-semibold text-text leading-snug mb-1 group-hover:text-accent transition-colors">
        {sbo.name}
      </h3>
      {sbo.owner && (
        <p className="text-[12px] text-text-2 mb-3">{sbo.owner}</p>
      )}

      {/* Progress ring */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-9 h-9">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-border)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke={pct === 100 ? "var(--color-green)" : "var(--color-accent)"}
              strokeWidth="3"
              strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-text-2">
            {pct}%
          </span>
        </div>
        <div className="text-[11.5px] text-text-2">
          <span className="font-semibold text-text">{sbo.tasksDone}</span> of {sbo.taskCount} tasks
        </div>
      </div>

      {/* Next meeting */}
      {sbo.nextMeeting ? (
        <div className="rounded bg-surface-2 px-2.5 py-1.5 text-[11px]">
          <span className="text-text-3">Next:</span>{" "}
          <span className="text-text font-medium">{sbo.nextMeeting.title}</span>{" "}
          <span className="text-text-3">{sbo.nextMeeting.date}</span>
        </div>
      ) : (
        <div className="text-[11px] text-text-3 italic">No upcoming meetings</div>
      )}
    </Link>
  );
}
