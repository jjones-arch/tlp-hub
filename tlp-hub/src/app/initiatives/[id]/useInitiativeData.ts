"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { loadStaticState, mapInitiativeDetail } from "@/lib/staticState";
import type { Initiative, Objective, Task, TaskUpdate } from "./types";

export function useInitiativeData(id: string) {
  const toast = useToast();

  const [data, setData] = useState<Initiative | null>(null);
  const [loading, setLoading] = useState(true);
  const [notesValue, setNotesValue] = useState("");

  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editTaskForm, setEditTaskForm] = useState({ text: "", owner: "", due: "", status: "", priority: "" });
  const [newUpdateText, setNewUpdateText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [editingUpdateText, setEditingUpdateText] = useState("");

  const normalizedDisplayName = displayName.trim();
  const updateAuthor = normalizedDisplayName || "Unknown user";

  const fetchData = useCallback(async () => {
    try {
      const [initiativeRes, settingsRes] = await Promise.all([fetch(`/api/initiatives/${id}`), fetch("/api/settings")]);
      if (!initiativeRes.ok) throw new Error("Failed to load initiative");
      const json: Initiative = await initiativeRes.json();
      setData(json);
      setNotesValue(json.notes || "");
      if (settingsRes.ok) {
        const settings = (await settingsRes.json()) as { displayName?: string };
        setDisplayName((settings.displayName || "").trim());
      }
    } catch {
      try {
        const state = await loadStaticState();
        const fallback = mapInitiativeDetail(state, id);
        if (!fallback) throw new Error("Not in static state");
        setData(fallback as Initiative);
        setNotesValue(fallback.notes || "");
      } catch {
        toast("Failed to load initiative", "err");
      }
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

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

  async function handleObjectiveDragEnd(orderedObjectives: Objective[]) {
    if (!data) return;
    setData({ ...data, objectives: orderedObjectives });
    try {
      await fetch(`/api/initiatives/${id}/objectives/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: orderedObjectives.map((o) => o.id) }),
      });
    } catch {
      toast("Failed to reorder objectives", "err");
      await fetchData();
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

  async function addObjective(text: string, description: string) {
    try {
      const res = await fetch(`/api/initiatives/${id}/objectives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, description }),
      });
      if (!res.ok) throw new Error();
      toast("Objective added.");
      await fetchData();
      return true;
    } catch {
      toast("Failed to add objective", "err");
      return false;
    }
  }

  async function saveEditObjective(objectiveId: string, text: string, description: string) {
    try {
      const res = await fetch(`/api/initiatives/${id}/objectives/${objectiveId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, description }),
      });
      if (!res.ok) throw new Error();
      toast("Objective updated.");
      await fetchData();
      return true;
    } catch {
      toast("Failed to update objective", "err");
      return false;
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

  async function addTask(taskData: { text: string; owner: string; due: string; status: string; priority: string }) {
    try {
      const res = await fetch(`/api/initiatives/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) throw new Error();
      toast("Task added.");
      await fetchData();
      return true;
    } catch {
      toast("Failed to add task", "err");
      return false;
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
        body: JSON.stringify({ text: newUpdateText, author: updateAuthor }),
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
      setEditingUpdateId(null);
      setEditingUpdateText("");

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

  async function saveTaskUpdateEdit() {
    if (!editTask || !editingUpdateId) return;
    const newText = editingUpdateText.trim();
    if (!newText) return;

    setSubmittingUpdate(true);
    try {
      const res = await fetch(`/api/initiatives/${id}/tasks/${editTask.id}/updates`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateId: editingUpdateId, text: newText, author: updateAuthor }),
      });
      if (!res.ok) throw new Error();

      const updated = (await res.json()) as TaskUpdate;
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

  function startTaskUpdateEdit(update: TaskUpdate) {
    setEditingUpdateId(update.id);
    setEditingUpdateText(update.text);
  }

  function cancelTaskUpdateEdit() {
    setEditingUpdateId(null);
    setEditingUpdateText("");
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

  async function addRisk(riskData: {
    title: string;
    description: string;
    likelihood: string;
    impact: string;
    mitigation: string;
  }) {
    try {
      const res = await fetch(`/api/initiatives/${id}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(riskData),
      });
      if (!res.ok) throw new Error();
      toast("Risk added.");
      await fetchData();
      return true;
    } catch {
      toast("Failed to add risk", "err");
      return false;
    }
  }

  async function addDecision(decisionData: { text: string; date: string }) {
    try {
      const res = await fetch(`/api/initiatives/${id}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(decisionData),
      });
      if (!res.ok) throw new Error();
      toast("Decision added.");
      await fetchData();
      return true;
    } catch {
      toast("Failed to add decision", "err");
      return false;
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

  function openEditTask(task: Task) {
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
    setEditingUpdateId(null);
    setEditingUpdateText("");
  }

  return {
    data,
    loading,
    notesValue,
    setNotesValue,
    fetchData,
    handleProgressChange,
    handleObjectiveDragEnd,
    toggleObjective,
    addObjective,
    saveEditObjective,
    deleteObjective,
    addTask,
    editTask,
    setEditTask,
    editTaskForm,
    setEditTaskForm,
    newUpdateText,
    setNewUpdateText,
    pendingFiles,
    setPendingFiles,
    submittingUpdate,
    displayName: updateAuthor,
    editingUpdateId,
    editingUpdateText,
    setEditingUpdateText,
    saveEditTask,
    addTaskUpdate,
    startTaskUpdateEdit,
    cancelTaskUpdateEdit,
    saveTaskUpdateEdit,
    deleteTask,
    openEditTask,
    addRisk,
    addDecision,
    saveNotes,
  };
}
