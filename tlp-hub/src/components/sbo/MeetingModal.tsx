"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";

const RECURRENCES = [
  { value: "none", label: "None" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

export interface MeetingForm {
  title: string;
  description: string;
  date: string;
  endDate: string;
  attendees: string;
  agenda: string;
  notes: string;
  actionItems: string;
  recurrence: string;
  recurrenceEnd: string;
}

const EMPTY: MeetingForm = {
  title: "",
  description: "",
  date: "",
  endDate: "",
  attendees: "",
  agenda: "",
  notes: "",
  actionItems: "",
  recurrence: "none",
  recurrenceEnd: "",
};

interface MeetingModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (form: MeetingForm) => void;
  initial?: Partial<MeetingForm>;
  title?: string;
}

const inputCls = "w-full rounded border border-border bg-surface px-3 py-1.5 text-[13px] text-text placeholder:text-text-3 focus:outline-none focus:ring-1 focus:ring-accent";
const selectCls = "rounded border border-border bg-surface px-2 py-1.5 text-[13px] text-text focus:outline-none focus:ring-1 focus:ring-accent w-full";
const labelCls = "block text-[12px] font-medium text-text-2 mb-1";
const btnPrimary = "rounded bg-navy px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90 transition-opacity";
const btnGhost = "rounded px-3 py-1.5 text-[12.5px] font-medium text-text-2 hover:bg-surface-2 transition-colors";

export function MeetingModal({ open, onClose, onSave, initial, title: modalTitle }: MeetingModalProps) {
  const [form, setForm] = useState<MeetingForm>(EMPTY);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...initial });
    }
  }, [open, initial]);

  function update(field: keyof MeetingForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!form.title.trim()) return;
    onSave(form);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle || "Meeting"}
      footer={
        <>
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={handleSave} className={btnPrimary}>Save</button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Title</label>
          <input value={form.title} onChange={(e) => update("title", e.target.value)} className={inputCls} placeholder="Meeting title" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>End Date</label>
            <input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Attendees</label>
          <input value={form.attendees} onChange={(e) => update("attendees", e.target.value)} className={inputCls} placeholder="Comma-separated names" />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} className={inputCls} placeholder="Brief description" />
        </div>
        <div>
          <label className={labelCls}>Agenda</label>
          <textarea value={form.agenda} onChange={(e) => update("agenda", e.target.value)} rows={3} className={inputCls} placeholder="Meeting agenda" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Recurrence</label>
            <select value={form.recurrence} onChange={(e) => update("recurrence", e.target.value)} className={selectCls}>
              {RECURRENCES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          {form.recurrence !== "none" && (
            <div>
              <label className={labelCls}>Recurrence End</label>
              <input type="date" value={form.recurrenceEnd} onChange={(e) => update("recurrenceEnd", e.target.value)} className={inputCls} />
            </div>
          )}
        </div>
        <div>
          <label className={labelCls}>Notes</label>
          <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2} className={inputCls} placeholder="Meeting notes" />
        </div>
        <div>
          <label className={labelCls}>Action Items</label>
          <textarea value={form.actionItems} onChange={(e) => update("actionItems", e.target.value)} rows={2} className={inputCls} placeholder="Follow-up action items" />
        </div>
      </div>
    </Modal>
  );
}
