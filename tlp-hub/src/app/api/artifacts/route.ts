import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const artifacts = await prisma.artifact.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(artifacts);
}
