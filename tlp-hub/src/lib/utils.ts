export function statusColor(status: string) {
  const map: Record<string, string> = {
    "on-track": "var(--color-green)",
    "at-risk": "var(--color-amber)",
    blocked: "var(--color-red)",
    complete: "var(--color-blue)",
  };
  return map[status] || "var(--color-text-3)";
}

export function statusBadgeClasses(status: string) {
  const map: Record<string, string> = {
    "on-track": "bg-green-bg text-green",
    "at-risk": "bg-amber-bg text-amber",
    blocked: "bg-red-bg text-red",
    complete: "bg-blue-bg text-blue",
  };
  return map[status] || "bg-surface-2 text-text-2";
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    "on-track": "On Track",
    "at-risk": "At Risk",
    blocked: "Blocked",
    complete: "Complete",
  };
  return map[status] || status;
}

export function progressBarColor(status: string) {
  const map: Record<string, string> = {
    "on-track": "bg-green",
    "at-risk": "bg-amber",
    blocked: "bg-red",
    complete: "bg-blue",
  };
  return map[status] || "bg-accent";
}

export function priorityClasses(priority: string) {
  const map: Record<string, string> = {
    high: "text-red font-semibold",
    medium: "text-amber font-semibold",
    low: "text-text-3 font-semibold",
  };
  return map[priority] || "";
}

export function taskStatusClasses(status: string) {
  const map: Record<string, string> = {
    "in-progress": "text-blue",
    "not-started": "text-text-3",
    blocked: "text-red",
    complete: "text-green",
  };
  return map[status] || "";
}

export function taskStatusLabel(status: string) {
  const map: Record<string, string> = {
    "not-started": "Not Started",
    "in-progress": "In Progress",
    blocked: "Blocked",
    complete: "Complete",
  };
  return map[status] || status;
}
