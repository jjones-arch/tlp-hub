"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { ViewTabs, ViewMode } from "@/components/sbo/ViewTabs";
import { SboCard } from "@/components/sbo/SboCard";
import { CalendarGrid } from "@/components/sbo/CalendarGrid";
import { GanttChart } from "@/components/sbo/GanttChart";

interface SboSummary {
  id: string;
  name: string;
  owner: string;
  division: string;
  status: string;
  description: string;
  taskCount: number;
  tasksDone: number;
  nextMeeting: { title: string; date: string } | null;
  meetingCount: number;
}

interface AllTask {
  id: string;
  text: string;
  owner: string;
  due: string;
  endDate: string;
  status: string;
  priority: string;
  sboId: string;
  sbo: { id: string; name: string };
}

interface AllMeeting {
  id: string;
  title: string;
  date: string;
  endDate: string;
  attendees: string;
  description: string;
  agenda: string;
  notes: string;
  actionItems: string;
  recurrence: string;
  recurrenceEnd: string;
  sboId: string;
  sbo: { id: string; name: string };
}

const inputCls =
  "w-full rounded border border-border bg-surface px-3 py-1.5 text-[13px] text-text placeholder:text-text-3 focus:outline-none focus:ring-1 focus:ring-accent";
const btnPrimary =
  "rounded bg-navy px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90 transition-opacity";
const btnGhost = "rounded px-3 py-1.5 text-[12.5px] font-medium text-text-2 hover:bg-surface-2 transition-colors";

export default function SboHubPage() {
  const toast = useToast();
  const [sbos, setSbos] = useState<SboSummary[]>([]);
  const [allTasks, setAllTasks] = useState<AllTask[]>([]);
  const [allMeetings, setAllMeetings] = useState<AllMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [showAddSbo, setShowAddSbo] = useState(false);
  const [newSbo, setNewSbo] = useState({ name: "", owner: "", division: "", description: "" });

  const fetchData = useCallback(async () => {
    try {
      const [sbosRes, tasksRes, meetingsRes] = await Promise.all([
        fetch("/api/sbos"),
        fetch("/api/sbos/all-tasks"),
        fetch("/api/sbos/all-meetings"),
      ]);
      if (!sbosRes.ok || !tasksRes.ok || !meetingsRes.ok) throw new Error("Failed to load SBO data");
      setSbos(await sbosRes.json());
      setAllTasks(await tasksRes.json());
      setAllMeetings(await meetingsRes.json());
    } catch {
      toast("Failed to load SBO data", "err");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function addSbo() {
    if (!newSbo.name.trim()) return;
    try {
      const res = await fetch("/api/sbos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSbo),
      });
      if (!res.ok) throw new Error();
      toast("SBO added.");
      setNewSbo({ name: "", owner: "", division: "", description: "" });
      setShowAddSbo(false);
      await fetchData();
    } catch {
      toast("Failed to add SBO", "err");
    }
  }

  const ganttGroups = useMemo(() => {
    const bySbo: Record<string, { id: string; name: string; tasks: AllTask[] }> = {};
    for (const t of allTasks) {
      if (!bySbo[t.sboId]) {
        bySbo[t.sboId] = { id: t.sboId, name: t.sbo.name, tasks: [] };
      }
      bySbo[t.sboId].tasks.push(t);
    }
    return Object.values(bySbo);
  }, [allTasks]);

  const totalTasks = sbos.reduce((s, sbo) => s + sbo.taskCount, 0);
  const totalDone = sbos.reduce((s, sbo) => s + sbo.tasksDone, 0);
  const upcomingMeetings = allMeetings.filter((m) => m.date >= new Date().toISOString().slice(0, 10)).length;

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto px-9 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-60 bg-surface rounded" />
          <div className="h-4 w-44 bg-surface rounded" />
          <div className="grid grid-cols-3 gap-5 mt-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-surface rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-9 py-10">
      {/* Header */}
      <header className="mb-6">
        <h1 className="font-serif text-[24px] font-bold text-text leading-tight">SBO Tracker</h1>
        <p className="text-[13px] text-text-3 mt-1">
          Manage all 14 Software Business Owners, their tasks, and meetings
        </p>
      </header>

      {/* Stats bar */}
      <div className="flex items-center gap-6 mb-6 px-5 py-3.5 rounded-lg bg-gradient-to-r from-navy to-navy-a text-white">
        <div>
          <span className="text-[20px] font-bold">{sbos.length}</span>
          <span className="text-[12px] ml-1.5 opacity-70">SBOs</span>
        </div>
        <div className="w-px h-7 bg-white/20" />
        <div>
          <span className="text-[20px] font-bold">{totalTasks}</span>
          <span className="text-[12px] ml-1.5 opacity-70">Tasks</span>
        </div>
        <div className="w-px h-7 bg-white/20" />
        <div>
          <span className="text-[20px] font-bold text-green-300">{totalDone}</span>
          <span className="text-[12px] ml-1.5 opacity-70">Complete</span>
        </div>
        <div className="w-px h-7 bg-white/20" />
        <div>
          <span className="text-[20px] font-bold">{upcomingMeetings}</span>
          <span className="text-[12px] ml-1.5 opacity-70">Upcoming Meetings</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowAddSbo(true)}
          className="rounded bg-white/15 px-4 py-1.5 text-[12.5px] font-semibold hover:bg-white/25 transition-colors"
        >
          + Add SBO
        </button>
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between mb-5">
        <ViewTabs active={view} onChange={setView} />
        {view === "list" && <span className="text-[12px] text-text-3">{sbos.length} SBOs total</span>}
      </div>

      {/* List View */}
      {view === "list" && (
        <div className="grid grid-cols-3 gap-5">
          {sbos.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-[14px] text-text-3">
              No SBOs yet. Click &ldquo;+ Add SBO&rdquo; to get started.
            </div>
          ) : (
            sbos.map((sbo) => <SboCard key={sbo.id} sbo={sbo} />)
          )}
        </div>
      )}

      {/* Calendar View */}
      {view === "calendar" && <CalendarGrid meetings={allMeetings} />}

      {/* Gantt View */}
      {view === "gantt" && <GanttChart groups={ganttGroups} />}

      {/* Add SBO Modal */}
      <Modal
        open={showAddSbo}
        onClose={() => setShowAddSbo(false)}
        title="Add SBO"
        footer={
          <>
            <button onClick={() => setShowAddSbo(false)} className={btnGhost}>
              Cancel
            </button>
            <button onClick={addSbo} className={btnPrimary}>
              Save
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-text-2 mb-1">Name</label>
            <input
              value={newSbo.name}
              onChange={(e) => setNewSbo({ ...newSbo, name: e.target.value })}
              className={inputCls}
              placeholder="e.g. Revenue Operations"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-text-2 mb-1">Owner</label>
              <input
                value={newSbo.owner}
                onChange={(e) => setNewSbo({ ...newSbo, owner: e.target.value })}
                className={inputCls}
                placeholder="SBO owner name"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-2 mb-1">Division</label>
              <input
                value={newSbo.division}
                onChange={(e) => setNewSbo({ ...newSbo, division: e.target.value })}
                className={inputCls}
                placeholder="e.g. Revenue, Finance"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-text-2 mb-1">Description</label>
            <textarea
              value={newSbo.description}
              onChange={(e) => setNewSbo({ ...newSbo, description: e.target.value })}
              rows={3}
              className={inputCls}
              placeholder="Brief description of this SBO's scope"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
