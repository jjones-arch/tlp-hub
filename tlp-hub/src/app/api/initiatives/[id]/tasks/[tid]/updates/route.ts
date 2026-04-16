import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

type Ctx = { params: Promise<{ id: string; tid: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { tid } = await params;
  const updates = await prisma.taskUpdate.findMany({
    where: { taskId: tid },
    include: { attachments: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(updates);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { tid } = await params;
  const body = await req.json();
  const update = await prisma.taskUpdate.create({
    data: {
      id: uuid(),
      text: body.text || "",
      author: body.author || "",
      taskId: tid,
    },
    include: { attachments: true },
  });
  return NextResponse.json(update);
}
