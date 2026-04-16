import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const maxSort = await prisma.objective.findFirst({ where: { initiativeId: id }, orderBy: { sortOrder: "desc" } });
    const objective = await prisma.objective.create({
      data: {
        id: uuid(),
        text: body.text,
        description: body.description || "",
        complete: false,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
        initiativeId: id,
      },
    });
    return NextResponse.json(objective);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
