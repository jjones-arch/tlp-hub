import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const data = {
      initiatives: await prisma.initiative.findMany({
        include: { owners: true, objectives: true, tasks: true, risks: true, decisions: true },
      }),
      artifacts: await prisma.artifact.findMany(),
      transcripts: await prisma.transcript.findMany(),
      chatMessages: await prisma.chatMessage.findMany(),
      settings: (await prisma.setting.findMany()).map((s) => ({
        ...s,
        value: s.key === "apiKey" ? "[REDACTED]" : s.value,
      })),
    };
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, confirm: confirmToken } = await req.json();

    if (action === "reset") {
      if (confirmToken !== "CONFIRM_RESET") {
        return NextResponse.json(
          { error: 'Missing confirmation. Send { confirm: "CONFIRM_RESET" } to proceed.' },
          { status: 400 },
        );
      }

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
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
