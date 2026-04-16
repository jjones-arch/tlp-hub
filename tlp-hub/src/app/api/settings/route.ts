import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const settings = await prisma.setting.findMany();
  const obj: Record<string, string> = {};
  settings.forEach((s) => {
    obj[s.key] = s.key === "apiKey" ? (s.value ? "••••••••" : "") : s.value;
  });
  return NextResponse.json(obj);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: value as string },
      create: { key, value: value as string },
    });
  }
  return NextResponse.json({ ok: true });
}
