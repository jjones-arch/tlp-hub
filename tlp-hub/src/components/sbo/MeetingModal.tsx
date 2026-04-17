"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDINALS = ["first", "second", "third", "fourth", "fifth"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getOrdinalLabel(index: number): string {
  return ORDINALS[index - 1] || `${index}th`;
}

function getMonthlyWeekdayLabel(date: string): string {
  if (!date) return "Monthly on the same weekday";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Monthly on the same weekday";
  const dayOfMonth = parsed.getDate();
  const weekday = WEEKDAY_NAMES[parsed.getDay()];
  const ordinal = getOrdinalLabel(Math.floor((dayOfMonth - 1) / 7) + 1);
  return `Monthly on the ${ordinal} ${weekday}`;
}

function getWeeklyLabel(date: string): string {
  if (!date) return "Weekly";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Weekly";
  return `Weekly on ${WEEKDAY_NAMES[parsed.getDay()]}`;
}

function getBiweeklyLabel(date: string): string {
  if (!date) return "Every 2 weeks";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Every 2 weeks";
  return `Every 2 weeks on ${WEEKDAY_NAMES[parsed.getDay()]}`;
}

function getMonthlyByDateLabel(date: string): string {
  if (!date) return "Monthly";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Monthly";
  return `Monthly on day ${parsed.getDate()}`;
}

function getQuarterlyLabel(date: string): string {
  if (!date) return "Quarterly";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Quarterly";
  return `Quarterly on day ${parsed.getDate()}`;
}

function getYearlyLabel(date: string): string {
  if (!date) return "Annually";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Annually";
  return `Annually on ${MONTH_NAMES[parsed.getMonth()]} ${parsed.getDate()}`;
}

function normalizeDateInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export interface MeetingForm {
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

const EMPTY: MeetingForm = {
  title: "",
  description: "",
  date: "",
  endDate: "",
  attendees: "",
  agenda: "",
  notes: "",
  actionItems: "",
  transcript: "",
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

const inputCls =
  "w-full rounded border border-border bg-surface px-3 py-1.5 text-[13px] text-text placeholder:text-text-3 focus:outline-none focus:ring-1 focus:ring-accent";
const selectCls =
  "rounded border border-border bg-surface px-2 py-1.5 text-[13px] text-text focus:outline-none focus:ring-1 focus:ring-accent w-full";
const labelCls = "block text-[12px] font-medium text-text-2 mb-1";
const btnPrimary =
  "rounded bg-navy px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90 transition-opacity";
const btnGhost = "rounded px-3 py-1.5 text-[12.5px] font-medium text-text-2 hover:bg-surface-2 transition-colors";

export function MeetingModal({ open, onClose, onSave, initial, title: modalTitle }: MeetingModalProps) {
  const [form, setForm] = useState<MeetingForm>(EMPTY);
  const [transcriptFileName, setTranscriptFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recurrenceOptions = useMemo(
    () => [
      { value: "none", label: "None" },
      { value: "weekly", label: getWeeklyLabel(form.date) },
      { value: "biweekly", label: getBiweeklyLabel(form.date) },
      { value: "monthly", label: getMonthlyByDateLabel(form.date) },
      { value: "monthly_nth_weekday", label: getMonthlyWeekdayLabel(form.date) },
      { value: "quarterly", label: getQuarterlyLabel(form.date) },
      { value: "yearly", label: getYearlyLabel(form.date) },
    ],
    [form.date],
  );

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form when modal opens with new initial values
      setForm({ ...EMPTY, ...initial });
      setTranscriptFileName("");
    }
  }, [open, initial]);

  function update(field: keyof MeetingForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleTranscriptFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setTranscriptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === "string") update("transcript", text);
    };
    reader.readAsText(file);
  }

  function clearTranscript() {
    update("transcript", "");
    setTranscriptFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSave() {
    if (!form.title.trim()) return;
    const normalizedDate = normalizeDateInput(form.date);
    const normalizedEndDate = normalizeDateInput(form.endDate) || normalizedDate;
    const normalizedRecurrenceEnd = normalizeDateInput(form.recurrenceEnd);

    onSave({
      ...form,
      date: normalizedDate,
      endDate: normalizedEndDate,
      recurrenceEnd: form.recurrence === "none" ? "" : normalizedRecurrenceEnd,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle || "Meeting"}
      footer={
        <>
          <button onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <button onClick={handleSave} className={btnPrimary}>
            Save
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Title</label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className={inputCls}
            placeholder="Meeting title"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => update("endDate", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Attendees</label>
          <input
            value={form.attendees}
            onChange={(e) => update("attendees", e.target.value)}
            className={inputCls}
            placeholder="Comma-separated names"
          />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={2}
            className={inputCls}
            placeholder="Brief description"
          />
        </div>
        <div>
          <label className={labelCls}>Agenda</label>
          <textarea
            value={form.agenda}
            onChange={(e) => update("agenda", e.target.value)}
            rows={3}
            className={inputCls}
            placeholder="Meeting agenda"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Recurrence</label>
            <select
              value={form.recurrence}
              onChange={(e) => update("recurrence", e.target.value)}
              className={selectCls}
            >
              {recurrenceOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {form.recurrence !== "none" && (
            <div>
              <label className={labelCls}>Recurrence End</label>
              <input
                type="date"
                value={form.recurrenceEnd}
                onChange={(e) => update("recurrenceEnd", e.target.value)}
                className={inputCls}
              />
            </div>
          )}
        </div>
        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={2}
            className={inputCls}
            placeholder="Meeting notes"
          />
        </div>
        <div>
          <label className={labelCls}>Action Items</label>
          <textarea
            value={form.actionItems}
            onChange={(e) => update("actionItems", e.target.value)}
            rows={2}
            className={inputCls}
            placeholder="Follow-up action items"
          />
        </div>
        <div>
          <label className={labelCls}>Meeting Transcript</label>
          <div className="flex items-center gap-2 mb-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.vtt,.srt,.md,.doc,.docx,.csv"
              onChange={handleTranscriptFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-text-2 hover:bg-surface-2 transition-colors flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              Upload Transcript
            </button>
            {transcriptFileName && (
              <span className="text-[11.5px] text-text-3 truncate max-w-[200px]" title={transcriptFileName}>
                {transcriptFileName}
              </span>
            )}
            {form.transcript && (
              <button type="button" onClick={clearTranscript} className="text-[11px] text-red hover:underline ml-auto">
                Clear
              </button>
            )}
          </div>
          <textarea
            value={form.transcript}
            onChange={(e) => update("transcript", e.target.value)}
            rows={4}
            className={inputCls}
            placeholder="Paste transcript text or upload a file…"
          />
        </div>
      </div>
    </Modal>
  );
}
