import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ sboId: string }> }) {
  const { sboId } = await params;
  const body = await req.json();
  const maxSort = await prisma.sboTask.aggregate({
    where: { sboId },
    _max: { sortOrder: true },
  });
  const task = await prisma.sboTask.create({
    data: {
      text: body.text || "",
      owner: body.owner || "",
      due: body.due || "",
      endDate: body.endDate || "",
      status: body.status || "not-started",
      priority: body.priority || "medium",
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      sboId,
    },
  });
  return NextResponse.json(task, { status: 201 });
}
