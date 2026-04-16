import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export async function GET() {
  try {
    const transcripts = await prisma.transcript.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(transcripts);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const transcript = await prisma.transcript.create({
      data: {
        id: uuid(),
        name: body.name,
        content: body.content,
        lineCount: body.content.split("\n").filter((l: string) => l.trim()).length,
      },
    });
    return NextResponse.json(transcript);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
