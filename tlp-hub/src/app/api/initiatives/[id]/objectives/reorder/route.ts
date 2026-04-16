import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orderedIds } = (await req.json()) as { orderedIds: string[] };

  await Promise.all(
    orderedIds.map((oid, index) =>
      prisma.objective.update({
        where: { id: oid, initiativeId: id },
        data: { sortOrder: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
