"use client";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

interface Transcript {
  id: string; name: string; content: string; lineCount: number; extracted: string | null; createdAt: string;
}

function stripVTT(content: string) {
  return content
    .replace(/^WEBVTT[\s\S]*?\n\n/, "")
    .replace(/^\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}.*$/gm, "")
    .replace(/^\s*\d+\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function TranscriptsPage() {
  const toast = useToast();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [initiatives, setInitiatives] = useState<{ id: string; name: string }[]>([]);
  const [over, setOver] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const reload = useCallback(() => {
    fetch("/api/transcripts").then(r => r.json()).then(setTranscripts).catch(() => {});
  }, []);

  useEffect(() => {
    reload();
    fetch("/api/initiatives").then(r => r.json()).then(setInitiatives).catch(() => {});
  }, [reload]);

  async function uploadFile(file: File) {
    const text = await file.text();
    const content = file.name.endsWith(".vtt") ? stripVTT(text) : text;
    const res = await fetch("/api/transcripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, content }),
    });
    if (res.ok) { toast("Transcript uploaded: " + file.name); reload(); }
  }

  async function analyze(tx: Transcript) {
    setAnalyzing(tx.id);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transcript", transcriptContent: tx.content }),
      });
      const data = await res.json();
      if (data.error) { toast(data.error, "err"); return; }
      await fetch(`/api/transcripts/${tx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extracted: data.extracted }),
      });
      toast("Analysis complete!");
      reload();
    } catch { toast("Analysis failed.", "err"); }
    finally { setAnalyzing(null); }
  }

  async function deleteTx(id: string) {
    await fetch(`/api/transcripts/${id}`, { method: "DELETE" });
    toast("Transcript removed.");
    reload();
  }

  async function addItem(txId: string, type: string, text: string, initId: string) {
    const endpoint = `/api/initiatives/${initId}/${type === "task" ? "tasks" : type === "decision" ? "decisions" : "risks"}`;
    const body = type === "task"
      ? { text, priority: "medium", status: "not-started" }
      : type === "decision"
      ? { text }
      : { title: text.substring(0, 60), description: text, likelihood: "medium", impact: "medium" };
    await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    toast(`${label} added.`);
  }

  function getExtracted(tx: Transcript) {
    if (!tx.extracted) return null;
    try { return JSON.parse(tx.extracted); } catch { return null; }
  }

  return (
    <div className="max-w-[1000px] mx-auto px-9 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-[26px] font-bold text-text">Transcripts</h1>
        <p className="text-[13px] text-text-3 mt-1">Upload meeting transcripts and extract insights</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-[14px] py-11 px-7 text-center cursor-pointer transition-all bg-surface mb-6 ${over ? "border-accent bg-accent-bg" : "border-border hover:border-accent hover:bg-accent-bg"}`}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <div className="text-[30px] text-text-3 mb-2.5">⬆</div>
        <div className="text-[14.5px] font-medium text-text mb-1">Drop a transcript here or click to upload</div>
        <div className="text-[12px] text-text-3">Supports .txt and .vtt (WEBVTT) files</div>
        <input id="file-input" type="file" accept=".txt,.vtt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
      </div>

      {transcripts.length === 0 && (
        <div className="text-center py-8 text-text-3 text-[13px]">No transcripts uploaded yet.</div>
      )}

      {transcripts.map(tx => {
        const extracted = getExtracted(tx);
        return (
          <div key={tx.id} className="bg-surface border border-border rounded-lg p-4 px-[18px] mb-3">
            <div className="flex items-center justify-between mb-2 gap-2.5">
              <div>
                <div className="text-[13.5px] font-semibold text-text">{tx.name}</div>
                <div className="text-[11px] text-text-3">{new Date(tx.createdAt).toLocaleDateString()} · {tx.lineCount} lines</div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => analyze(tx)} disabled={analyzing === tx.id} className="px-3 py-1.5 text-[12px] font-medium bg-accent text-white rounded hover:bg-[#C05928] disabled:opacity-50">
                  {analyzing === tx.id ? "Analyzing…" : "Analyze with AI"}
                </button>
                <button onClick={() => deleteTx(tx.id)} className="w-[22px] h-[22px] flex items-center justify-center text-red text-[13px] rounded hover:bg-surface-2">✕</button>
              </div>
            </div>

            {extracted && (
              <div className="space-y-3">
                {(["tasks", "decisions", "risks"] as const).map(type => {
                  const items = extracted[type] as string[] | undefined;
                  if (!items?.length) return null;
                  return (
                    <div key={type} className="pt-3 border-t border-border-lt">
                      <div className="text-[11.5px] font-semibold text-text-2 uppercase tracking-wider mb-2">{type} ({items.length})</div>
                      {items.map((item: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 py-1.5 border-b border-border-lt last:border-0">
                          <div className="flex-1 text-[12.5px] text-text leading-snug">{item}</div>
                          <div className="flex items-center gap-1 shrink-0">
                            <select defaultValue={initiatives[0]?.id} className="border border-border rounded px-1.5 py-0.5 text-[11px] text-text-2 bg-white">
                              {initiatives.map(i => <option key={i.id} value={i.id}>{i.name.split(" ").slice(0, 3).join(" ")}</option>)}
                            </select>
                            <button onClick={(e) => {
                              const sel = (e.currentTarget.previousElementSibling as HTMLSelectElement)?.value;
                              if (sel) addItem(tx.id, type === "tasks" ? "task" : type === "decisions" ? "decision" : "risk", item, sel);
                            }} className="px-2 py-0.5 text-[11px] bg-navy text-white rounded font-medium">Add</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
