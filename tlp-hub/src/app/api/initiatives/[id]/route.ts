import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initiative = await prisma.initiative.findUnique({
    where: { id },
    include: {
      owners: true,
      objectives: { orderBy: { sortOrder: "asc" } },
      tasks: {
        orderBy: { sortOrder: "asc" },
        include: { updates: { include: { attachments: true }, orderBy: { createdAt: "desc" } } },
      },
      risks: true,
      decisions: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!initiative) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(initiative);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const initiative = await prisma.initiative.update({
    where: { id },
    data: {
      ...(body.progress !== undefined && { progress: body.progress }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });
  return NextResponse.json(initiative);
}
