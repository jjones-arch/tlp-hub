import { NextRequest, NextResponse } from "next/server";
import { callClaude, buildSystemPrompt } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, messages, artifactType, initiativeId, extra, transcriptContent } = body;

  try {
    const systemPrompt = await buildSystemPrompt();

    if (action === "chat") {
      const reply = await callClaude(messages, systemPrompt);
      await prisma.chatMessage.create({ data: { id: uuid(), role: "assistant", content: reply } });
      return NextResponse.json({ reply });
    }

    if (action === "focus") {
      const reply = await callClaude(
        [
          {
            role: "user" as const,
            content:
              "What should I focus on this week? Give me 4–5 specific, actionable priorities as a brief bulleted list. Be direct and specific to the actual tasks and risks in the program.",
          },
        ],
        systemPrompt,
      );
      return NextResponse.json({ reply });
    }

    if (action === "artifact") {
      const initCtx =
        initiativeId && initiativeId !== "all"
          ? (await prisma.initiative.findUnique({ where: { id: initiativeId } }))?.name
          : "all initiatives";
      const prompt = `Generate a complete, professional ${artifactType} for the Technology Lifecycle Program${initCtx ? " focused on " + initCtx : ""}. ${extra || ""} Use plain text formatting with clear sections. Be specific, practical, and grounded in the actual program details.`;
      const reply = await callClaude([{ role: "user" as const, content: prompt }], systemPrompt);
      const artifact = await prisma.artifact.create({
        data: {
          id: uuid(),
          type: artifactType,
          title: `${artifactType}${initiativeId && initiativeId !== "all" ? " — " + (initCtx || "").split(" ").slice(0, 3).join(" ") : ""}`,
          content: reply,
          initiativeId: initiativeId && initiativeId !== "all" ? initiativeId : null,
        },
      });
      return NextResponse.json({ artifact, content: reply });
    }

    if (action === "transcript") {
      const prompt = `Analyze this meeting transcript and extract:
1. ACTION ITEMS / TASKS: specific things people committed to do (with owner if mentioned)
2. DECISIONS: concrete decisions that were made
3. RISKS / CONCERNS: issues, blockers, or risks mentioned

Format your response as JSON exactly like this:
{"tasks":["task1","task2"],"decisions":["decision1"],"risks":["risk1"]}

Only include real, actionable items. Here is the transcript:

${(transcriptContent || "").substring(0, 6000)}`;

      const reply = await callClaude(
        [{ role: "user" as const, content: prompt }],
        "You are a meeting notes analyst. Extract structured data from transcripts. Always respond with valid JSON only.",
      );
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ extracted });
      }
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
