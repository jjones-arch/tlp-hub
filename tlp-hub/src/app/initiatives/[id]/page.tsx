import InitiativeDetailClient from "./InitiativeDetailClient";
import fs from "node:fs/promises";
import path from "node:path";

type StaticState = {
  initiatives?: Record<string, { id?: string }>;
};

async function loadStaticState(): Promise<StaticState | null> {
  const statePathCandidates = [
    path.join(process.cwd(), "data", "state.json"),
    path.join(process.cwd(), "..", "data", "state.json"),
  ];

  for (const statePath of statePathCandidates) {
    try {
      const contents = await fs.readFile(statePath, "utf-8");
      return JSON.parse(contents) as StaticState;
    } catch {
      // Try the next candidate path.
    }
  }

  return null;
}

export async function generateStaticParams() {
  const state = await loadStaticState();
  const initiatives = state?.initiatives ? Object.values(state.initiatives) : [];
  const initiativeIds = initiatives.map((initiative) => initiative.id).filter((id): id is string => Boolean(id));

  if (!initiativeIds.length) {
    return [{ id: "_" }];
  }

  return initiativeIds.map((id) => ({ id }));
}

export default function InitiativeDetailPage() {
  return <InitiativeDetailClient />;
}
