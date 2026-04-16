import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  ".md",
  ".json",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".zip",
]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const taskUpdateId = formData.get("taskUpdateId") as string;
    const files = formData.getAll("files") as File[];

    if (!taskUpdateId || files.length === 0) {
      return NextResponse.json({ error: "Missing taskUpdateId or files" }, { status: 400 });
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `File "${file.name}" exceeds the 10 MB size limit` }, { status: 400 });
      }
      const ext = path.extname(file.name).toLowerCase();
      if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json({ error: `File type "${ext}" is not allowed` }, { status: 400 });
      }
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
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
