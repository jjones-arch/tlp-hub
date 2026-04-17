import SboDetailClient from "./SboDetailClient";
import fs from "node:fs/promises";
import path from "node:path";

type StaticState = {
  sbos?: Record<string, { id?: string }>;
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
  const sbos = state?.sbos ? Object.values(state.sbos) : [];
  const sboIds = sbos.map((sbo) => sbo.id).filter((id): id is string => Boolean(id));

  if (!sboIds.length) {
    return [{ sboId: "_" }];
  }

  return sboIds.map((sboId) => ({ sboId }));
}

export default function SboDetailPage() {
  return <SboDetailClient />;
}
