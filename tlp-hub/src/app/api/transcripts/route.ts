import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export async function GET() {
  const transcripts = await prisma.transcript.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(transcripts);
}

export async function POST(req: NextRequest) {
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
}
