import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; oid: string }> }) {
  const { oid } = await params;
  const body = await req.json();
  const obj = await prisma.objective.update({
    where: { id: oid },
    data: { complete: body.complete },
  });
  return NextResponse.json(obj);
}
