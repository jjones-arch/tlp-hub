import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const tasks = await prisma.sboTask.findMany({
    orderBy: { sortOrder: "asc" },
    include: { sbo: { select: { id: true, name: true } } },
  });
  return NextResponse.json(tasks);
}
