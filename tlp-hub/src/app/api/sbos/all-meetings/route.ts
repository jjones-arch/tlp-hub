import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const meetings = await prisma.sboMeeting.findMany({
      orderBy: { date: "asc" },
      include: { sbo: { select: { id: true, name: true } } },
    });
    return NextResponse.json(meetings);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
