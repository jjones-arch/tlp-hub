import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./db";
import { DEFAULT_AI_MODEL } from "./constants";

async function getApiKey(): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key: "apiKey" } });
  return setting?.value || process.env.ANTHROPIC_API_KEY || "";
}

async function getModel(): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key: "model" } });
  return setting?.value || DEFAULT_AI_MODEL;
}

export async function callClaude(
  messages: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string,
): Promise<string> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("No API key configured. Add your Anthropic API key in Settings.");

  const client = new Anthropic({ apiKey });
  const model = await getModel();

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  const block = response.content[0];
  if (block.type === "text") return block.text;
  throw new Error("Unexpected response format");
}

export async function buildSystemPrompt(): Promise<string> {
  const initiatives = await prisma.initiative.findMany({
    include: {
      owners: true,
      objectives: { orderBy: { sortOrder: "asc" } },
      tasks: { orderBy: { sortOrder: "asc" } },
      risks: true,
      decisions: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const initSummary = initiatives
    .map((i) => {
      const openTasks = i.tasks.filter((t) => t.status !== "complete");
      const highRisks = i.risks.filter((r) => r.impact === "high");
      const highPrioOpen = i.tasks.filter((t) => t.priority === "high" && t.status !== "complete");

      return `## ${i.name}
Status: ${i.status} | Progress: ${i.progress}% | Owner: ${i.owners.map((o) => o.name).join(", ")}
Description: ${i.description}
Open High-Priority Tasks: ${highPrioOpen.map((t) => `"${t.text}" (${t.status}, owner: ${t.owner})`).join("; ") || "none"}
All Open Tasks (${openTasks.length}): ${openTasks.map((t) => `"${t.text}" [${t.status}/${t.priority}]`).join("; ")}
High-Impact Risks: ${highRisks.map((r) => `"${r.title}" — ${r.description}`).join("; ") || "none"}
Recent Decisions: ${i.decisions.map((d) => `"${d.text}" (${d.date})`).join("; ")}
Notes: ${i.notes}`;
    })
    .join("\n\n");

  return `You are an AI assistant for Jordan "JoJo" Jones, a Program Manager at BambooHR managing the Technology Lifecycle Program (TLP). Today is ${today}.

The TLP is a Q2 2026 program with three active initiatives. You have full context on all of them. Be direct, specific, and practical. When giving priorities or recommendations, reference actual tasks and risks by name. Keep responses concise unless asked for detail.

KEY ACRONYMS: TLP = Technology Lifecycle Program | SBO = System Business Owner | PIR = Platform Integration Review | ESC = Enterprise Software Committee

TEAM: JoJo Jones (program lead), Jessi Duffin (team member), Melissa Boud (team member), Dave Petersen (VP/exec sponsor), Alan Roper (finance), Fadi (system architect/IT), Ryan Packer (leadership)

${initSummary}`;
}
