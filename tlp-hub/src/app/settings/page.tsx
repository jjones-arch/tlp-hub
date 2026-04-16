"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const toast = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load settings");
        return r.json();
      })
      .then((data) => {
        setHasKey(!!data.apiKey);
      })
      .catch(() => toast("Failed to load settings", "err"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveKey() {
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      setHasKey(!!apiKey);
      toast("Settings saved.");
    } catch {
      toast("Failed to save settings", "err");
    }
  }

  async function exportData() {
    try {
      const res = await fetch("/api/data");
      if (!res.ok) throw new Error("Failed to export data");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tlp-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Data exported.");
    } catch {
      toast("Failed to export data", "err");
    }
  }

  async function resetData() {
    if (!confirm("Reset all data? This will clear all tasks, artifacts, and transcripts. This cannot be undone."))
      return;
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", confirm: "CONFIRM_RESET" }),
      });
      if (!res.ok) throw new Error("Reset failed");
      toast("Data reset. Refresh to reload defaults.");
    } catch {
      toast("Failed to reset data", "err");
    }
  }

  return (
    <div className="max-w-[600px] mx-auto px-9 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-[26px] font-bold text-text">Settings</h1>
        <p className="text-[13px] text-text-3 mt-1">Configure your TLP Hub</p>
      </div>

      <div className="mb-7">
        <h2 className="font-serif text-base font-semibold text-text mb-3.5 pb-2.5 border-b border-border">
          Anthropic API Key
        </h2>
        <div className="mb-3.5">
          <label className="block text-[12px] font-semibold text-text-2 uppercase tracking-wide mb-1.5">API Key</label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasKey ? "••••••••  (key saved — enter new to replace)" : "sk-ant-…"}
              className="w-full border border-border rounded p-2.5 pr-10 text-[13px] text-text bg-bg outline-none focus:border-navy"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-3 text-[13px]"
            >
              👁
            </button>
          </div>
          <p className="text-[11.5px] text-text-3 mt-1 leading-snug">
            Required for AI Assistant, artifact generation, and transcript analysis. Your key is stored in the server
            database only.
          </p>
        </div>
        <button
          onClick={saveKey}
          className="px-3.5 py-2 text-[12.5px] font-medium bg-navy text-white rounded hover:bg-navy-h"
        >
          Save Settings
        </button>
      </div>

      <div className="mb-7">
        <h2 className="font-serif text-base font-semibold text-text mb-3.5 pb-2.5 border-b border-border">Data</h2>
        <div className="flex gap-2.5 flex-wrap">
          <button
            onClick={exportData}
            className="px-3.5 py-2 text-[12.5px] font-medium text-text-2 border border-border rounded hover:bg-surface-2"
          >
            Export Data (JSON)
          </button>
          <button
            onClick={resetData}
            className="px-3.5 py-2 text-[12.5px] font-medium text-red border border-red-bg rounded hover:bg-red-bg"
          >
            Reset All Data
          </button>
        </div>
        <p className="text-[11.5px] text-text-3 mt-2 leading-snug">
          Export to back up your tasks, decisions, and artifacts.
        </p>
      </div>

      <div>
        <h2 className="font-serif text-base font-semibold text-text mb-3.5 pb-2.5 border-b border-border">About</h2>
        <p className="text-[13px] text-text-2 leading-relaxed">
          TLP Hub is a personal program management tool for the BambooHR Technology Lifecycle Program. Built for JoJo
          Jones, Q2 2026.
        </p>
      </div>
    </div>
  );
}
