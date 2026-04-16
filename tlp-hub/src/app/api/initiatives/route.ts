import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
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
}
