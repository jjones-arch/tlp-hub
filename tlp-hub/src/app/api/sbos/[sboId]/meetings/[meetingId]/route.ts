import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ sboId: string; meetingId: string }> }) {
  try {
    const { meetingId } = await params;
    const body = await req.json();
    const allowed = [
      "title",
      "description",
      "date",
      "endDate",
      "attendees",
      "agenda",
      "notes",
      "actionItems",
      "recurrence",
      "recurrenceEnd",
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }
    const meeting = await prisma.sboMeeting.update({ where: { id: meetingId }, data });
    return NextResponse.json(meeting);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ sboId: string; meetingId: string }> }) {
  try {
    const { meetingId } = await params;
    await prisma.sboMeeting.delete({ where: { id: meetingId } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
