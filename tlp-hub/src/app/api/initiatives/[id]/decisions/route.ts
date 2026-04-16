import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const decision = await prisma.decision.create({
      data: {
        id: uuid(),
        text: body.text,
        date: body.date || new Date().toISOString().slice(0, 10),
        initiativeId: id,
      },
    });
    return NextResponse.json(decision);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
