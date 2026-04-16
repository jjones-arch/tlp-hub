import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const meetings = await prisma.sboMeeting.findMany({
    orderBy: { date: "asc" },
    include: { sbo: { select: { id: true, name: true } } },
  });
  return NextResponse.json(meetings);
}
