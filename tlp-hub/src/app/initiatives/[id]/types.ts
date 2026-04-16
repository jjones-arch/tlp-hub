export interface Owner {
  id: string;
  name: string;
}
export interface Objective {
  id: string;
  text: string;
  description: string;
  complete: boolean;
  sortOrder: number;
}
export interface TaskAttachment {
  id: string;
  filename: string;
  storedName: string;
  mimeType: string;
  size: number;
}
export interface TaskUpdate {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  attachments: TaskAttachment[];
}
export interface Task {
  id: string;
  text: string;
  owner: string;
  due: string;
  status: string;
  priority: string;
  sortOrder: number;
  updates: TaskUpdate[];
}
export interface Risk {
  id: string;
  title: string;
  description: string;
  likelihood: string;
  impact: string;
  mitigation: string;
}
export interface Decision {
  id: string;
  text: string;
  date: string;
}
export interface Initiative {
  id: string;
  name: string;
  subtitle: string;
  quarter: string;
  status: string;
  progress: number;
  description: string;
  notes: string;
  owners: Owner[];
  objectives: Objective[];
  tasks: Task[];
  risks: Risk[];
  decisions: Decision[];
}

export const TASK_STATUSES = ["not-started", "in-progress", "blocked", "complete"];
export const PRIORITIES = ["low", "medium", "high"];
export const LIKELIHOODS = ["low", "medium", "high"];
export const IMPACTS = ["low", "medium", "high"];

export const inputCls =
  "w-full rounded border border-border bg-surface px-3 py-1.5 text-[13px] text-text placeholder:text-text-3 focus:outline-none focus:ring-1 focus:ring-accent";
export const selectCls =
  "rounded border border-border bg-surface px-2 py-1.5 text-[13px] text-text focus:outline-none focus:ring-1 focus:ring-accent";
export const btnPrimary =
  "rounded bg-navy px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90 transition-opacity";
export const btnGhost =
  "rounded px-3 py-1.5 text-[12.5px] font-medium text-text-2 hover:bg-surface-2 transition-colors";
