import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

type Ctx = { params: Promise<{ sboId: string; taskId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { taskId } = await params;
    const updates = await prisma.sboTaskUpdate.findMany({
      where: { taskId },
      include: { attachments: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(updates);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { taskId } = await params;
    const body = await req.json();
    const update = await prisma.sboTaskUpdate.create({
      data: {
        id: uuid(),
        text: body.text || "",
        author: body.author || "",
        taskId,
      },
      include: { attachments: true },
    });
    return NextResponse.json(update);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
