import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; tid: string }> }) {
  const { tid } = await params;
  const body = await req.json();
  const task = await prisma.task.update({
    where: { id: tid },
    data: {
      ...(body.text !== undefined && { text: body.text }),
      ...(body.owner !== undefined && { owner: body.owner }),
      ...(body.due !== undefined && { due: body.due }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
    },
  });
  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; tid: string }> }) {
  const { tid } = await params;
  await prisma.task.delete({ where: { id: tid } });
  return NextResponse.json({ ok: true });
}
