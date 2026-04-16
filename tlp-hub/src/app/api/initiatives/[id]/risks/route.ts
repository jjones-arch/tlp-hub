import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const risk = await prisma.risk.create({
    data: {
      id: uuid(),
      title: body.title,
      description: body.description || "",
      likelihood: body.likelihood || "medium",
      impact: body.impact || "medium",
      mitigation: body.mitigation || "",
      initiativeId: id,
    },
  });
  return NextResponse.json(risk);
}
