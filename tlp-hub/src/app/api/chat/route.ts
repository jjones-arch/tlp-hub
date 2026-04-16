import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const messages = await prisma.chatMessage.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(messages);
}

export async function DELETE() {
  await prisma.chatMessage.deleteMany();
  return NextResponse.json({ ok: true });
}
