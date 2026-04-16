"use client";

export type ViewMode = "list" | "calendar" | "gantt";

interface ViewTabsProps {
  active: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const TABS: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
  {
    mode: "list",
    label: "List",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    mode: "calendar",
    label: "Calendar",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    mode: "gantt",
    label: "Gantt",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="3" y="2" width="8" height="2.5" rx="1" fill="currentColor" opacity=".7" />
        <rect x="1" y="6.5" width="10" height="2.5" rx="1" fill="currentColor" opacity=".7" />
        <rect x="5" y="11" width="7" height="2.5" rx="1" fill="currentColor" opacity=".7" />
      </svg>
    ),
  },
];

export function ViewTabs({ active, onChange }: ViewTabsProps) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 gap-0.5">
      {TABS.map(({ mode, label, icon }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors ${
            active === mode ? "bg-navy text-white shadow-sm" : "text-text-2 hover:bg-surface-2 hover:text-text"
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}
