"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { Objective } from "./types";
import { TASK_STATUSES, PRIORITIES, LIKELIHOODS, IMPACTS, inputCls, selectCls, btnPrimary, btnGhost } from "./types";
import { useInitiativeData } from "./useInitiativeData";
import { SortableObjective } from "./SortableObjective";
import { EditTaskModal } from "./EditTaskModal";
import { EditObjectiveModal } from "./EditObjectiveModal";
import { AddDecisionModal } from "./AddDecisionModal";
import { isReadOnly } from "@/lib/readOnly";

function impactBorderColor(impact: string) {
  if (impact === "high") return "border-l-red";
  if (impact === "medium") return "border-l-amber";
  return "border-l-text-3";
}

export default function InitiativeDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const readonly = isReadOnly();

  const initiative = useInitiativeData(id);
  const { data, loading, fetchData } = initiative;

  const [showAddObjective, setShowAddObjective] = useState(false);
  const [newObjectiveText, setNewObjectiveText] = useState("");
  const [newObjectiveDesc, setNewObjectiveDesc] = useState("");
  const [editObjective, setEditObjective] = useState<Objective | null>(null);

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ text: "", owner: "", due: "", status: "not-started", priority: "medium" });

  const [showAddRisk, setShowAddRisk] = useState(false);
  const [newRisk, setNewRisk] = useState({
    title: "",
    description: "",
    likelihood: "medium",
    impact: "medium",
    mitigation: "",
  });

  const [showAddDecision, setShowAddDecision] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleObjectiveDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !data) return;

    const sorted = [...data.objectives].sort((a, b) => a.sortOrder - b.sortOrder);
    const oldIndex = sorted.findIndex((o) => o.id === active.id);
    const newIndex = sorted.findIndex((o) => o.id === over.id);
    const reordered = arrayMove(sorted, oldIndex, newIndex).map((o, i) => ({ ...o, sortOrder: i }));
    await initiative.handleObjectiveDragEnd(reordered);
  }

  async function handleAddObjective() {
    if (!newObjectiveText.trim()) return;
    const ok = await initiative.addObjective(newObjectiveText, newObjectiveDesc);
    if (ok) {
      setNewObjectiveText("");
      setNewObjectiveDesc("");
      setShowAddObjective(false);
    }
  }

  async function handleAddTask() {
    if (!newTask.text.trim()) return;
    const ok = await initiative.addTask(newTask);
    if (ok) {
      setNewTask({ text: "", owner: "", due: "", status: "not-started", priority: "medium" });
      setShowAddTask(false);
    }
  }

  async function handleAddRisk() {
    if (!newRisk.title.trim()) return;
    const ok = await initiative.addRisk(newRisk);
    if (ok) {
      setNewRisk({ title: "", description: "", likelihood: "medium", impact: "medium", mitigation: "" });
      setShowAddRisk(false);
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-[24px] font-bold text-text leading-tight">{data.name}</h1>
        {data.subtitle && <p className="text-[14px] text-text-2 mt-1">{data.subtitle}</p>}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <StatusBadge status={data.status} />
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-2 text-[10.5px] font-semibold uppercase tracking-wide text-text-2">
            {data.quarter}
          </span>
          {data.owners.length > 0 && (
            <span className="text-[12.5px] text-text-2">{data.owners.map((o) => o.name).join(", ")}</span>
          )}
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <ProgressBar progress={data.progress} status={data.status} />
          </div>
          {!readonly && (
            <input
              type="range"
              min={0}
              max={100}
              value={data.progress}
              onChange={(e) => initiative.handleProgressChange(Number(e.target.value))}
              className="w-24 accent-navy cursor-pointer"
            />
          )}
          <span className="text-[12px] font-semibold text-text-2 tabular-nums w-8 text-right">{data.progress}%</span>
        </div>
        {!readonly && (
          <div className="mt-4">
            <Link
              href="/artifacts"
              className="inline-flex items-center gap-1.5 rounded bg-navy px-4 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Generate Artifact
            </Link>
          </div>
        )}
      </div>

      {data.description && <p className="text-[14px] text-text leading-relaxed mb-8">{data.description}</p>}

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
                {!readonly && (
                  <button onClick={() => setShowAddObjective(!showAddObjective)} className={btnPrimary}>
                    + Add
                  </button>
                )}
              </div>
            </div>
            {showAddObjective && (
              <div className="mb-4 p-3 rounded border border-border bg-surface-2 space-y-2">
                <input
                  placeholder="Objective title"
                  value={newObjectiveText}
                  onChange={(e) => setNewObjectiveText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) handleAddObjective();
                  }}
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
                  <button
                    onClick={() => {
                      setShowAddObjective(false);
                      setNewObjectiveText("");
                      setNewObjectiveDesc("");
                    }}
                    className={btnGhost}
                  >
                    Cancel
                  </button>
                  <button onClick={handleAddObjective} className={btnPrimary}>
                    Save
                  </button>
                </div>
              </div>
            )}
            {readonly ? (
              <ul className="space-y-2">
                {[...data.objectives]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((obj) => (
                    <SortableObjective key={obj.id} obj={obj} />
                  ))}
              </ul>
            ) : (
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
                          onToggle={initiative.toggleObjective}
                          onEdit={(o) => setEditObjective(o)}
                          onDelete={initiative.deleteObjective}
                        />
                      ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Tasks */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-[15px] font-bold text-text">Tasks</h2>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-text-3">
                  {tasksDone} of {data.tasks.length} done
                </span>
                {!readonly && (
                  <button onClick={() => setShowAddTask(!showAddTask)} className={btnPrimary}>
                    + Add Task
                  </button>
                )}
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
                  <button onClick={handleAddTask} className={btnPrimary}>
                    Save
                  </button>
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
                      className={`w-[16px] h-[16px] rounded-sm border-2 flex-shrink-0 flex items-center justify-center ${task.status === "complete" ? "bg-green border-green text-white" : "border-border"}`}
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
                    {task.updates && task.updates.length > 0 && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px] text-text-3"
                        title={`${task.updates.length} update${task.updates.length !== 1 ? "s" : ""}`}
                      >
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M14 7.667A6.277 6.277 0 018 14a6.96 6.96 0 01-3.333-.867L1.333 14l1.2-3.333A6.277 6.277 0 012 7.333a6.333 6.333 0 016.333-6.333h.334A6.31 6.31 0 0114 7.333v.334z"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {task.updates.length}
                      </span>
                    )}
                    {!readonly && (
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <button
                          onClick={() => initiative.openEditTask(task)}
                          className="text-text-3 hover:text-text text-[13px]"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => initiative.deleteTask(task.id)}
                          className="text-text-3 hover:text-red text-[13px]"
                        >
                          ✕
                        </button>
                      </div>
                    )}
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
                {!readonly && (
                  <button onClick={() => setShowAddRisk(!showAddRisk)} className={btnPrimary}>
                    + Add
                  </button>
                )}
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
                      <option key={l} value={l}>
                        {l.charAt(0).toUpperCase() + l.slice(1)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newRisk.impact}
                    onChange={(e) => setNewRisk({ ...newRisk, impact: e.target.value })}
                    className={selectCls}
                  >
                    {IMPACTS.map((i) => (
                      <option key={i} value={i}>
                        {i.charAt(0).toUpperCase() + i.slice(1)}
                      </option>
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
                  <button onClick={() => setShowAddRisk(false)} className={btnGhost}>
                    Cancel
                  </button>
                  <button onClick={handleAddRisk} className={btnPrimary}>
                    Save
                  </button>
                </div>
              </div>
            )}
            <ul className="space-y-3">
              {data.risks.map((risk) => (
                <li key={risk.id} className={`border-l-[3px] ${impactBorderColor(risk.impact)} pl-3 py-1`}>
                  <p className="text-[13px] font-semibold text-text">{risk.title}</p>
                  {risk.description && <p className="text-[12px] text-text-2 mt-0.5">{risk.description}</p>}
                  {risk.mitigation && (
                    <p className="text-[11.5px] text-text-3 mt-1 italic">Mitigation: {risk.mitigation}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Decisions */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-[15px] font-bold text-text">Decisions</h2>
              {!readonly && (
                <button onClick={() => setShowAddDecision(true)} className={btnPrimary}>
                  + Add
                </button>
              )}
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
            {readonly ? (
              initiative.notesValue ? (
                <p className="text-[13px] text-text leading-relaxed whitespace-pre-line">{initiative.notesValue}</p>
              ) : (
                <p className="text-[13px] text-text-3 italic">No notes.</p>
              )
            ) : (
              <textarea
                value={initiative.notesValue}
                onChange={(e) => initiative.setNotesValue(e.target.value)}
                onBlur={initiative.saveNotes}
                rows={6}
                className={`${inputCls} resize-y`}
                placeholder="Add notes…"
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditTaskModal
        editTask={initiative.editTask}
        editTaskForm={initiative.editTaskForm}
        setEditTaskForm={initiative.setEditTaskForm}
        newUpdateText={initiative.newUpdateText}
        setNewUpdateText={initiative.setNewUpdateText}
        pendingFiles={initiative.pendingFiles}
        setPendingFiles={initiative.setPendingFiles}
        submittingUpdate={initiative.submittingUpdate}
        onClose={() => initiative.setEditTask(null)}
        onSave={initiative.saveEditTask}
        onAddUpdate={initiative.addTaskUpdate}
      />

      <EditObjectiveModal
        objective={editObjective}
        onClose={() => setEditObjective(null)}
        onSave={initiative.saveEditObjective}
      />

      <AddDecisionModal
        open={showAddDecision}
        onClose={() => setShowAddDecision(false)}
        onSave={initiative.addDecision}
      />
    </div>
  );
}
