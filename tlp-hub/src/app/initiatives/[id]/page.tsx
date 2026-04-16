"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { taskStatusClasses, taskStatusLabel, priorityClasses } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Owner {
  id: string;
  name: string;
}
interface Objective {
  id: string;
  text: string;
  description: string;
  complete: boolean;
  sortOrder: number;
}
interface TaskAttachment {
  id: string;
  filename: string;
  storedName: string;
  mimeType: string;
  size: number;
}
interface TaskUpdate {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  attachments: TaskAttachment[];
}
interface Task {
  id: string;
  text: string;
  owner: string;
  due: string;
  status: string;
  priority: string;
  sortOrder: number;
  updates: TaskUpdate[];
}
interface Risk {
  id: string;
  title: string;
  description: string;
  likelihood: string;
  impact: string;
  mitigation: string;
}
interface Decision {
  id: string;
  text: string;
  date: string;
}
interface Initiative {
  id: string;
  name: string;
  subtitle: string;
  quarter: string;
  status: string;
  progress: number;
  description: string;
  notes: string;
  owners: Owner[];
  objectives: Objective[];
  tasks: Task[];
  risks: Risk[];
  decisions: Decision[];
}

const TASK_STATUSES = ["not-started", "in-progress", "blocked", "complete"];
const PRIORITIES = ["low", "medium", "high"];
const LIKELIHOODS = ["low", "medium", "high"];
const IMPACTS = ["low", "medium", "high"];

const inputCls =
  "w-full rounded border border-border bg-surface px-3 py-1.5 text-[13px] text-text placeholder:text-text-3 focus:outline-none focus:ring-1 focus:ring-accent";
const selectCls =
  "rounded border border-border bg-surface px-2 py-1.5 text-[13px] text-text focus:outline-none focus:ring-1 focus:ring-accent";
const btnPrimary =
  "rounded bg-navy px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90 transition-opacity";
const btnGhost =
  "rounded px-3 py-1.5 text-[12.5px] font-medium text-text-2 hover:bg-surface-2 transition-colors";

function impactBorderColor(impact: string) {
  if (impact === "high") return "border-l-red";
  if (impact === "medium") return "border-l-amber";
  return "border-l-text-3";
}

