type InitiativeSummary = { id: string; name: string; status: string };

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
  initiatives?: Record<string, InitiativeSummary>;
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
