import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const taskUpdateId = formData.get("taskUpdateId") as string;
  const files = formData.getAll("files") as File[];

  if (!taskUpdateId || files.length === 0) {
    return NextResponse.json({ error: "Missing taskUpdateId or files" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const attachments = [];

  for (const file of files) {
    const ext = path.extname(file.name) || "";
    const storedName = `${uuid()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, storedName), buffer);

    const attachment = await prisma.taskAttachment.create({
      data: {
        id: uuid(),
        filename: file.name,
        storedName,
        mimeType: file.type || "",
        size: file.size,
        taskUpdateId,
      },
    });
    attachments.push(attachment);
  }

  return NextResponse.json(attachments);
}
