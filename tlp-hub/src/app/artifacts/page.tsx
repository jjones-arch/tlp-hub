"use client";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

const ARTIFACT_TYPES = [
  {
    id: "Program Charter",
    icon: "📋",
    name: "Program Charter",
    desc: "Formal scope, goals, stakeholders, and governance",
  },
  {
    id: "Risk Register",
    icon: "⚠️",
    name: "Risk Register",
    desc: "Full risk log with likelihood, impact, and mitigations",
  },
  { id: "RACI Matrix", icon: "👥", name: "RACI Matrix", desc: "Roles and responsibilities across initiatives" },
  { id: "Status Report", icon: "📊", name: "Status Report", desc: "Executive-ready Q2 progress summary" },
  {
    id: "Stakeholder Map",
    icon: "🗺️",
    name: "Stakeholder Map",
    desc: "Key stakeholders, interests, and communication needs",
  },
  { id: "Project Plan", icon: "📅", name: "Project Plan", desc: "Timeline, milestones, and dependencies" },
  { id: "Decision Log", icon: "📝", name: "Decision Log", desc: "Consolidated decisions across all initiatives" },
  { id: "SBO Process Doc", icon: "🔄", name: "SBO Process Doc", desc: "Division-specific SBO process documentation" },
  { id: "Meeting Agenda", icon: "🚀", name: "Meeting Agenda", desc: "Structured agenda for any TLP meeting" },
];

interface Artifact {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
}
interface Initiative {
  id: string;
  name: string;
}

export default function ArtifactsPage() {
  const toast = useToast();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [genModal, setGenModal] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<Artifact | null>(null);
  const [initSel, setInitSel] = useState("all");
  const [extra, setExtra] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/artifacts")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load artifacts");
        return r.json();
      })
      .then(setArtifacts)
      .catch(() => toast("Failed to load artifacts", "err"));
    fetch("/api/initiatives")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load initiatives");
        return r.json();
      })
      .then(setInitiatives)
      .catch(() => toast("Failed to load initiatives", "err"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = () =>
    fetch("/api/artifacts")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load artifacts");
        return r.json();
      })
      .then(setArtifacts)
      .catch(() => toast("Failed to reload artifacts", "err"));

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "artifact", artifactType: genModal, initiativeId: initSel, extra }),
      });
      const data = await res.json();
      if (data.error) {
        toast(data.error, "err");
        return;
      }
      toast("Artifact generated.");
      setGenModal(null);
      setExtra("");
      setInitSel("all");
      reload();
      setViewModal(data.artifact);
    } catch {
      toast("Generation failed.", "err");
    } finally {
      setGenerating(false);
    }
  }

  async function deleteArtifact(id: string) {
    try {
      const res = await fetch(`/api/artifacts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast("Artifact deleted.");
      reload();
    } catch {
      toast("Failed to delete artifact", "err");
    }
  }

  function copyContent(content: string) {
    navigator.clipboard
      .writeText(content)
      .then(() => toast("Copied to clipboard."))
      .catch(() => toast("Copy failed.", "err"));
  }

  return (
    <div className="max-w-[1000px] mx-auto px-9 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-text">Artifacts</h1>
          <p className="text-[13px] text-text-3 mt-1">Generate and manage program documents</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-7">
        {ARTIFACT_TYPES.map((a) => (
          <div
            key={a.id}
            onClick={() => setGenModal(a.id)}
            className="bg-surface border border-border rounded-lg p-4 cursor-pointer transition-all hover:border-accent hover:shadow-[0_0_0_1px_var(--color-accent)]"
          >
            <div className="w-[34px] h-[34px] bg-accent-bg rounded flex items-center justify-center text-accent text-base mb-2.5">
              {a.icon}
            </div>
            <div className="text-[13px] font-semibold text-text mb-1">{a.name}</div>
            <div className="text-[11.5px] text-text-3 leading-snug">{a.desc}</div>
          </div>
        ))}
      </div>

      {artifacts.length > 0 && (
        <>
          <div className="font-serif text-[15px] font-semibold text-text mb-3">Generated Artifacts</div>
          {artifacts.map((a) => (
            <div
              key={a.id}
              className="bg-surface border border-border rounded p-3.5 px-4 flex items-center justify-between gap-3 mb-2"
            >
              <div>
                <div className="text-[13px] font-medium text-text">{a.title}</div>
                <div className="text-[11px] text-text-3">
                  {a.type} · {new Date(a.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewModal(a)}
                  className="px-2.5 py-1 text-[11.5px] font-medium text-text-2 border border-border rounded hover:bg-surface-2"
                >
                  View
                </button>
                <button
                  onClick={() => copyContent(a.content)}
                  className="px-2.5 py-1 text-[11.5px] font-medium text-text-2 border border-border rounded hover:bg-surface-2"
                >
                  Copy
                </button>
                <button
                  onClick={() => deleteArtifact(a.id)}
                  className="w-[22px] h-[22px] flex items-center justify-center text-red text-[13px] rounded hover:bg-surface-2"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {artifacts.length === 0 && (
        <div className="text-center py-6 text-text-3 text-[13px]">
          Click any artifact type above to generate with AI.
        </div>
      )}

      <Modal
        open={!!genModal}
        onClose={() => setGenModal(null)}
        title={`Generate ${genModal}`}
        footer={
          <>
            <button
              onClick={() => setGenModal(null)}
              className="px-3.5 py-2 text-[12.5px] font-medium text-text-2 border border-border rounded hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              onClick={generate}
              disabled={generating}
              className="px-3.5 py-2 text-[12.5px] font-medium bg-accent text-white rounded hover:bg-[#C05928] disabled:opacity-50"
            >
              {generating ? "Generating…" : "Generate with AI"}
            </button>
          </>
        }
      >
        <div className="mb-3.5">
          <label className="block text-[12px] font-semibold text-text-2 uppercase tracking-wide mb-1.5">
            Focus Initiative (optional)
          </label>
          <select
            value={initSel}
            onChange={(e) => setInitSel(e.target.value)}
            className="w-full border border-border rounded p-2 text-[13px] text-text bg-bg outline-none focus:border-navy"
          >
            <option value="all">All initiatives</option>
            {initiatives.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-text-2 uppercase tracking-wide mb-1.5">
            Additional Instructions
          </label>
          <input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="Any specific focus or requirements…"
            className="w-full border border-border rounded p-2 text-[13px] text-text bg-bg outline-none focus:border-navy"
          />
        </div>
      </Modal>

      <Modal
        open={!!viewModal}
        onClose={() => setViewModal(null)}
        title={viewModal?.title || ""}
        footer={
          <>
            <button
              onClick={() => setViewModal(null)}
              className="px-3.5 py-2 text-[12.5px] font-medium text-text-2 border border-border rounded hover:bg-surface-2"
            >
              Close
            </button>
            <button
              onClick={() => viewModal && copyContent(viewModal.content)}
              className="px-3.5 py-2 text-[12.5px] font-medium bg-navy text-white rounded hover:bg-navy-h"
            >
              Copy to Clipboard
            </button>
          </>
        }
      >
        <pre className="text-[12.5px] text-text leading-relaxed whitespace-pre-wrap bg-surface-2 p-4 rounded border border-border-lt">
          {viewModal?.content}
        </pre>
      </Modal>
    </div>
  );
}
