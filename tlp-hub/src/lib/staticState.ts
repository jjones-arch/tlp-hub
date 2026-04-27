type InitiativeSummary = { id: string; name: string; status: string };
type InitiativeOwner = { id: string; name: string; role: string };
type InitiativeTask = {
  id: string;
  text: string;
  owner: string;
  due: string | null;
  status: string;
  priority: string;
  initiativeId: string;
};
type InitiativeRisk = { id: string; text: string; impact: string; likelihood: string; status: string };
type InitiativeObjective = { id: string; text: string; status: string };
type InitiativeDecision = { id: string; title: string; status: string; priority: string };
type InitiativeDashboard = {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  quarter: string;
  owners: InitiativeOwner[];
  tasks: InitiativeTask[];
  risks: InitiativeRisk[];
  objectives: InitiativeObjective[];
  decisions: InitiativeDecision[];
};

type StateSboTask = {
  id: string;
  text: string;
  owner?: string;
  due?: string;
  endDate?: string;
  status?: string;
  priority?: string;
};

type StateSboMeeting = {
  id: string;
  title: string;
  date?: string;
  endDate?: string;
  attendees?: string;
  description?: string;
  agenda?: string;
  notes?: string;
  actionItems?: string;
  transcript?: string;
  recurrence?: string;
  recurrenceEnd?: string;
};

type StateSbo = {
  id: string;
  name: string;
  owner?: string;
  division?: string;
  status?: string;
  description?: string;
  notes?: string;
  sortOrder?: number;
  tasks?: StateSboTask[];
  meetings?: StateSboMeeting[];
};

type StateShape = {
  initiatives?: Record<
    string,
    InitiativeSummary & {
      description?: string;
      progress?: number;
      quarter?: string;
      owners?: string[];
      tasks?: Array<{ id: string; text: string; owner?: string; due?: string; status?: string; priority?: string }>;
      risks?: Array<{ id: string; title?: string; impact?: string; likelihood?: string }>;
      objectives?: Array<{ id: string; text: string; complete?: boolean }>;
      decisions?: Array<{ id: string; text?: string }>;
    }
  >;
  sbos?: Record<string, StateSbo>;
};

function staticStateUrl() {
  if (typeof window === "undefined") return "/data/state.json";
  const basePath = window.location.pathname.startsWith("/tlp-hub") ? "/tlp-hub" : "";
  return `${basePath}/data/state.json`;
}

export async function loadStaticState() {
  const res = await fetch(staticStateUrl(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load static state");
  return (await res.json()) as StateShape;
}

export function mapInitiativesForSidebar(state: StateShape): InitiativeSummary[] {
  return Object.values(state.initiatives ?? {});
}

export function mapInitiativesForDashboard(state: StateShape): InitiativeDashboard[] {
  return Object.values(state.initiatives ?? {}).map((initiative) => ({
    id: initiative.id,
    name: initiative.name,
    description: initiative.description ?? "",
    status: initiative.status ?? "on-track",
    progress: initiative.progress ?? 0,
    quarter: initiative.quarter ?? "",
    owners: (initiative.owners ?? []).map((name, idx) => ({ id: `${initiative.id}-owner-${idx}`, name, role: "" })),
    tasks: (initiative.tasks ?? []).map((task) => ({
      id: task.id,
      text: task.text,
      owner: task.owner ?? "",
      due: task.due ?? null,
      status: task.status ?? "not-started",
      priority: task.priority ?? "medium",
      initiativeId: initiative.id,
    })),
    risks: (initiative.risks ?? []).map((risk) => ({
      id: risk.id,
      text: risk.title ?? "",
      impact: risk.impact ?? "medium",
      likelihood: risk.likelihood ?? "medium",
      status: "open",
    })),
    objectives: (initiative.objectives ?? []).map((objective) => ({
      id: objective.id,
      text: objective.text,
      status: objective.complete ? "complete" : "open",
    })),
    decisions: (initiative.decisions ?? []).map((decision) => ({
      id: decision.id,
      title: decision.text ?? "",
      status: "logged",
      priority: "medium",
    })),
  }));
}

export function mapInitiativeDetail(state: StateShape, initiativeId: string) {
  const raw = state.initiatives?.[initiativeId];
  if (!raw) return null;

  return {
    id: raw.id,
    name: raw.name,
    subtitle: "",
    quarter: raw.quarter ?? "",
    status: raw.status ?? "on-track",
    progress: raw.progress ?? 0,
    description: raw.description ?? "",
    notes: "",
    owners: (raw.owners ?? []).map((name, idx) => ({ id: `${raw.id}-owner-${idx}`, name })),
    objectives: (raw.objectives ?? []).map((o, idx) => ({
      id: o.id,
      text: o.text,
      description: "",
      complete: o.complete ?? false,
      sortOrder: idx,
    })),
    tasks: (raw.tasks ?? []).map((t, idx) => ({
      id: t.id,
      text: t.text,
      owner: t.owner ?? "",
      due: t.due ?? "",
      status: t.status ?? "not-started",
      priority: t.priority ?? "medium",
      sortOrder: idx,
      updates: [],
    })),
    risks: (raw.risks ?? []).map((r) => ({
      id: r.id,
      title: r.title ?? "",
      description: "",
      likelihood: r.likelihood ?? "medium",
      impact: r.impact ?? "medium",
      mitigation: "",
    })),
    decisions: (raw.decisions ?? []).map((d) => ({
      id: d.id,
      text: d.text ?? "",
      date: "",
    })),
  };
}

export function mapSboFallbackData(state: StateShape) {
  const sbos = Object.values(state.sbos ?? {}).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const sbosSummary = sbos.map((sbo) => {
    const meetings = sbo.meetings ?? [];
    const tasks = sbo.tasks ?? [];
    const today = new Date().toISOString().slice(0, 10);
    const nextMeeting = meetings.find((m) => (m.date ?? "") >= today) ?? null;
    return {
      id: sbo.id,
      name: sbo.name,
      owner: sbo.owner ?? "",
      division: sbo.division ?? "",
      status: sbo.status ?? "on-track",
      description: sbo.description ?? "",
      taskCount: tasks.length,
      tasksDone: tasks.filter((t) => t.status === "complete").length,
      nextMeeting: nextMeeting ? { title: nextMeeting.title, date: nextMeeting.date ?? "" } : null,
      meetingCount: meetings.length,
    };
  });

  const allTasks = sbos.flatMap((sbo) =>
    (sbo.tasks ?? []).map((task) => ({
      id: task.id,
      text: task.text,
      owner: task.owner ?? "",
      due: task.due ?? "",
      endDate: task.endDate ?? task.due ?? "",
      status: task.status ?? "not-started",
      priority: task.priority ?? "medium",
      sboId: sbo.id,
      sbo: { id: sbo.id, name: sbo.name },
    })),
  );

  const allMeetings = sbos.flatMap((sbo) =>
    (sbo.meetings ?? []).map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      date: meeting.date ?? "",
      endDate: meeting.endDate ?? meeting.date ?? "",
      attendees: meeting.attendees ?? "",
      description: meeting.description ?? "",
      agenda: meeting.agenda ?? "",
      notes: meeting.notes ?? "",
      actionItems: meeting.actionItems ?? "",
      transcript: meeting.transcript ?? "",
      recurrence: meeting.recurrence ?? "none",
      recurrenceEnd: meeting.recurrenceEnd ?? "",
      sboId: sbo.id,
      sbo: { id: sbo.id, name: sbo.name },
    })),
  );

  return { sbosSummary, allTasks, allMeetings };
}
