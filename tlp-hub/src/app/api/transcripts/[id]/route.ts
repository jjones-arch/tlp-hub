import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const transcript = await prisma.transcript.update({
    where: { id },
    data: { extracted: body.extracted ? JSON.stringify(body.extracted) : undefined },
  });
  return NextResponse.json(transcript);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.transcript.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
