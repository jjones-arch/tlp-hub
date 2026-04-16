import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.initiative.findFirst();
  if (existing) {
    console.log("Seed data already exists, skipping.");
    return;
  }

  console.log("Seeding database...");

  // SBO Governance
  await prisma.initiative.create({
    data: {
      id: "sbo",
      name: "SBO Program Governance & Documentation",
      subtitle: "Making the SBO program durable, clear, and accountable",
      quarter: "Q2 2026",
      status: "on-track",
      progress: 30,
      description:
        "Q1 launched the SBO program with 95%+ vendor coverage across 14 accountable owners. Q2 is about making the program durable — establishing the Enterprise Software Committee, completing vendor mapping to 100%, documenting division-specific SBO processes, and defining how PIR integrates into the lifecycle.",
      notes:
        "Ryan Ostler's final SBO kickoff was March 30, 2026 — all SBO kickoffs are now complete.\n\nAlways use 'PIR' not 'PER' in meetings and documentation.\n\nEmbedded partners are managed by Todd Grierson in Finance (not JR) — coordinate with Todd for Q4 planning.",
      owners: {
        create: [{ name: "JoJo Jones" }, { name: "Melissa Boud" }],
      },
      objectives: {
        create: [
          { text: "Establish the Enterprise Software Committee with Dave Petersen as chair", sortOrder: 0 },
          { text: "Complete vendor-to-SBO mapping from 95% to 100% (~15 orphan systems remaining)", sortOrder: 1 },
          { text: "Document SBO processes with division-level specificity (Revenue: monthly; Finance: case-by-case; BI: twice/year)", sortOrder: 2 },
          { text: "Define and document PIR integration criteria with Fadi so SBO guidance can be finalized", sortOrder: 3 },
          { text: "Every SBO knows their budget and receives alerts when approaching or exceeding it", sortOrder: 4 },
        ],
      },
      tasks: {
        create: [
          { text: "Prepare Enterprise Software Committee communications for Dave to use with C-suite", owner: "JoJo Jones", status: "in-progress", priority: "high", sortOrder: 0 },
          { text: "Document PIR touchpoints and clarify where TLP/SBO involvement begins (Fadi meeting)", owner: "JoJo Jones", due: "2026-04-15", status: "in-progress", priority: "high", sortOrder: 1 },
          { text: "Identify remaining ~15 orphan software systems and assign SBO owners", owner: "JoJo Jones, Melissa Boud", status: "not-started", priority: "medium", sortOrder: 2 },
          { text: "Dave to review SBO training draft", owner: "Dave Petersen", status: "not-started", priority: "high", sortOrder: 3 },
          { text: "Record SBO training video after Dave's feedback", owner: "Melissa Boud", status: "blocked", priority: "medium", sortOrder: 4 },
          { text: "Alan Roper to develop budget visibility approach for SBOs", owner: "Alan Roper", status: "in-progress", priority: "high", sortOrder: 5 },
          { text: "Follow up with Dave on Leadership Summit status; pivot comms if summit is canceled", owner: "JoJo Jones", status: "not-started", priority: "medium", sortOrder: 6 },
          { text: "Share SBO reporting snapshot with leadership (Ryan Packer)", owner: "JoJo Jones, Melissa Boud, Dave Petersen", status: "not-started", priority: "medium", sortOrder: 7 },
        ],
      },
      risks: {
        create: [
          { title: "PIR/TLP boundaries still undefined", description: "Exact handoff points and architect-review criteria not yet documented; can delay SBO guidance finalization.", likelihood: "medium", impact: "high", mitigation: "Meeting with Fadi in progress. JoJo to document criteria after meeting." },
          { title: "SBO budget visibility incomplete", description: "SBOs held accountable for portfolio spend without knowing their true budget position.", likelihood: "high", impact: "medium", mitigation: "Alan Roper developing approach to surface budget and forecast numbers." },
          { title: "Leadership Summit may be canceled", description: "If summit is canceled, program loses its planned broad communication vehicle.", likelihood: "medium", impact: "medium", mitigation: "JoJo to follow up with Dave and identify alternative communication path." },
          { title: "Enterprise Software Committee scope creep", description: "Risk that the committee takes on decisions outside enterprise-level scope.", likelihood: "low", impact: "medium", mitigation: "Document clear decision criteria before committee launches." },
        ],
      },
      decisions: {
        create: [
          { text: 'Committee renamed to "Enterprise Software Committee" — better reflects function than "Steering Committee"', date: "2026-03-26" },
          { text: "Dave Petersen will chair the Enterprise Software Committee", date: "2026-03-26" },
          { text: "Committee representation varies by division; not all SBOs will serve", date: "2026-03-26" },
          { text: "95%+ of ~300 vendors mapped to 14 accountable owners confirmed as Q1 win", date: "2026-04-09" },
          { text: "TLP's budget role is visibility and accountability — not promising spend reduction targets", date: "2026-03-26" },
        ],
      },
    },
  });

  // Reporting
  await prisma.initiative.create({
    data: {
      id: "reporting",
      name: "Reporting & Accountability",
      subtitle: "Establishing consistent, repeatable data collection and accountability structures",
      quarter: "Q2 2026",
      status: "at-risk",
      progress: 10,
      description:
        "Reporting was a Q1 initiative that was not achieved. Q2 approach: Jessi will manually collect and track data while Zipped is being built. Goal is to establish data collection habits and accountability structures now — even before automation — and build toward SLA tracking.",
      notes:
        "The two biggest blockers are: (1) Jira's lack of reporting quality, and (2) inability to tie Jira data to Coupa data. Zipped is the long-term solution to both.\n\nJessi owns this initiative end-to-end in Q2.",
      owners: {
        create: [{ name: "Jessi Duffin" }],
      },
      objectives: {
        create: [
          { text: "Establish consistent manual data collection habits by mid-Q2", sortOrder: 0 },
          { text: "Define and align on the Q2 metrics that matter most", sortOrder: 1 },
          { text: "Build toward SLA tracking and the ability to identify areas for improvement", sortOrder: 2 },
          { text: "Establish accountability structures before automation exists", sortOrder: 3 },
        ],
      },
      tasks: {
        create: [
          { text: "Manually collect and track technology request data throughout Q2", owner: "Jessi Duffin", due: "2026-06-30", status: "in-progress", priority: "high", sortOrder: 0 },
          { text: "Align with JoJo and Dave on which Q2 metrics matter most", owner: "Jessi Duffin, JoJo Jones", status: "not-started", priority: "high", sortOrder: 1 },
          { text: "Continue routing tech requests through intake; send to SBOs for approval when needed", owner: "Jessi Duffin", status: "in-progress", priority: "medium", sortOrder: 2 },
          { text: "Document current manual data collection process so it can be automated in Zipped later", owner: "Jessi Duffin", status: "not-started", priority: "medium", sortOrder: 3 },
        ],
      },
      risks: {
        create: [
          { title: "Q1 pattern may repeat", description: "Reporting was not achieved in Q1; without structural change the same result is possible in Q2.", likelihood: "medium", impact: "high", mitigation: "Shifted strategy: manual collection first, Zipped automation later. Jessi owns this fully." },
          { title: "Jira lacks reporting capability", description: "Jira does not provide the reporting quality needed to track SLAs or identify patterns.", likelihood: "high", impact: "high", mitigation: "Manual collection in Q2; Zipped will replace Jira for reporting in Q3+." },
          { title: "Jira and Coupa data not connected", description: "Request data in Jira and financial data in Coupa cannot be tied together for unified reporting.", likelihood: "high", impact: "medium", mitigation: "Zipped prototype will eventually bridge or replace both." },
          { title: "Accountability without data", description: "Cannot meaningfully enforce SLAs until reliable, consistent data exists.", likelihood: "medium", impact: "high", mitigation: "Q2 focus is building the data foundation; enforcement follows in Q3." },
        ],
      },
      decisions: {
        create: [
          { text: "Q2 approach: manual data collection by Jessi while Zipped is built — do not wait for a perfect system", date: "2026-04-09" },
          { text: "Reporting will not drive accountability until reliable, consistent data exists", date: "2026-04-09" },
          { text: "Moving away from one giant aggregate report; focus on concrete SBO program outcomes first", date: "2026-03-26" },
        ],
      },
    },
  });

  // Zipped
  await prisma.initiative.create({
    data: {
      id: "zipped",
      name: "Zipped — Workflow Automation Prototype",
      subtitle: "Building an AI-powered intake and document collection prototype",
      quarter: "Q2 2026",
      status: "on-track",
      progress: 25,
      description:
        "The Jira rebuild was stalled by Ryan's departure. Zipped is an AI-built prototype for automation, reporting, and improved workflows. Q2 commitment: deliver a working prototype for document collection by end of Q2. If it proves valuable, it gets handed to engineering for production.",
      notes:
        '"Zipped" is the working title (previously called "Zip-like experience" or "vibe-coded prototype").\n\nTier 0 software (product-embedded) follows the same security/legal/privacy workflow as third-party vendors but is governed by separate Product/Engineering lifecycle policies — consider in Q3 scope.\n\nCoupa owner needs to be identified before Q5 planning begins.',
      owners: {
        create: [{ name: "JoJo Jones" }, { name: "Jessi Duffin" }],
      },
      objectives: {
        create: [
          { text: "Deliver working prototype for document collection by end of Q2", sortOrder: 0 },
          { text: "Build basic intake process with vendor request portal", complete: true, sortOrder: 1 },
          { text: "Automate workflows for security, privacy/AI, and legal review", sortOrder: 2 },
          { text: "Build transition logic into Coupa for evaluation decisions", sortOrder: 3 },
          { text: "Add timestamps for reporting and process-state tracking", sortOrder: 4 },
        ],
      },
      tasks: {
        create: [
          { text: "Continue building vendor request portal (current primary focus)", owner: "JoJo Jones, Jessi Duffin", status: "in-progress", priority: "high", sortOrder: 0 },
          { text: "Add timestamps for reporting and activity tracking", owner: "JoJo Jones", status: "not-started", priority: "high", sortOrder: 1 },
          { text: "Restore business owner field in the intake form", owner: "JoJo Jones", status: "not-started", priority: "medium", sortOrder: 2 },
          { text: "Resolve database and hosting needs for the prototype", owner: "JoJo Jones", status: "not-started", priority: "high", sortOrder: 3 },
          { text: "Explore connection between Zipped and Melissa's AI workflow", owner: "Melissa Boud, JoJo Jones, Jessi Duffin", status: "not-started", priority: "low", sortOrder: 4 },
          { text: "Add MNDA / trust-center first step before deeper document collection", owner: "JoJo Jones", status: "not-started", priority: "medium", sortOrder: 5 },
          { text: "Build automated security, privacy/AI, and legal workflows", owner: "JoJo Jones, Jessi Duffin", due: "2026-06-30", status: "not-started", priority: "high", sortOrder: 6 },
        ],
      },
      risks: {
        create: [
          { title: "No production infrastructure defined", description: "Database, hosting, email flow, and legal storage details are unresolved for the prototype.", likelihood: "high", impact: "high", mitigation: "Prioritize resolving database and hosting decisions early in Q2." },
          { title: "Prototype reporting incomplete", description: "Timestamps and process-state tracking not yet in place; cannot generate reliable metrics.", likelihood: "high", impact: "medium", mitigation: "Add timestamps before building more complex workflows." },
          { title: "Scope could exceed Q2 capacity", description: "Neither JoJo nor Jessi has built a production app before; scope risk is real.", likelihood: "medium", impact: "high", mitigation: "Commit to document collection prototype only for Q2; defer to Q3." },
          { title: "Engineering handoff path undefined", description: "Path from prototype to production handoff not scoped or approved.", likelihood: "medium", impact: "medium", mitigation: 'Frame Q2 as "validate the concept" — engineering conversation is Q3.' },
        ],
      },
      decisions: {
        create: [
          { text: "Zipped replaces the Jira rebuild as the primary engineering initiative after Ryan's departure", date: "2026-04-09" },
          { text: "Q2 commitment is document collection prototype only — not the full Zipped vision", date: "2026-04-09" },
          { text: "First build focus is vendor request portal (external-facing document collection)", date: "2026-03-26" },
          { text: "Prototype should capture MNDA / trust-center step before deeper document collection", date: "2026-03-26" },
          { text: "If prototype proves valuable, will be handed to engineering for production development", date: "2026-04-09" },
        ],
      },
    },
  });

  // Default settings
  await prisma.setting.createMany({
    data: [
      { key: "apiKey", value: "" },
      { key: "model", value: "claude-sonnet-4-6" },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
