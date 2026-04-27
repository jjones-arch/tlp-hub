"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ViewTabs, ViewMode } from "@/components/sbo/ViewTabs";
import { CalendarGrid } from "@/components/sbo/CalendarGrid";
import { GanttChart } from "@/components/sbo/GanttChart";
import { MeetingCard } from "@/components/sbo/MeetingCard";
import { MeetingModal, MeetingForm } from "@/components/sbo/MeetingModal";
import { loadStaticState } from "@/lib/staticState";
import { taskStatusClasses, taskStatusLabel, priorityClasses } from "@/lib/utils";
import { isReadOnly } from "@/lib/readOnly";

interface SboTaskAttachment {
  id: string;
  filename: string;
  storedName: string;
  mimeType: string;
  size: number;
}

interface SboTaskUpdate {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  attachments: SboTaskAttachment[];
}

interface SboTask {
  id: string;
  text: string;
  description: string;
  owner: string;
  due: string;
  endDate: string;
  status: string;
  priority: string;
  sortOrder: number;
  updates: SboTaskUpdate[];
}

interface SboMeeting {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate: string;
  attendees: string;
  agenda: string;
  notes: string;
  actionItems: string;
  transcript: string;
  recurrence: string;
  recurrenceEnd: string;
}

interface SboData {
  id: string;
  name: string;
  owner: string;
  division: string;
  status: string;
  description: string;
  notes: string;
  tasks: SboTask[];
  meetings: SboMeeting[];
}

interface StaticStateShape {
  sbos?: Record<
    string,
    {
      id: string;
      name: string;
      owner?: string;
      division?: string;
      status?: string;
      description?: string;
      notes?: string;
      tasks?: Array<{
        id: string;
        text: string;
        description?: string;
        owner?: string;
        due?: string;
        endDate?: string;
        status?: string;
        priority?: string;
      }>;
      meetings?: Array<{
        id: string;
        title: string;
        description?: string;
        date?: string;
        endDate?: string;
        attendees?: string;
        agenda?: string;
        notes?: string;
        actionItems?: string;
        transcript?: string;
        recurrence?: string;
        recurrenceEnd?: string;
      }>;
    }
  >;
}

function mapSboFromStaticState(state: StaticStateShape, sboId: string): SboData | null {
  const sbo = state.sbos?.[sboId];
  if (!sbo) return null;

  return {
    id: sbo.id,
    name: sbo.name,
    owner: sbo.owner ?? "",
    division: sbo.division ?? "",
    status: sbo.status ?? "on-track",
    description: sbo.description ?? "",
    notes: sbo.notes ?? "",
    tasks: (sbo.tasks ?? []).map((task, index) => ({
      id: task.id,
      text: task.text,
      description: task.description ?? "",
      owner: task.owner ?? "",
      due: task.due ?? "",
      endDate: task.endDate ?? task.due ?? "",
      status: task.status ?? "not-started",
      priority: task.priority ?? "medium",
      sortOrder: index,
      updates: [],
    })),
    meetings: (sbo.meetings ?? []).map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description ?? "",
      date: meeting.date ?? "",
      endDate: meeting.endDate ?? meeting.date ?? "",
      attendees: meeting.attendees ?? "",
      agenda: meeting.agenda ?? "",
      notes: meeting.notes ?? "",
      actionItems: meeting.actionItems ?? "",
      transcript: meeting.transcript ?? "",
      recurrence: meeting.recurrence ?? "none",
      recurrenceEnd: meeting.recurrenceEnd ?? "",
    })),
  };
}

const TASK_STATUSES = ["not-started", "in-progress", "blocked", "complete"];
const PRIORITIES = ["low", "medium", "high"];
const SBO_STATUSES = ["on-track", "at-risk", "blocked", "complete"];

const inputCls =
  "w-full rounded border border-border bg-surface px-3 py-1.5 text-[13px] text-text placeholder:text-text-3 focus:outline-none focus:ring-1 focus:ring-accent";
const selectCls =
  "rounded border border-border bg-surface px-2 py-1.5 text-[13px] text-text focus:outline-none focus:ring-1 focus:ring-accent";
