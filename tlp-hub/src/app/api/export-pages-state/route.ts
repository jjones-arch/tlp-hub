import { NextResponse } from "next/server";
import { writePublicPagesSnapshot } from "@/lib/exportPagesState";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in local development." }, { status: 403 });
  }

  try {
    const result = await writePublicPagesSnapshot();
    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
