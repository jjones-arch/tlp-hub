import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const VALID_RECURRENCES = new Set([
  "none",
  "weekly",
  "biweekly",
  "monthly",
  "monthly_nth_weekday",
  "quarterly",
  "yearly",
]);

function normalizeDateValue(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function normalizeTextValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function PATCH(req: Request, { params }: { params: Promise<{ sboId: string; meetingId: string }> }) {
  try {
    const { meetingId } = await params;
    const body = await req.json();
    const existing = await prisma.sboMeeting.findUnique({ where: { id: meetingId } });
    if (!existing) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    const allowed = [
      "title",
      "description",
      "date",
      "endDate",
      "attendees",
      "agenda",
      "notes",
      "actionItems",
      "transcript",
      "recurrence",
      "recurrenceEnd",
    ];
    const data: Record<string, string> = {};
    for (const key of allowed) {
      if (!(key in body)) continue;
      if (key === "date" || key === "endDate" || key === "recurrenceEnd") {
        data[key] = normalizeDateValue(body[key]);
        continue;
      }
      if (key === "recurrence") {
        const recurrence = normalizeTextValue(body[key]);
        data[key] = VALID_RECURRENCES.has(recurrence) ? recurrence : "none";
        continue;
      }
      data[key] = normalizeTextValue(body[key]);
    }

    // Keep recurrence fields coherent while allowing open-ended recurring meetings.
    const nextRecurrence = data.recurrence ?? existing.recurrence;

    if (nextRecurrence === "none") {
      data.recurrenceEnd = "";
    } else if (!("recurrenceEnd" in data)) {
      // If recurrence was just enabled and no explicit end date was supplied, keep it open-ended.
      if ("recurrence" in data && existing.recurrence === "none") {
        data.recurrenceEnd = "";
      } else {
        data.recurrenceEnd = existing.recurrenceEnd || "";
      }
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
