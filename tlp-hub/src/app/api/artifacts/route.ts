import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const artifacts = await prisma.artifact.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(artifacts);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
