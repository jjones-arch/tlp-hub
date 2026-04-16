import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const sbos = await prisma.sbo.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      tasks: { select: { id: true, status: true } },
      meetings: { select: { id: true, date: true, title: true }, orderBy: { date: "asc" } },
    },
  });

  const result = sbos.map((sbo) => ({
    ...sbo,
    taskCount: sbo.tasks.length,
    tasksDone: sbo.tasks.filter((t) => t.status === "complete").length,
    nextMeeting: sbo.meetings.find((m) => m.date >= new Date().toISOString().slice(0, 10)) ?? null,
    meetingCount: sbo.meetings.length,
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const body = await req.json();
  const maxSort = await prisma.sbo.aggregate({ _max: { sortOrder: true } });
  const sbo = await prisma.sbo.create({
    data: {
      name: body.name || "Untitled SBO",
      owner: body.owner || "",
      division: body.division || "",
      status: body.status || "on-track",
      description: body.description || "",
      notes: body.notes || "",
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json(sbo, { status: 201 });
}
