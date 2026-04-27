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
    const normalizedAuthor = typeof body.author === "string" ? body.author.trim() : "";
    const update = await prisma.sboTaskUpdate.create({
      data: {
        id: uuid(),
        text: body.text || "",
        author: normalizedAuthor || "Unknown user",
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

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { taskId } = await params;
    const body = await req.json();

    const updateId = typeof body.updateId === "string" ? body.updateId : "";
    const nextText = typeof body.text === "string" ? body.text.trim() : "";
    const requester = typeof body.author === "string" ? body.author.trim().toLowerCase() : "";

    if (!updateId) return NextResponse.json({ error: "updateId is required" }, { status: 400 });
    if (!nextText) return NextResponse.json({ error: "text is required" }, { status: 400 });

    const existing = await prisma.sboTaskUpdate.findFirst({
      where: { id: updateId, taskId },
    });
    if (!existing) return NextResponse.json({ error: "Update not found" }, { status: 404 });

    if ((existing.author || "").trim().toLowerCase() !== requester) {
      return NextResponse.json({ error: "Only the original author can edit this update" }, { status: 403 });
    }

    const updated = await prisma.sboTaskUpdate.update({
      where: { id: updateId },
      data: { text: nextText },
      include: { attachments: true },
    });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
