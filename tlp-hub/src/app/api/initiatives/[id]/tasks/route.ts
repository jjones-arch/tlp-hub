import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const maxSort = await prisma.task.findFirst({ where: { initiativeId: id }, orderBy: { sortOrder: "desc" } });
  const task = await prisma.task.create({
    data: {
      id: uuid(),
      text: body.text,
      owner: body.owner || "",
      due: body.due || "",
      status: body.status || "not-started",
      priority: body.priority || "medium",
      sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      initiativeId: id,
    },
  });
  return NextResponse.json(task);
}
