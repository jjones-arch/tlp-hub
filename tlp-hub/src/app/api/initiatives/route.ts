import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const initiatives = await prisma.initiative.findMany({
      include: {
        owners: true,
        tasks: true,
        risks: true,
        objectives: true,
        decisions: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(initiatives);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
