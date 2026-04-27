import fs from "node:fs";
import path from "node:path";
import { prisma } from "./db";

export type PagesSnapshotResult = {
  path: string;
  initiativeCount: number;
  sboCount: number;
};

export async function writePublicPagesSnapshot(): Promise<PagesSnapshotResult> {
  const initiatives = await prisma.initiative.findMany({
    include: {
      owners: true,
      objectives: { orderBy: { sortOrder: "asc" } },
      tasks: { orderBy: { sortOrder: "asc" } },
      risks: true,
      decisions: { orderBy: { createdAt: "asc" } },
    },
  });

  const initiativesMap: Record<string, unknown> = {};
  for (const init of initiatives) {
    initiativesMap[init.id] = {
      id: init.id,
      name: init.name,
      subtitle: init.subtitle,
      quarter: init.quarter,
      status: init.status,
      progress: init.progress,
      description: init.description,
      owners: init.owners.map((o) => o.name),
      objectives: init.objectives.map((o) => ({
        id: o.id,
        text: o.text,
        complete: o.complete,
      })),
      tasks: init.tasks.map((t) => ({
        id: t.id,
        text: t.text,
        owner: t.owner,
        due: t.due,
        status: t.status,
        priority: t.priority,
      })),
      risks: init.risks.map((r) => ({
        id: r.id,
        title: r.title,
        likelihood: r.likelihood,
        impact: r.impact,
      })),
      decisions: init.decisions.map((d) => ({
        id: d.id,
        text: d.text,
        date: d.date,
      })),
    };
  }

  const sbos = await prisma.sbo.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      tasks: { orderBy: { sortOrder: "asc" } },
      meetings: { orderBy: { date: "asc" } },
    },
  });

  const sbosMap: Record<string, unknown> = {};
  for (const sbo of sbos) {
    sbosMap[sbo.id] = {
      id: sbo.id,
      name: sbo.name,
      owner: sbo.owner,
      division: sbo.division,
      status: sbo.status,
      description: sbo.description,
      notes: sbo.notes,
      sortOrder: sbo.sortOrder,
      tasks: sbo.tasks.map((t) => ({
        id: t.id,
        text: t.text,
        description: t.description,
        owner: t.owner,
        due: t.due,
        endDate: t.endDate,
        status: t.status,
        priority: t.priority,
      })),
      meetings: sbo.meetings.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        date: m.date,
        endDate: m.endDate,
        attendees: m.attendees,
        agenda: m.agenda,
        notes: m.notes,
        actionItems: m.actionItems,
        transcript: m.transcript,
        recurrence: m.recurrence,
        recurrenceEnd: m.recurrenceEnd,
      })),
    };
  }

  const state = { initiatives: initiativesMap, sbos: sbosMap };
  const outPath = path.join(process.cwd(), "..", "data", "state.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(state, null, 2) + "\n");

  return {
    path: outPath,
    initiativeCount: initiatives.length,
    sboCount: sbos.length,
  };
}
