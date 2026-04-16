import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ sboId: string; taskId: string }> }) {
  try {
    const { taskId } = await params;
    const body = await req.json();
    const allowed = ["text", "owner", "due", "endDate", "status", "priority", "sortOrder"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }
    const task = await prisma.sboTask.update({ where: { id: taskId }, data });
    return NextResponse.json(task);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ sboId: string; taskId: string }> }) {
  try {
    const { taskId } = await params;
    await prisma.sboTask.delete({ where: { id: taskId } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
