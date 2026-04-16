"use client";
import { progressBarColor } from "@/lib/utils";

export function ProgressBar({ progress, status }: { progress: number; status: string }) {
  return (
    <div className="h-[5px] bg-border rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${progressBarColor(status)}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
