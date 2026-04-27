"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
import { loadStaticState, mapInitiativesForDashboard } from "@/lib/staticState";
import { isReadOnly } from "@/lib/readOnly";

interface Owner {
  id: string;
  name: string;
  role: string;
}

interface Task {
  id: string;
  text: string;
  owner: string;
  due: string | null;
  status: string;
  priority: string;
  initiativeId: string;
}

interface Risk {
  id: string;
  text: string;
  impact: string;
  likelihood: string;
  status: string;
}

interface Decision {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface Objective {
  id: string;
  text: string;
  status: string;
}

interface Initiative {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  quarter: string;
  owners: Owner[];
  tasks: Task[];
  risks: Risk[];
  objectives: Objective[];
  decisions: Decision[];
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const toast = useToast();
  const readonly = isReadOnly();
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusHtml, setFocusHtml] = useState<string | null>(null);
  const [focusLoading, setFocusLoading] = useState(false);
  const [togglingTask, setTogglingTask] = useState<string | null>(null);

  async function fetchData() {
    try {
      const res = await fetch("/api/initiatives");
      if (!res.ok) throw new Error("Failed to load");
      const data: Initiative[] = await res.json();
      setInitiatives(data);
    } catch {
      try {
        const state = await loadStaticState();
        setInitiatives(mapInitiativesForDashboard(state));
      } catch {
        toast("Failed to load initiatives", "err");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allTasks = initiatives.flatMap((init) =>
    init.tasks.map((t) => ({ ...t, initiativeName: init.name, initiativeId: init.id })),
  );

  const highPriorityOpen = allTasks.filter((t) => t.priority === "high" && t.status !== "complete");

  const defaultFocusItems = highPriorityOpen.slice(0, 5);

  const totalTasks = allTasks.length;
  const completeTasks = allTasks.filter((t) => t.status === "complete").length;
  const highImpactRisks = initiatives.flatMap((i) => i.risks).filter((r) => r.impact === "high").length;
  const decisionsLogged = initiatives.flatMap((i) => i.decisions).length;

  const pendingItems = initiatives
    .flatMap((i) =>
      i.tasks
        .filter((t) => t.status === "not-started" && t.priority === "high")
        .slice(0, 2)
        .map((t) => ({ id: t.id, text: t.text, initiativeName: i.name })),
    )
    .slice(0, 4);

  async function handleGenerateFocus() {
    setFocusLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "focus" }),
      });
      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();
      setFocusHtml(data.reply);
    } catch {
      toast("Could not generate focus items", "err");
    } finally {
      setFocusLoading(false);
    }
  }

  async function toggleTask(initiativeId: string, taskId: string, currentStatus: string) {
    setTogglingTask(taskId);
    const newStatus = currentStatus === "complete" ? "not-started" : "complete";
    try {
      const res = await fetch(`/api/initiatives/${initiativeId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast(newStatus === "complete" ? "Task completed" : "Task reopened");
      await fetchData();
    } catch {
      toast("Failed to update task", "err");
    } finally {
      setTogglingTask(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto px-9 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-72 bg-surface rounded" />
          <div className="h-4 w-48 bg-surface rounded" />
          <div className="h-40 bg-surface rounded-lg" />
          <div className="grid grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-surface rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-9 py-10">
      {/* Header */}
      <header className="mb-8">
        <h1 className="font-serif text-[26px] font-bold text-text leading-tight">Technology Lifecycle Program</h1>
        <p className="text-[13px] text-text-3 mt-1">Q2 2026 · {formatToday()} · BambooHR IT</p>
      </header>

      {/* Focus Box */}
      <section className="mb-8 rounded-lg bg-gradient-to-br from-navy to-navy-a p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold tracking-tight">✦ Focus This Week</h2>
          {!readonly && (
            <button
              onClick={handleGenerateFocus}
              disabled={focusLoading}
              className="text-[12px] font-medium px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              {focusLoading ? "Generating…" : "Generate with AI"}
            </button>
          )}
        </div>

        {focusHtml ? (
          <div
            className="text-[13.5px] leading-relaxed opacity-90 prose prose-invert prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: focusHtml }}
          />
        ) : (
          <ul className="space-y-1.5">
            {defaultFocusItems.length === 0 && <li className="text-[13px] opacity-60">No high-priority open tasks</li>}
            {defaultFocusItems.map((task) => (
              <li key={task.id} className="text-[13.5px] leading-snug opacity-90 flex gap-2">
                <span className="shrink-0 mt-1">•</span>
                <span>
                  {task.text}
                  <span className="ml-2 text-[11px] opacity-50">{task.initiativeName}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Initiative Cards */}
      <section className="mb-8">
        <div className="grid grid-cols-3 gap-5">
          {initiatives.map((init) => {
            const progress = init.progress;
            return (
              <Link
                key={init.id}
                href={`/initiatives/${init.id}`}
                className="block rounded-lg border border-border bg-surface p-5 hover:border-border-lt transition-colors group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <StatusBadge status={init.status} />
                  <span className="text-[10.5px] text-text-3 font-medium uppercase tracking-wide">{init.quarter}</span>
                </div>
                <h3 className="font-serif text-[16px] font-semibold text-text leading-snug mb-1.5 group-hover:text-accent transition-colors">
                  {init.name}
                </h3>
                <p className="text-[12.5px] text-text-3 leading-relaxed line-clamp-2 mb-4">{init.description}</p>
                <ProgressBar progress={progress} status={init.status} />
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[11.5px] text-text-2 font-medium">{progress}% complete</span>
                  <div className="flex items-center gap-1">
                    {init.owners.slice(0, 3).map((o) => (
                      <span
                        key={o.id}
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-navy text-white text-[9px] font-bold"
                        title={o.name}
                      >
                        {o.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Bottom Two-Column Grid */}
      <section className="grid grid-cols-2 gap-5">
        {/* Left: Open High-Priority Tasks */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="font-serif text-[15px] font-semibold text-text mb-4">Open High-Priority Tasks</h3>
          {highPriorityOpen.length === 0 ? (
            <p className="text-[13px] text-text-3">No high-priority open tasks — nice work.</p>
          ) : (
            <ul className="space-y-3">
              {highPriorityOpen.map((task) => (
                <li key={task.id} className="flex items-start gap-2.5">
                  {!readonly ? (
                    <button
                      onClick={() => toggleTask(task.initiativeId, task.id, task.status)}
                      disabled={togglingTask === task.id}
                      className="mt-0.5 shrink-0 w-4 h-4 rounded border border-border-lt flex items-center justify-center hover:border-accent transition-colors disabled:opacity-40"
                    >
                      {task.status === "complete" && (
                        <svg width="10" height="10" viewBox="0 0 10 10" className="text-green">
                          <path
                            d="M2 5l2.5 2.5L8 3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  ) : (
                    <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-red" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-text leading-snug">{task.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10.5px] text-text-3 bg-bg px-1.5 py-0.5 rounded">
                        {task.initiativeName}
                      </span>
                      {task.owner && <span className="text-[10.5px] text-text-3">{task.owner}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Program Stats */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h3 className="font-serif text-[15px] font-semibold text-text mb-4">Program Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[22px] font-bold text-text leading-none">{totalTasks}</p>
                <p className="text-[11.5px] text-text-3 mt-1">Tasks total</p>
              </div>
              <div>
                <p className="text-[22px] font-bold text-green leading-none">{completeTasks}</p>
                <p className="text-[11.5px] text-text-3 mt-1">Tasks complete</p>
              </div>
              <div>
                <p className="text-[22px] font-bold text-red leading-none">{highImpactRisks}</p>
                <p className="text-[11.5px] text-text-3 mt-1">High-impact risks</p>
              </div>
              <div>
                <p className="text-[22px] font-bold text-text leading-none">{decisionsLogged}</p>
                <p className="text-[11.5px] text-text-3 mt-1">Decisions logged</p>
              </div>
            </div>
          </div>

          {/* Pending Decisions */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h3 className="font-serif text-[15px] font-semibold text-text mb-4">Pending Decisions</h3>
            {pendingItems.length === 0 ? (
              <p className="text-[13px] text-text-3">No pending decisions right now.</p>
            ) : (
              <ul className="space-y-2.5">
                {pendingItems.map((d) => (
                  <li key={d.id} className="flex items-start gap-2">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[13px] text-text leading-snug">{d.text}</p>
                      <span className="text-[10.5px] text-text-3">{d.initiativeName}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
