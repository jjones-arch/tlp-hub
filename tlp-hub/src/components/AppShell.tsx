"use client";
import { useState, useEffect, ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [initiatives, setInitiatives] = useState<{ id: string; name: string; status: string }[]>([]);

  useEffect(() => {
    fetch("/api/initiatives")
      .then((r) => r.json())
      .then((data) => setInitiatives(data))
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar initiatives={initiatives} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-bg">
        {/* Mobile hamburger */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="md:hidden fixed top-4 left-4 z-50 w-8 h-8 bg-navy text-white rounded flex items-center justify-center text-sm"
        >
          ☰
        </button>
        {children}
      </main>
    </div>
  );
}
