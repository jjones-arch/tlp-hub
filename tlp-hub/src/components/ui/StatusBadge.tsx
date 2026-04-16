"use client";
import { statusBadgeClasses, statusLabel } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wide ${statusBadgeClasses(status)}`}
    >
      <span className="w-[5px] h-[5px] rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}
