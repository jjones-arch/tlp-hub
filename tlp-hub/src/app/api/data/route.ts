import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const data = {
    initiatives: await prisma.initiative.findMany({
      include: { owners: true, objectives: true, tasks: true, risks: true, decisions: true },
    }),
    artifacts: await prisma.artifact.findMany(),
    transcripts: await prisma.transcript.findMany(),
    chatMessages: await prisma.chatMessage.findMany(),
    settings: await prisma.setting.findMany(),
  };
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { action } = await req.json();

  if (action === "reset") {
    await prisma.chatMessage.deleteMany();
    await prisma.artifact.deleteMany();
    await prisma.transcript.deleteMany();
    await prisma.decision.deleteMany();
    await prisma.risk.deleteMany();
    await prisma.task.deleteMany();
    await prisma.objective.deleteMany();
    await prisma.initiativeOwner.deleteMany();
    await prisma.initiative.deleteMany();
    return NextResponse.json({ ok: true, message: "All data cleared. Re-run seed to restore defaults." });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
