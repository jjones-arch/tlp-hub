import Database from "better-sqlite3";
import path from "path";
import { v4 as uuid } from "uuid";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
console.log("DB path:", dbPath);

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS Initiative (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  quarter TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'on-track',
  progress INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
  updatedAt DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS InitiativeOwner (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initiativeId TEXT NOT NULL,
  FOREIGN KEY (initiativeId) REFERENCES Initiative(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Objective (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  complete INTEGER NOT NULL DEFAULT 0,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  initiativeId TEXT NOT NULL,
  FOREIGN KEY (initiativeId) REFERENCES Initiative(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Task (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT '',
  due TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'not-started',
  priority TEXT NOT NULL DEFAULT 'medium',
  sortOrder INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
  initiativeId TEXT NOT NULL,
  FOREIGN KEY (initiativeId) REFERENCES Initiative(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Risk (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  likelihood TEXT NOT NULL DEFAULT 'medium',
  impact TEXT NOT NULL DEFAULT 'medium',
  mitigation TEXT NOT NULL DEFAULT '',
  initiativeId TEXT NOT NULL,
  FOREIGN KEY (initiativeId) REFERENCES Initiative(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Decision (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  date TEXT NOT NULL DEFAULT '',
  createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
  initiativeId TEXT NOT NULL,
  FOREIGN KEY (initiativeId) REFERENCES Initiative(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Artifact (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
  initiativeId TEXT
);

CREATE TABLE IF NOT EXISTS Transcript (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  lineCount INTEGER NOT NULL DEFAULT 0,
  extracted TEXT,
  createdAt DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ChatMessage (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Setting (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
`);

console.log("Tables created.");

// Check if seed data exists
const existing = db.prepare("SELECT id FROM Initiative LIMIT 1").get();
if (existing) {
  console.log("Seed data exists, skipping.");
  db.close();
  process.exit(0);
}

function seed() {
  const insertInit = db.prepare(`INSERT INTO Initiative (id, name, subtitle, quarter, status, progress, description, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertOwner = db.prepare(`INSERT INTO InitiativeOwner (id, name, initiativeId) VALUES (?, ?, ?)`);
  const insertObj = db.prepare(`INSERT INTO Objective (id, text, complete, sortOrder, initiativeId) VALUES (?, ?, ?, ?, ?)`);
  const insertTask = db.prepare(`INSERT INTO Task (id, text, owner, due, status, priority, sortOrder, initiativeId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertRisk = db.prepare(`INSERT INTO Risk (id, title, description, likelihood, impact, mitigation, initiativeId) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const insertDecision = db.prepare(`INSERT INTO Decision (id, text, date, initiativeId) VALUES (?, ?, ?, ?)`);
  const insertSetting = db.prepare(`INSERT OR IGNORE INTO Setting (key, value) VALUES (?, ?)`);

  const txn = db.transaction(() => {
    // SBO
    insertInit.run("sbo", "SBO Program Governance & Documentation", "Making the SBO program durable, clear, and accountable", "Q2 2026", "on-track", 30,
      "Q1 launched the SBO program with 95%+ vendor coverage across 14 accountable owners. Q2 is about making the program durable — establishing the Enterprise Software Committee, completing vendor mapping to 100%, documenting division-specific SBO processes, and defining how PIR integrates into the lifecycle.",
      "Ryan Ostler's final SBO kickoff was March 30, 2026 — all SBO kickoffs are now complete.\n\nAlways use 'PIR' not 'PER' in meetings and documentation.\n\nEmbedded partners are managed by Todd Grierson in Finance (not JR) — coordinate with Todd for Q4 planning.");

    insertOwner.run(uuid(), "JoJo Jones", "sbo");
    insertOwner.run(uuid(), "Melissa Boud", "sbo");

    insertObj.run(uuid(), "Establish the Enterprise Software Committee with Dave Petersen as chair", 0, 0, "sbo");
    insertObj.run(uuid(), "Complete vendor-to-SBO mapping from 95% to 100% (~15 orphan systems remaining)", 0, 1, "sbo");
    insertObj.run(uuid(), "Document SBO processes with division-level specificity (Revenue: monthly; Finance: case-by-case; BI: twice/year)", 0, 2, "sbo");
    insertObj.run(uuid(), "Define and document PIR integration criteria with Fadi so SBO guidance can be finalized", 0, 3, "sbo");
    insertObj.run(uuid(), "Every SBO knows their budget and receives alerts when approaching or exceeding it", 0, 4, "sbo");

    insertTask.run(uuid(), "Prepare Enterprise Software Committee communications for Dave to use with C-suite", "JoJo Jones", "", "in-progress", "high", 0, "sbo");
    insertTask.run(uuid(), "Document PIR touchpoints and clarify where TLP/SBO involvement begins (Fadi meeting)", "JoJo Jones", "2026-04-15", "in-progress", "high", 1, "sbo");
    insertTask.run(uuid(), "Identify remaining ~15 orphan software systems and assign SBO owners", "JoJo Jones, Melissa Boud", "", "not-started", "medium", 2, "sbo");
    insertTask.run(uuid(), "Dave to review SBO training draft", "Dave Petersen", "", "not-started", "high", 3, "sbo");
    insertTask.run(uuid(), "Record SBO training video after Dave's feedback", "Melissa Boud", "", "blocked", "medium", 4, "sbo");
    insertTask.run(uuid(), "Alan Roper to develop budget visibility approach for SBOs", "Alan Roper", "", "in-progress", "high", 5, "sbo");
    insertTask.run(uuid(), "Follow up with Dave on Leadership Summit status; pivot comms if summit is canceled", "JoJo Jones", "", "not-started", "medium", 6, "sbo");
    insertTask.run(uuid(), "Share SBO reporting snapshot with leadership (Ryan Packer)", "JoJo Jones, Melissa Boud, Dave Petersen", "", "not-started", "medium", 7, "sbo");

    insertRisk.run(uuid(), "PIR/TLP boundaries still undefined", "Exact handoff points and architect-review criteria not yet documented; can delay SBO guidance finalization.", "medium", "high", "Meeting with Fadi in progress. JoJo to document criteria after meeting.", "sbo");
    insertRisk.run(uuid(), "SBO budget visibility incomplete", "SBOs held accountable for portfolio spend without knowing their true budget position.", "high", "medium", "Alan Roper developing approach to surface budget and forecast numbers.", "sbo");
    insertRisk.run(uuid(), "Leadership Summit may be canceled", "If summit is canceled, program loses its planned broad communication vehicle.", "medium", "medium", "JoJo to follow up with Dave and identify alternative communication path.", "sbo");
    insertRisk.run(uuid(), "Enterprise Software Committee scope creep", "Risk that the committee takes on decisions outside enterprise-level scope.", "low", "medium", "Document clear decision criteria before committee launches.", "sbo");

    insertDecision.run(uuid(), 'Committee renamed to "Enterprise Software Committee" — better reflects function than "Steering Committee"', "2026-03-26", "sbo");
    insertDecision.run(uuid(), "Dave Petersen will chair the Enterprise Software Committee", "2026-03-26", "sbo");
    insertDecision.run(uuid(), "Committee representation varies by division; not all SBOs will serve", "2026-03-26", "sbo");
    insertDecision.run(uuid(), "95%+ of ~300 vendors mapped to 14 accountable owners confirmed as Q1 win", "2026-04-09", "sbo");
    insertDecision.run(uuid(), "TLP's budget role is visibility and accountability — not promising spend reduction targets", "2026-03-26", "sbo");

    // Reporting
    insertInit.run("reporting", "Reporting & Accountability", "Establishing consistent, repeatable data collection and accountability structures", "Q2 2026", "at-risk", 10,
      "Reporting was a Q1 initiative that was not achieved. Q2 approach: Jessi will manually collect and track data while Zipped is being built. Goal is to establish data collection habits and accountability structures now — even before automation — and build toward SLA tracking.",
      "The two biggest blockers are: (1) Jira's lack of reporting quality, and (2) inability to tie Jira data to Coupa data. Zipped is the long-term solution to both.\n\nJessi owns this initiative end-to-end in Q2.");

    insertOwner.run(uuid(), "Jessi Duffin", "reporting");

    insertObj.run(uuid(), "Establish consistent manual data collection habits by mid-Q2", 0, 0, "reporting");
    insertObj.run(uuid(), "Define and align on the Q2 metrics that matter most", 0, 1, "reporting");
    insertObj.run(uuid(), "Build toward SLA tracking and the ability to identify areas for improvement", 0, 2, "reporting");
    insertObj.run(uuid(), "Establish accountability structures before automation exists", 0, 3, "reporting");

    insertTask.run(uuid(), "Manually collect and track technology request data throughout Q2", "Jessi Duffin", "2026-06-30", "in-progress", "high", 0, "reporting");
    insertTask.run(uuid(), "Align with JoJo and Dave on which Q2 metrics matter most", "Jessi Duffin, JoJo Jones", "", "not-started", "high", 1, "reporting");
    insertTask.run(uuid(), "Continue routing tech requests through intake; send to SBOs for approval when needed", "Jessi Duffin", "", "in-progress", "medium", 2, "reporting");
    insertTask.run(uuid(), "Document current manual data collection process so it can be automated in Zipped later", "Jessi Duffin", "", "not-started", "medium", 3, "reporting");

    insertRisk.run(uuid(), "Q1 pattern may repeat", "Reporting was not achieved in Q1; without structural change the same result is possible in Q2.", "medium", "high", "Shifted strategy: manual collection first, Zipped automation later. Jessi owns this fully.", "reporting");
    insertRisk.run(uuid(), "Jira lacks reporting capability", "Jira does not provide the reporting quality needed to track SLAs or identify patterns.", "high", "high", "Manual collection in Q2; Zipped will replace Jira for reporting in Q3+.", "reporting");
    insertRisk.run(uuid(), "Jira and Coupa data not connected", "Request data in Jira and financial data in Coupa cannot be tied together for unified reporting.", "high", "medium", "Zipped prototype will eventually bridge or replace both.", "reporting");
    insertRisk.run(uuid(), "Accountability without data", "Cannot meaningfully enforce SLAs until reliable, consistent data exists.", "medium", "high", "Q2 focus is building the data foundation; enforcement follows in Q3.", "reporting");

    insertDecision.run(uuid(), "Q2 approach: manual data collection by Jessi while Zipped is built — do not wait for a perfect system", "2026-04-09", "reporting");
    insertDecision.run(uuid(), "Reporting will not drive accountability until reliable, consistent data exists", "2026-04-09", "reporting");
    insertDecision.run(uuid(), "Moving away from one giant aggregate report; focus on concrete SBO program outcomes first", "2026-03-26", "reporting");

    // Zipped
    insertInit.run("zipped", "Zipped — Workflow Automation Prototype", "Building an AI-powered intake and document collection prototype", "Q2 2026", "on-track", 25,
      "The Jira rebuild was stalled by Ryan's departure. Zipped is an AI-built prototype for automation, reporting, and improved workflows. Q2 commitment: deliver a working prototype for document collection by end of Q2. If it proves valuable, it gets handed to engineering for production.",
      '"Zipped" is the working title (previously called "Zip-like experience" or "vibe-coded prototype").\n\nTier 0 software (product-embedded) follows the same security/legal/privacy workflow as third-party vendors but is governed by separate Product/Engineering lifecycle policies — consider in Q3 scope.\n\nCoupa owner needs to be identified before Q5 planning begins.');

    insertOwner.run(uuid(), "JoJo Jones", "zipped");
    insertOwner.run(uuid(), "Jessi Duffin", "zipped");

    insertObj.run(uuid(), "Deliver working prototype for document collection by end of Q2", 0, 0, "zipped");
    insertObj.run(uuid(), "Build basic intake process with vendor request portal", 1, 1, "zipped");
    insertObj.run(uuid(), "Automate workflows for security, privacy/AI, and legal review", 0, 2, "zipped");
    insertObj.run(uuid(), "Build transition logic into Coupa for evaluation decisions", 0, 3, "zipped");
    insertObj.run(uuid(), "Add timestamps for reporting and process-state tracking", 0, 4, "zipped");

    insertTask.run(uuid(), "Continue building vendor request portal (current primary focus)", "JoJo Jones, Jessi Duffin", "", "in-progress", "high", 0, "zipped");
    insertTask.run(uuid(), "Add timestamps for reporting and activity tracking", "JoJo Jones", "", "not-started", "high", 1, "zipped");
    insertTask.run(uuid(), "Restore business owner field in the intake form", "JoJo Jones", "", "not-started", "medium", 2, "zipped");
    insertTask.run(uuid(), "Resolve database and hosting needs for the prototype", "JoJo Jones", "", "not-started", "high", 3, "zipped");
    insertTask.run(uuid(), "Explore connection between Zipped and Melissa's AI workflow", "Melissa Boud, JoJo Jones, Jessi Duffin", "", "not-started", "low", 4, "zipped");
    insertTask.run(uuid(), "Add MNDA / trust-center first step before deeper document collection", "JoJo Jones", "", "not-started", "medium", 5, "zipped");
    insertTask.run(uuid(), "Build automated security, privacy/AI, and legal workflows", "JoJo Jones, Jessi Duffin", "2026-06-30", "not-started", "high", 6, "zipped");

    insertRisk.run(uuid(), "No production infrastructure defined", "Database, hosting, email flow, and legal storage details are unresolved for the prototype.", "high", "high", "Prioritize resolving database and hosting decisions early in Q2.", "zipped");
    insertRisk.run(uuid(), "Prototype reporting incomplete", "Timestamps and process-state tracking not yet in place; cannot generate reliable metrics.", "high", "medium", "Add timestamps before building more complex workflows.", "zipped");
    insertRisk.run(uuid(), "Scope could exceed Q2 capacity", "Neither JoJo nor Jessi has built a production app before; scope risk is real.", "medium", "high", "Commit to document collection prototype only for Q2; defer to Q3.", "zipped");
    insertRisk.run(uuid(), "Engineering handoff path undefined", "Path from prototype to production handoff not scoped or approved.", "medium", "medium", 'Frame Q2 as "validate the concept" — engineering conversation is Q3.', "zipped");

    insertDecision.run(uuid(), "Zipped replaces the Jira rebuild as the primary engineering initiative after Ryan's departure", "2026-04-09", "zipped");
    insertDecision.run(uuid(), "Q2 commitment is document collection prototype only — not the full Zipped vision", "2026-04-09", "zipped");
    insertDecision.run(uuid(), "First build focus is vendor request portal (external-facing document collection)", "2026-03-26", "zipped");
    insertDecision.run(uuid(), "Prototype should capture MNDA / trust-center step before deeper document collection", "2026-03-26", "zipped");
    insertDecision.run(uuid(), "If prototype proves valuable, will be handed to engineering for production development", "2026-04-09", "zipped");

    // Settings
    insertSetting.run("apiKey", "");
    insertSetting.run("model", "claude-sonnet-4-6");
  });

  txn();
}

seed();
console.log("Seed complete.");
db.close();
