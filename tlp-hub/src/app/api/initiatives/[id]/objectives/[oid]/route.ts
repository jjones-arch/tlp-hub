import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; oid: string }> }) {
  try {
    const { oid } = await params;
    const body = await req.json();
    const obj = await prisma.objective.update({
      where: { id: oid },
      data: {
        ...(body.complete !== undefined && { complete: body.complete }),
        ...(body.text !== undefined && { text: body.text }),
        ...(body.description !== undefined && { description: body.description }),
      },
    });
    return NextResponse.json(obj);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; oid: string }> }) {
  try {
    const { oid } = await params;
    await prisma.objective.delete({ where: { id: oid } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
