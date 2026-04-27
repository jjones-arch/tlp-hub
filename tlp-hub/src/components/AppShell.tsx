"use client";
import { useState, useEffect, ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useToast } from "@/components/ui/Toast";
import { loadStaticState, mapInitiativesForSidebar } from "@/lib/staticState";
import { isReadOnly } from "@/lib/readOnly";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const toast = useToast();
  const readonly = isReadOnly();
  const [collapsed, setCollapsed] = useState(false);
  const [initiatives, setInitiatives] = useState<{ id: string; name: string; status: string }[]>([]);

  useEffect(() => {
    fetch("/api/initiatives")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load initiatives");
        return r.json();
      })
      .then((data) => setInitiatives(data))
      .catch(async () => {
        try {
          const state = await loadStaticState();
          setInitiatives(mapInitiativesForSidebar(state));
        } catch {
          toast("Failed to load sidebar data", "err");
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        initiatives={initiatives}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        readonly={readonly}
      />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-bg">
        {/* Mobile hamburger */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="md:hidden fixed top-4 left-4 z-50 w-8 h-8 bg-navy text-white rounded flex items-center justify-center text-sm"
        >
          ☰
        </button>
        {readonly && (
          <div className="bg-amber/10 border-b border-amber/20 px-4 py-2 text-center text-[12.5px] text-amber-800">
            <span className="font-semibold">Read-only snapshot</span> — this is a static view of TLP Hub data. Edits
            are available in the local version.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
