import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ sboId: string }> }) {
  try {
    const { sboId } = await params;
    const body = await req.json();
    const meeting = await prisma.sboMeeting.create({
      data: {
        title: body.title || "",
        description: body.description || "",
        date: body.date || "",
        endDate: body.endDate || "",
        attendees: body.attendees || "",
        agenda: body.agenda || "",
        notes: body.notes || "",
        actionItems: body.actionItems || "",
        transcript: body.transcript || "",
        recurrence: body.recurrence || "none",
        recurrenceEnd: body.recurrenceEnd || "",
        sboId,
      },
    });
    return NextResponse.json(meeting, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
