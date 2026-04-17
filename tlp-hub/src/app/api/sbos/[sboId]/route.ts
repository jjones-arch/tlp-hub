import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ sboId: string }> }) {
  try {
    const { sboId } = await params;
    const sbo = await prisma.sbo.findUnique({
      where: { id: sboId },
      include: {
        tasks: {
          orderBy: { sortOrder: "asc" },
          include: { updates: { include: { attachments: true }, orderBy: { createdAt: "desc" } } },
        },
        meetings: { orderBy: { date: "asc" } },
      },
    });
    if (!sbo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(sbo);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ sboId: string }> }) {
  try {
    const { sboId } = await params;
    const body = await req.json();
    const allowed = ["name", "owner", "division", "status", "description", "notes", "sortOrder"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }
    const sbo = await prisma.sbo.update({ where: { id: sboId }, data });
    return NextResponse.json(sbo);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ sboId: string }> }) {
  try {
    const { sboId } = await params;
    await prisma.sbo.delete({ where: { id: sboId } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