function SortableObjective({
  obj,
  onToggle,
  onEdit,
  onDelete,
}: {
  obj: Objective;
  onToggle: (obj: Objective) => void;
  onEdit: (obj: Objective) => void;
  onDelete: (obj: Objective) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: obj.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2.5 group"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing text-text-3 hover:text-text-2 focus:outline-none"
        aria-label="Drag to reorder"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5.5" cy="3.5" r="1.2" />
          <circle cx="10.5" cy="3.5" r="1.2" />
          <circle cx="5.5" cy="8" r="1.2" />
          <circle cx="10.5" cy="8" r="1.2" />
          <circle cx="5.5" cy="12.5" r="1.2" />
          <circle cx="10.5" cy="12.5" r="1.2" />
        </svg>
      </button>
      <button
        onClick={() => onToggle(obj)}
        className={`mt-0.5 w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          obj.complete
            ? "bg-green border-green text-white"
            : "border-border hover:border-text-3"
        }`}
      >
        {obj.complete && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5L5 9L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <span className={`text-[13.5px] leading-snug ${obj.complete ? "line-through text-text-3" : "text-text"}`}>
          {obj.text}
        </span>
        {obj.description && (
          <p className="text-[12px] text-text-3 mt-0.5 leading-relaxed">{obj.description}</p>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0 transition-opacity">
        <button
          onClick={() => onEdit(obj)}
          className="text-text-3 hover:text-text text-[13px]"
          title="Edit objective"
        >
          ✎
        </button>
        <button
          onClick={() => onDelete(obj)}
          className="text-text-3 hover:text-red text-[13px]"
          title="Delete objective"
        >
          ✕
        </button>
      </div>
    </li>
  );
}

export default function InitiativeDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const toast = useToast();

  const [data, setData] = useState<Initiative | null>(null);
  const [loading, setLoading] = useState(true);

  const [showAddObjective, setShowAddObjective] = useState(false);
  const [newObjectiveText, setNewObjectiveText] = useState("");
  const [newObjectiveDesc, setNewObjectiveDesc] = useState("");

  const [editObjective, setEditObjective] = useState<Objective | null>(null);
  const [editObjForm, setEditObjForm] = useState({ text: "", description: "" });

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ text: "", owner: "", due: "", status: "not-started", priority: "medium" });

  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editTaskForm, setEditTaskForm] = useState({ text: "", owner: "", due: "", status: "", priority: "" });
  const [newUpdateText, setNewUpdateText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  const [showAddRisk, setShowAddRisk] = useState(false);
  const [newRisk, setNewRisk] = useState({ title: "", description: "", likelihood: "medium", impact: "medium", mitigation: "" });

  const [showAddDecision, setShowAddDecision] = useState(false);
  const [newDecision, setNewDecision] = useState({ text: "", date: "" });

  const [notesValue, setNotesValue] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleObjectiveDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !data) return;

    const sorted = [...data.objectives].sort((a, b) => a.sortOrder - b.sortOrder);
    const oldIndex = sorted.findIndex((o) => o.id === active.id);
    const newIndex = sorted.findIndex((o) => o.id === over.id);
    const reordered = arrayMove(sorted, oldIndex, newIndex).map((o, i) => ({
      ...o,
      sortOrder: i,
    }));

    setData({ ...data, objectives: reordered });

    try {
      await fetch(`/api/initiatives/${id}/objectives/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((o) => o.id) }),
      });
    } catch {
      toast("Failed to reorder objectives", "err");
      await fetchData();
    }
  }

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/initiatives/${id}`);
      if (!res.ok) throw new Error("Failed to load initiative");
      const json: Initiative = await res.json();
      setData(json);
      setNotesValue(json.notes || "");
    } catch {
      toast("Failed to load initiative", "err");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function patchInitiative(body: Record<string, unknown>) {
    const res = await fetch(`/api/initiatives/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Patch failed");
  }

  async function handleProgressChange(value: number) {
    if (!data) return;
    setData({ ...data, progress: value });
    try {
      await patchInitiative({ progress: value });
    } catch {
      toast("Failed to update progress", "err");
    }
  }

  async function toggleObjective(obj: Objective) {
    try {
      const res = await fetch(`/api/initiatives/${id}/objectives/${obj.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complete: !obj.complete }),
      });
      if (!res.ok) throw new Error();
      await fetchData();
    } catch {
      toast("Failed to update objective", "err");
    }
  }

  async function addObjective() {
    if (!newObjectiveText.trim()) return;
    try {
      const res = await fetch(`/api/initiatives/${id}/objectives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newObjectiveText, description: newObjectiveDesc }),
      });
      if (!res.ok) throw new Error();
      toast("Objective added.");
      setNewObjectiveText("");
      setNewObjectiveDesc("");
      setShowAddObjective(false);
      await fetchData();
    } catch {
      toast("Failed to add objective", "err");
    }
  }

  async function saveEditObjective() {
    if (!editObjective || !editObjForm.text.trim()) return;
    try {
      const res = await fetch(`/api/initiatives/${id}/objectives/${editObjective.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editObjForm.text, description: editObjForm.description }),
      });
      if (!res.ok) throw new Error();
      toast("Objective updated.");
      setEditObjective(null);
      await fetchData();
    } catch {
      toast("Failed to update objective", "err");
    }
  }

  async function deleteObjective(obj: Objective) {
    try {
      const res = await fetch(`/api/initiatives/${id}/objectives/${obj.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Objective deleted.");
      await fetchData();
    } catch {
      toast("Failed to delete objective", "err");
    }
  }

  async function addTask() {
    if (!newTask.text.trim()) return;
    try {
      const res = await fetch(`/api/initiatives/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (!res.ok) throw new Error();
      toast("Task added.");
      setNewTask({ text: "", owner: "", due: "", status: "not-started", priority: "medium" });
      setShowAddTask(false);
      await fetchData();
    } catch {
      toast("Failed to add task", "err");
    }
  }

  async function saveEditTask() {
    if (!editTask) return;
    try {
      const res = await fetch(`/api/initiatives/${id}/tasks/${editTask.id}`, {
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

  async function addTaskUpdate() {
    if (!editTask || (!newUpdateText.trim() && pendingFiles.length === 0)) return;
    setSubmittingUpdate(true);
    try {
      const res = await fetch(`/api/initiatives/${id}/tasks/${editTask.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newUpdateText, author: editTaskForm.owner }),
      });
      if (!res.ok) throw new Error();
      const update = await res.json();

      if (pendingFiles.length > 0) {
        const fd = new FormData();
        fd.append("taskUpdateId", update.id);
        pendingFiles.forEach((f) => fd.append("files", f));
        await fetch("/api/uploads", { method: "POST", body: fd });
      }

      toast("Update added.");
      setNewUpdateText("");
      setPendingFiles([]);

      const refreshRes = await fetch(`/api/initiatives/${id}`);
      if (refreshRes.ok) {
        const json: Initiative = await refreshRes.json();
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

  async function deleteTask(tid: string) {
    try {
      const res = await fetch(`/api/initiatives/${id}/tasks/${tid}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Task deleted.");
      await fetchData();
    } catch {
      toast("Failed to delete task", "err");
    }
  }

  async function addRisk() {
    if (!newRisk.title.trim()) return;
    try {
      const res = await fetch(`/api/initiatives/${id}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRisk),
      });
      if (!res.ok) throw new Error();
      toast("Risk added.");
      setNewRisk({ title: "", description: "", likelihood: "medium", impact: "medium", mitigation: "" });
      setShowAddRisk(false);
      await fetchData();
    } catch {
      toast("Failed to add risk", "err");
    }
  }

  async function addDecision() {
    if (!newDecision.text.trim()) return;
    try {
      const res = await fetch(`/api/initiatives/${id}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDecision),
      });
      if (!res.ok) throw new Error();
      toast("Decision added.");
      setNewDecision({ text: "", date: "" });
      setShowAddDecision(false);
      await fetchData();
    } catch {
      toast("Failed to add decision", "err");
    }
  }

  async function saveNotes() {
    try {
      await patchInitiative({ notes: notesValue });
      toast("Notes saved.");
    } catch {
      toast("Failed to save notes", "err");
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto px-9 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-64 rounded bg-border" />
          <div className="h-4 w-40 rounded bg-border" />
          <div className="h-[5px] w-full rounded bg-border mt-6" />
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
      <div className="max-w-[1000px] mx-auto px-9 py-10 text-text-2 text-[14px]">
        Initiative not found.{" "}
        <button onClick={() => router.back()} className="text-accent underline">
          Go back
        </button>
      </div>
    );
  }

  const objectivesComplete = data.objectives.filter((o) => o.complete).length;
  const tasksDone = data.tasks.filter((t) => t.status === "complete").length;
  const highImpactRisks = data.risks.filter((r) => r.impact === "high").length;

  return (
    <div className="max-w-[1000px] mx-auto px-9 py-10">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="font-serif text-[24px] font-bold text-text leading-tight">{data.name}</h1>
        {data.subtitle && (
          <p className="text-[14px] text-text-2 mt-1">{data.subtitle}</p>
        )}

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <StatusBadge status={data.status} />
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-2 text-[10.5px] font-semibold uppercase tracking-wide text-text-2">
            {data.quarter}
          </span>
          {data.owners.length > 0 && (
            <span className="text-[12.5px] text-text-2">
              {data.owners.map((o) => o.name).join(", ")}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <ProgressBar progress={data.progress} status={data.status} />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={data.progress}
            onChange={(e) => handleProgressChange(Number(e.target.value))}
            className="w-24 accent-navy cursor-pointer"
          />
          <span className="text-[12px] font-semibold text-text-2 tabular-nums w-8 text-right">
            {data.progress}%
          </span>
        </div>

        <div className="mt-4">
          <Link
            href="/artifacts"
            className="inline-flex items-center gap-1.5 rounded bg-navy px-4 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Generate Artifact
          </Link>
        </div>
      </div>

      {/* ── Description ── */}
      {data.description && (
        <p className="text-[14px] text-text leading-relaxed mb-8">{data.description}</p>
      )}

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-[2fr_1fr] gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Objectives */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-[15px] font-bold text-text">Objectives</h2>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-text-3">
                  {objectivesComplete} of {data.objectives.length} complete
                </span>
                <button onClick={() => setShowAddObjective(!showAddObjective)} className={btnPrimary}>
                  + Add
                </button>
              </div>
            </div>

            {showAddObjective && (
              <div className="mb-4 p-3 rounded border border-border bg-surface-2 space-y-2">
                <input
                  placeholder="Objective title"
                  value={newObjectiveText}
                  onChange={(e) => setNewObjectiveText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) addObjective(); }}
                  className={inputCls}
                  autoFocus
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newObjectiveDesc}
                  onChange={(e) => setNewObjectiveDesc(e.target.value)}
                  rows={2}
                  className={`${inputCls} resize-y`}
                />
                <div className="flex gap-2 justify-end pt-1">
                  <button onClick={() => { setShowAddObjective(false); setNewObjectiveText(""); setNewObjectiveDesc(""); }} className={btnGhost}>Cancel</button>
                  <button onClick={addObjective} className={btnPrimary}>Save</button>
                </div>
              </div>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleObjectiveDragEnd}>
              <SortableContext
                items={[...data.objectives].sort((a, b) => a.sortOrder - b.sortOrder).map((o) => o.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {[...data.objectives]
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((obj) => (
                      <SortableObjective
                        key={obj.id}
                        obj={obj}
                        onToggle={toggleObjective}
                        onEdit={(o) => {
                          setEditObjective(o);
                          setEditObjForm({ text: o.text, description: o.description || "" });
                        }}
                        onDelete={deleteObjective}
                      />
                    ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>

          {/* Tasks */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-[15px] font-bold text-text">Tasks</h2>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-text-3">
                  {tasksDone} of {data.tasks.length} done
                </span>
                <button onClick={() => setShowAddTask(!showAddTask)} className={btnPrimary}>
                  + Add Task
                </button>
              </div>
            </div>

            {showAddTask && (
              <div className="mb-4 p-3 rounded border border-border bg-surface-2 space-y-2">
                <input
                  placeholder="Task description"
                  value={newTask.text}
                  onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
                  className={inputCls}
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
                    value={newTask.due}
                    onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    className={selectCls}
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s} value={s}>{taskStatusLabel(s)}</option>
                    ))}
                  </select>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className={selectCls}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button onClick={() => setShowAddTask(false)} className={btnGhost}>Cancel</button>
                  <button onClick={addTask} className={btnPrimary}>Save</button>
                </div>
              </div>
            )}

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
                        task.status === "complete"
                          ? "bg-green border-green text-white"
                          : "border-border"
                      }`}
                    >
                      {task.status === "complete" && (
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6.5L5 9L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>

                    <span className={`flex-1 text-[13px] ${task.status === "complete" ? "line-through text-text-3" : "text-text"}`}>
                      {task.text}
                    </span>

                    {task.owner && (
                      <span className="text-[11px] text-text-3">{task.owner}</span>
                    )}

                    <span className={`text-[11px] ${taskStatusClasses(task.status)}`}>
                      {taskStatusLabel(task.status)}
                    </span>

                    <span className={`text-[11px] ${priorityClasses(task.priority)}`}>
                      {task.priority}
                    </span>

                    {task.due && (
                      <span className="text-[11px] text-text-3 tabular-nums">{task.due}</span>
                    )}

                    {task.updates && task.updates.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-text-3" title={`${task.updates.length} update${task.updates.length !== 1 ? "s" : ""}`}>
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                          <path d="M14 7.667A6.277 6.277 0 018 14a6.96 6.96 0 01-3.333-.867L1.333 14l1.2-3.333A6.277 6.277 0 012 7.333a6.333 6.333 0 016.333-6.333h.334A6.31 6.31 0 0114 7.333v.334z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {task.updates.length}
                      </span>
                    )}

                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      <button
                        onClick={() => {
                          setEditTask(task);
                          setEditTaskForm({
                            text: task.text,
                            owner: task.owner,
                            due: task.due,
                            status: task.status,
                            priority: task.priority,
                          });
                          setNewUpdateText("");
                          setPendingFiles([]);
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
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Risks */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-[15px] font-bold text-text">Risks</h2>
              <div className="flex items-center gap-3">
                {highImpactRisks > 0 && (
                  <span className="text-[12px] text-red font-semibold">{highImpactRisks} high</span>
                )}
                <button onClick={() => setShowAddRisk(!showAddRisk)} className={btnPrimary}>
                  + Add
                </button>
              </div>
            </div>

            {showAddRisk && (
              <div className="mb-4 p-3 rounded border border-border bg-surface-2 space-y-2">
                <input
                  placeholder="Risk title"
                  value={newRisk.title}
                  onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })}
                  className={inputCls}
                />
                <textarea
                  placeholder="Description"
                  value={newRisk.description}
                  onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
                  rows={2}
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newRisk.likelihood}
                    onChange={(e) => setNewRisk({ ...newRisk, likelihood: e.target.value })}
                    className={selectCls}
                  >
                    {LIKELIHOODS.map((l) => (
                      <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                    ))}
                  </select>
                  <select
                    value={newRisk.impact}
                    onChange={(e) => setNewRisk({ ...newRisk, impact: e.target.value })}
                    className={selectCls}
                  >
                    {IMPACTS.map((i) => (
                      <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  placeholder="Mitigation"
                  value={newRisk.mitigation}
                  onChange={(e) => setNewRisk({ ...newRisk, mitigation: e.target.value })}
                  rows={2}
                  className={inputCls}
                />
                <div className="flex gap-2 justify-end pt-1">
                  <button onClick={() => setShowAddRisk(false)} className={btnGhost}>Cancel</button>
                  <button onClick={addRisk} className={btnPrimary}>Save</button>
                </div>
              </div>
            )}

            <ul className="space-y-3">
              {data.risks.map((risk) => (
                <li
                  key={risk.id}
                  className={`border-l-[3px] ${impactBorderColor(risk.impact)} pl-3 py-1`}
                >
                  <p className="text-[13px] font-semibold text-text">{risk.title}</p>
                  {risk.description && (
                    <p className="text-[12px] text-text-2 mt-0.5">{risk.description}</p>
                  )}
                  {risk.mitigation && (
                    <p className="text-[11.5px] text-text-3 mt-1 italic">
                      Mitigation: {risk.mitigation}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Decisions */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-[15px] font-bold text-text">Decisions</h2>
              <button onClick={() => setShowAddDecision(true)} className={btnPrimary}>
                + Add
              </button>
            </div>

            <ul className="space-y-2.5">
              {data.decisions.map((d) => (
                <li key={d.id} className="text-[13px]">
                  <span className="text-text-3 text-[11.5px] tabular-nums mr-2">{d.date}</span>
                  <span className="text-text">{d.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Notes */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
            <h2 className="font-serif text-[15px] font-bold text-text mb-3">Notes</h2>
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={saveNotes}
              rows={6}
              className={`${inputCls} resize-y`}
              placeholder="Add notes…"
            />
          </div>
        </div>
      </div>

      {/* ── Edit Task Modal ── */}
      <Modal
        open={!!editTask}
        onClose={() => setEditTask(null)}
        title="Edit Task"
        footer={
          <>
            <button onClick={() => setEditTask(null)} className={btnGhost}>Cancel</button>
            <button onClick={saveEditTask} className={btnPrimary}>Save</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-text-2 mb-1">Description</label>
            <input
              value={editTaskForm.text}
              onChange={(e) => setEditTaskForm({ ...editTaskForm, text: e.target.value })}
              className={inputCls}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-text-2 mb-1">Status</label>
              <select
                value={editTaskForm.status}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value })}
                className={selectCls + " w-full"}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>{taskStatusLabel(s)}</option>
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
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Updates / Activity ── */}
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="text-[13px] font-semibold text-text mb-3">Updates</h3>

            {/* Add update form */}
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
                      <path d="M14 10V12.667A1.334 1.334 0 0112.667 14H3.333A1.334 1.334 0 012 12.667V10M11.333 5.333L8 2M8 2L4.667 5.333M8 2v8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
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

            {/* Timeline */}
            {editTask && editTask.updates && editTask.updates.length > 0 ? (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {editTask.updates.map((upd) => (
                  <div key={upd.id} className="relative pl-5 border-l-2 border-border pb-1">
                    <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-navy" />
                    <div className="flex items-baseline gap-2 mb-0.5">
                      {upd.author && (
                        <span className="text-[12px] font-semibold text-text">{upd.author}</span>
                      )}
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
                    <p className="text-[13px] text-text leading-relaxed whitespace-pre-wrap">{upd.text}</p>
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
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-text-3 group-hover/att:text-accent">
                                  <path d="M9.333 1.333H4A1.333 1.333 0 002.667 2.667v10.666A1.333 1.333 0 004 14.667h8a1.333 1.333 0 001.333-1.334V5.333l-4-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M9.333 1.333v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
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

      {/* ── Add Decision Modal ── */}
      <Modal
        open={showAddDecision}
        onClose={() => setShowAddDecision(false)}
        title="Add Decision"
        footer={
          <>
            <button onClick={() => setShowAddDecision(false)} className={btnGhost}>Cancel</button>
            <button onClick={addDecision} className={btnPrimary}>Save</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-text-2 mb-1">Decision</label>
            <input
              value={newDecision.text}
              onChange={(e) => setNewDecision({ ...newDecision, text: e.target.value })}
              className={inputCls}
              placeholder="What was decided?"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-text-2 mb-1">Date</label>
            <input
              type="date"
              value={newDecision.date}
              onChange={(e) => setNewDecision({ ...newDecision, date: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