const btnPrimary =
  "rounded bg-navy px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90 transition-opacity";
const btnGhost = "rounded px-3 py-1.5 text-[12.5px] font-medium text-text-2 hover:bg-surface-2 transition-colors";

export default function SboDetailPage() {
  const { sboId } = useParams() as { sboId: string };
  const router = useRouter();
  const toast = useToast();
  const readonly = isReadOnly();

  const [data, setData] = useState<SboData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");

  // Task state
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    text: "",
    description: "",
    owner: "",
    due: "",
    endDate: "",
    status: "not-started",
    priority: "medium",
  });
  const [editTask, setEditTask] = useState<SboTask | null>(null);
  const [editTaskForm, setEditTaskForm] = useState({
    text: "",
    description: "",
    owner: "",
    due: "",
    endDate: "",
    status: "",
    priority: "",
  });
  const [newUpdateText, setNewUpdateText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [editingUpdateText, setEditingUpdateText] = useState("");

  // Meeting state
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [editMeeting, setEditMeeting] = useState<SboMeeting | null>(null);

  // SBO edit state
  const [notesValue, setNotesValue] = useState("");
  const [editingStatus, setEditingStatus] = useState(false);

  async function readErrorMessage(res: Response, fallback: string) {
    try {
      const payload = (await res.json()) as { error?: string };
      if (payload.error) return `${fallback}: ${payload.error}`;
    } catch {
      // ignore non-JSON error payloads
    }
    return fallback;
  }

  const normalizedDisplayName = displayName.trim();
  const updateAuthor = normalizedDisplayName || "Unknown user";

  const fetchData = useCallback(async () => {
    try {
      const [sboRes, settingsRes] = await Promise.all([fetch(`/api/sbos/${sboId}`), fetch("/api/settings")]);
      if (!sboRes.ok) throw new Error();
      const json: SboData = await sboRes.json();
      setData(json);
      setNotesValue(json.notes || "");
      if (settingsRes.ok) {
        const settings = (await settingsRes.json()) as { displayName?: string };
        setDisplayName((settings.displayName || "").trim());
      }
    } catch {
      try {
        const state = (await loadStaticState()) as StaticStateShape;
        const fallbackData = mapSboFromStaticState(state, sboId);
        if (!fallbackData) throw new Error();
        setData(fallbackData);
        setNotesValue(fallbackData.notes || "");
      } catch {
        toast("Failed to load SBO", "err");
      }
    } finally {
      setLoading(false);
    }
  }, [sboId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function patchSbo(body: Record<string, unknown>) {
    const res = await fetch(`/api/sbos/${sboId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error();
  }

  async function saveNotes() {
    try {
      await patchSbo({ notes: notesValue });
      toast("Notes saved.");
    } catch {
      toast("Failed to save notes", "err");
    }
  }

  async function changeStatus(status: string) {
    if (!data) return;
    setData({ ...data, status });
    setEditingStatus(false);
    try {
      await patchSbo({ status });
    } catch {
      toast("Failed to update status", "err");
    }
  }

  // ── Task CRUD ──

  async function addTask() {
    if (!newTask.text.trim()) return;
    try {
      const res = await fetch(`/api/sbos/${sboId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (!res.ok) throw new Error();
      toast("Task added.");
      setNewTask({
        text: "",
        description: "",
        owner: "",
        due: "",
        endDate: "",
        status: "not-started",
        priority: "medium",
      });
      setShowAddTask(false);
      await fetchData();
    } catch {
      toast("Failed to add task", "err");
    }
  }

  async function saveEditTask() {
    if (!editTask) return;
    try {
      const res = await fetch(`/api/sbos/${sboId}/tasks/${editTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTaskForm),
      });
      if (!res.ok) throw new Error();
      toast("Task updated.");
      setEditTask(null);
      await fetchData();
    } catch {
      toast("Failed to update task", "err");
    }
  }

  async function deleteTask(tid: string) {
    try {
      const res = await fetch(`/api/sbos/${sboId}/tasks/${tid}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Task deleted.");
      await fetchData();
    } catch {
      toast("Failed to delete task", "err");
    }
  }

  async function addTaskUpdate() {
    if (!editTask || (!newUpdateText.trim() && pendingFiles.length === 0)) return;
    setSubmittingUpdate(true);
    try {
      const res = await fetch(`/api/sbos/${sboId}/tasks/${editTask.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newUpdateText, author: updateAuthor }),
      });
      if (!res.ok) throw new Error();
      const update = await res.json();

      if (pendingFiles.length > 0) {
        const fd = new FormData();
        fd.append("sboTaskUpdateId", update.id);
        pendingFiles.forEach((f) => fd.append("files", f));
        await fetch("/api/uploads", { method: "POST", body: fd });
      }

      toast("Update added.");
      setNewUpdateText("");
      setPendingFiles([]);
      setEditingUpdateId(null);
      setEditingUpdateText("");

      const refreshRes = await fetch(`/api/sbos/${sboId}`);
      if (refreshRes.ok) {
        const json: SboData = await refreshRes.json();
        setData(json);
        const refreshed = json.tasks.find((t) => t.id === editTask.id);
        if (refreshed) setEditTask(refreshed);
      }
    } catch {
      toast("Failed to add update", "err");
    } finally {
      setSubmittingUpdate(false);
    }
  }

  async function saveTaskUpdateEdit() {
    if (!editTask || !editingUpdateId) return;
    const nextText = editingUpdateText.trim();
    if (!nextText) return;

    setSubmittingUpdate(true);
    try {
      const res = await fetch(`/api/sbos/${sboId}/tasks/${editTask.id}/updates`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateId: editingUpdateId, text: nextText, author: updateAuthor }),
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()) as SboTaskUpdate;

      setEditTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          updates: prev.updates.map((upd) => (upd.id === updated.id ? updated : upd)),
        };
      });
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((task) => {
            if (task.id !== editTask.id) return task;
            return {
              ...task,
              updates: task.updates.map((upd) => (upd.id === updated.id ? updated : upd)),
            };
          }),
        };
      });
      setEditingUpdateId(null);
      setEditingUpdateText("");
      toast("Update edited.");
    } catch {
      toast("Failed to edit update", "err");
    } finally {
      setSubmittingUpdate(false);
    }
  }

  // ── Meeting CRUD ──

  async function addMeeting(form: MeetingForm) {
    try {
      const res = await fetch(`/api/sbos/${sboId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Failed to add meeting"));
      toast("Meeting added.");
      setShowAddMeeting(false);
      await fetchData();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Failed to add meeting", "err");
    }
  }

  async function saveEditMeeting(form: MeetingForm) {
    if (!editMeeting) return;
    try {
      const res = await fetch(`/api/sbos/${sboId}/meetings/${editMeeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Failed to update meeting"));
      toast("Meeting updated.");
      setEditMeeting(null);
      await fetchData();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Failed to update meeting", "err");
    }
  }

  async function deleteMeeting(mid: string) {
    try {
      const res = await fetch(`/api/sbos/${sboId}/meetings/${mid}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Meeting deleted.");
      await fetchData();
    } catch {
      toast("Failed to delete meeting", "err");
    }
  }

  // ── Derived data ──

  const ganttGroups = useMemo(() => {
    if (!data) return [];
    return [{ id: data.id, name: data.name, tasks: data.tasks.map((t) => ({ ...t, sboId: data.id })) }];
  }, [data]);

  const calendarMeetings = useMemo(() => {
    if (!data) return [];
    return data.meetings.map((m) => ({ ...m, sboId: data.id }));
  }, [data]);

  // ── Loading / Not found ──

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto px-9 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-border" />
          <div className="h-6 w-64 rounded bg-border" />
          <div className="h-4 w-40 rounded bg-border" />
          <div className="grid grid-cols-[2fr_1fr] gap-6 mt-8">
            <div className="space-y-4">
              <div className="h-40 rounded-lg bg-border" />
              <div className="h-56 rounded-lg bg-border" />
            </div>
            <div className="space-y-4">
              <div className="h-40 rounded-lg bg-border" />
              <div className="h-32 rounded-lg bg-border" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-[1100px] mx-auto px-9 py-10 text-text-2 text-[14px]">
        SBO not found.{" "}
        <button onClick={() => router.back()} className="text-accent underline">
          Go back
        </button>
      </div>
    );
  }

  const tasksDone = data.tasks.filter((t) => t.status === "complete").length;

  return (
    <div className="max-w-[1100px] mx-auto px-9 py-10">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link href="/sbos" className="text-[12.5px] text-accent hover:underline">
          &larr; SBO Tracker
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-serif text-[24px] font-bold text-text leading-tight">{data.name}</h1>
          <div className="relative">
            {readonly ? (
              <StatusBadge status={data.status} />
            ) : (
              <>
                <button onClick={() => setEditingStatus(!editingStatus)}>
                  <StatusBadge status={data.status} />
                </button>
                {editingStatus && (
                  <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-20 py-1 min-w-[130px]">
                    {SBO_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => changeStatus(s)}
                        className="block w-full text-left px-3 py-1.5 text-[12.5px] text-text hover:bg-surface-2 transition-colors"
                      >
                        {s.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-[13px] text-text-2">
          {data.owner && <span>{data.owner}</span>}
          {data.division && (
            <span className="text-[10.5px] font-semibold uppercase tracking-wide bg-surface-2 px-2 py-0.5 rounded">
              {data.division}
            </span>
          )}
        </div>
        {data.description && <p className="text-[13.5px] text-text-2 mt-2 leading-relaxed">{data.description}</p>}
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between mb-5">
        <ViewTabs active={view} onChange={setView} />
        {!readonly && (
          <div className="flex items-center gap-3">
            <button onClick={() => setShowAddTask(true)} className={btnPrimary}>
              + Add Task
            </button>
            <button onClick={() => setShowAddMeeting(true)} className={btnPrimary}>
              + Add Meeting
            </button>
          </div>
        )}
      </div>

      {/* ═══ LIST VIEW ═══ */}
      {view === "list" && (
        <div className="grid grid-cols-[2fr_1fr] gap-6">
          {/* Left: Tasks */}
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-[15px] font-bold text-text">Tasks</h2>
                <span className="text-[12px] text-text-3">
                  {tasksDone} of {data.tasks.length} done
                </span>
              </div>

              {showAddTask && (
                <div className="mb-4 p-3 rounded border border-border bg-surface-2 space-y-2">
                  <input
                    placeholder="Task title"
                    value={newTask.text}
                    onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
                    className={inputCls}
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={2}
                    className={`${inputCls} resize-y`}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Owner"
                      value={newTask.owner}
                      onChange={(e) => setNewTask({ ...newTask, owner: e.target.value })}
                      className={inputCls}
                    />
                    <input
                      type="date"
                      placeholder="Due"
                      value={newTask.due}
                      onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="date"
                      placeholder="End date"
                      value={newTask.endDate}
                      onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                      className={inputCls}
                    />
                    <select
                      value={newTask.status}
                      onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                      className={selectCls}
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {taskStatusLabel(s)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className={selectCls}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button onClick={() => setShowAddTask(false)} className={btnGhost}>
                      Cancel
                    </button>
                    <button onClick={addTask} className={btnPrimary}>
                      Save
                    </button>
                  </div>
                </div>
              )}

              {data.tasks.length === 0 ? (
                <p className="text-[13px] text-text-3 py-4 text-center">
                  No tasks yet. Click &ldquo;+ Add Task&rdquo; to add one.
                </p>
              ) : (
                <ul className="space-y-1">
                  {data.tasks
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((task) => (
                      <li
                        key={task.id}
                        className="group flex items-center gap-2.5 rounded px-2 py-1.5 -mx-2 hover:bg-surface-2 transition-colors"
                      >
                        <span
                          className={`w-[16px] h-[16px] rounded-sm border-2 flex-shrink-0 flex items-center justify-center ${
                            task.status === "complete" ? "bg-green border-green text-white" : "border-border"
                          }`}
                        >
                          {task.status === "complete" && (
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                              <path
                                d="M2.5 6.5L5 9L9.5 3.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <span
                          className={`flex-1 text-[13px] ${task.status === "complete" ? "line-through text-text-3" : "text-text"}`}
                        >
                          {task.text}
                        </span>
                        {task.owner && <span className="text-[11px] text-text-3">{task.owner}</span>}
                        <span className={`text-[11px] ${taskStatusClasses(task.status)}`}>
                          {taskStatusLabel(task.status)}
                        </span>
                        <span className={`text-[11px] ${priorityClasses(task.priority)}`}>{task.priority}</span>
                        {task.due && <span className="text-[11px] text-text-3 tabular-nums">{task.due}</span>}
                        {!readonly && (
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                            <button
                              onClick={() => {
                                setEditTask(task);
                                setEditTaskForm({
                                  text: task.text,
                                  description: task.description,
                                  owner: task.owner,
                                  due: task.due,
                                  endDate: task.endDate,
                                  status: task.status,
                                  priority: task.priority,
                                });
                                setNewUpdateText("");
                                setPendingFiles([]);
                                setEditingUpdateId(null);
                                setEditingUpdateText("");
                              }}
                              className="text-text-3 hover:text-text text-[13px]"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="text-text-3 hover:text-red text-[13px]"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right: Meetings + Notes */}
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-[15px] font-bold text-text">Meetings</h2>
                <span className="text-[12px] text-text-3">{data.meetings.length} meetings</span>
              </div>
              {data.meetings.length === 0 ? (
                <p className="text-[13px] text-text-3 py-4 text-center">No meetings yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.meetings.map((m) => (
                    <MeetingCard
                      key={m.id}
                      meeting={m}
                      onEdit={readonly ? undefined : () => setEditMeeting(m)}
                      onDelete={readonly ? undefined : () => deleteMeeting(m.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
              <h2 className="font-serif text-[15px] font-bold text-text mb-3">Notes</h2>
              {readonly ? (
                notesValue ? (
                  <p className="text-[13px] text-text leading-relaxed whitespace-pre-line">{notesValue}</p>
                ) : (
                  <p className="text-[13px] text-text-3 italic">No notes.</p>
                )
              ) : (
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  onBlur={saveNotes}
                  rows={6}
                  className={`${inputCls} resize-y`}
                  placeholder="Add notes..."
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CALENDAR VIEW ═══ */}
      {view === "calendar" && <CalendarGrid meetings={calendarMeetings} />}

      {/* ═══ GANTT VIEW ═══ */}
      {view === "gantt" && <GanttChart groups={ganttGroups} />}

      {/* ── Edit Task Modal ── */}
      <Modal
        open={!!editTask}
        onClose={() => setEditTask(null)}
        title="Edit Task"
        footer={
          <>
            <button onClick={() => setEditTask(null)} className={btnGhost}>
              Cancel
            </button>
            <button onClick={saveEditTask} className={btnPrimary}>
              Save
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-text-2 mb-1">Title</label>
            <input
              value={editTaskForm.text}
              onChange={(e) => setEditTaskForm({ ...editTaskForm, text: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-text-2 mb-1">Description</label>
            <textarea
              value={editTaskForm.description}
              onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
              rows={3}
              placeholder="Describe the task in more detail..."
              className={`${inputCls} resize-y`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-text-2 mb-1">Owner</label>
              <input
                value={editTaskForm.owner}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, owner: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-2 mb-1">Due Date</label>
              <input
                type="date"
                value={editTaskForm.due}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, due: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-text-2 mb-1">End Date</label>
              <input
                type="date"
                value={editTaskForm.endDate}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, endDate: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-2 mb-1">Status</label>
              <select
                value={editTaskForm.status}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value })}
                className={selectCls + " w-full"}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {taskStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-2 mb-1">Priority</label>
              <select
                value={editTaskForm.priority}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value })}
                className={selectCls + " w-full"}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Updates / Notes ── */}
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="text-[13px] font-semibold text-text mb-3">Updates</h3>

            <div className="rounded border border-border bg-surface-2 p-3 space-y-2 mb-4">
              <textarea
                value={newUpdateText}
                onChange={(e) => setNewUpdateText(e.target.value)}
                placeholder="Add a progress note, comment, or status update..."
                rows={2}
                className={`${inputCls} resize-y`}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[12px] text-text-2 hover:text-text transition-colors">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-text-3">
                      <path
                        d="M14 10V12.667A1.334 1.334 0 0112.667 14H3.333A1.334 1.334 0 012 12.667V10M11.333 5.333L8 2M8 2L4.667 5.333M8 2v8"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Attach files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          setPendingFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {pendingFiles.length > 0 && (
                    <span className="text-[11px] text-text-3">
                      {pendingFiles.length} file{pendingFiles.length !== 1 ? "s" : ""} selected
                    </span>
                  )}
                </div>
                <button
                  onClick={addTaskUpdate}
                  disabled={submittingUpdate || (!newUpdateText.trim() && pendingFiles.length === 0)}
                  className={`${btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {submittingUpdate ? "Posting..." : "Post Update"}
                </button>
              </div>
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {pendingFiles.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-[11px] text-text-2 border border-border"
                    >
                      {f.name}
                      <button
                        onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="text-text-3 hover:text-red ml-0.5"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {editTask && editTask.updates && editTask.updates.length > 0 ? (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {editTask.updates.map((upd) => (
                  <div key={upd.id} className="relative pl-5 border-l-2 border-border pb-1">
                    <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-navy" />
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <div className="flex items-baseline gap-2">
                        {upd.author && <span className="text-[12px] font-semibold text-text">{upd.author}</span>}
                        <span className="text-[11px] text-text-3">
                          {new Date(upd.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {upd.author.trim().toLowerCase() === displayName.trim().toLowerCase() && (
                        <button
                          onClick={() => {
                            setEditingUpdateId(upd.id);
                            setEditingUpdateText(upd.text);
                          }}
                          className="text-[11px] text-text-3 hover:text-text"
                          disabled={submittingUpdate}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {editingUpdateId === upd.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingUpdateText}
                          onChange={(e) => setEditingUpdateText(e.target.value)}
                          rows={3}
                          className={`${inputCls} resize-y`}
                        />
                        <div className="flex gap-2">
                          <button onClick={saveTaskUpdateEdit} className={btnPrimary} disabled={submittingUpdate}>
                            {submittingUpdate ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingUpdateId(null);
                              setEditingUpdateText("");
                            }}
                            className={btnGhost}
                            disabled={submittingUpdate}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[13px] text-text leading-relaxed whitespace-pre-wrap">{upd.text}</p>
                    )}
                    {upd.attachments && upd.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {upd.attachments.map((att) => {
                          const isImage = att.mimeType.startsWith("image/");
                          return (
                            <a
                              key={att.id}
                              href={`/uploads/${att.storedName}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/att flex items-center gap-1.5 rounded border border-border bg-surface px-2 py-1 text-[11px] text-text-2 hover:border-accent hover:text-accent transition-colors"
                            >
                              {isImage ? (
                                <img
                                  src={`/uploads/${att.storedName}`}
                                  alt={att.filename}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              ) : (
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  className="text-text-3 group-hover/att:text-accent"
                                >
                                  <path
                                    d="M9.333 1.333H4A1.333 1.333 0 002.667 2.667v10.666A1.333 1.333 0 004 14.667h8a1.333 1.333 0 001.333-1.334V5.333l-4-4z"
                                    stroke="currentColor"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M9.333 1.333v4h4"
                                    stroke="currentColor"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                              <span className="max-w-[120px] truncate">{att.filename}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-text-3 italic">No updates yet. Add a note above to track progress.</p>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Add Meeting Modal ── */}
      <MeetingModal
        open={showAddMeeting}
        onClose={() => setShowAddMeeting(false)}
        onSave={addMeeting}
        title="Add Meeting"
      />

      {/* ── Edit Meeting Modal ── */}
      <MeetingModal
        open={!!editMeeting}
        onClose={() => setEditMeeting(null)}
        onSave={saveEditMeeting}
        initial={editMeeting || undefined}
        title="Edit Meeting"
      />
    </div>
  );
}
