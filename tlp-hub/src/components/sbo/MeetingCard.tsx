"use client";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ORDINAL_SHORT = ["1st", "2nd", "3rd", "4th", "5th"];

interface MeetingCardProps {
  meeting: {
    id: string;
    title: string;
    date: string;
    endDate: string;
    attendees: string;
    description: string;
    agenda: string;
    notes: string;
    actionItems: string;
    transcript: string;
    recurrence: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

function recurrenceLabel(recurrence: string, date: string): string {
  if (!recurrence || recurrence === "none") return "";
  const parsed = date ? new Date(`${date}T00:00:00`) : null;
  const hasValidDate = !!parsed && !Number.isNaN(parsed.getTime());
  const weekday = hasValidDate ? WEEKDAY_SHORT[parsed!.getDay()] : "";
  const day = hasValidDate ? parsed!.getDate() : 0;

  switch (recurrence) {
    case "weekly":
      return hasValidDate ? `Weekly (${weekday})` : "Weekly";
    case "biweekly":
      return hasValidDate ? `Every 2 weeks (${weekday})` : "Every 2 weeks";
    case "monthly":
      return hasValidDate ? `Monthly (day ${day})` : "Monthly";
    case "monthly_nth_weekday":
      if (!hasValidDate) return "Monthly (weekday pattern)";
      return `Monthly (${ORDINAL_SHORT[Math.floor((day - 1) / 7)]} ${weekday})`;
    case "quarterly":
      return hasValidDate ? `Quarterly (day ${day})` : "Quarterly";
    case "yearly":
      return hasValidDate ? `Annually (${MONTH_SHORT[parsed!.getMonth()]} ${day})` : "Annually";
    default:
      return recurrence;
  }
}

export function MeetingCard({ meeting, onEdit, onDelete }: MeetingCardProps) {
  const recLabel = recurrenceLabel(meeting.recurrence, meeting.date);
  const isPast = meeting.date && meeting.date < new Date().toISOString().slice(0, 10);

  return (
    <div className={`border border-border rounded-lg p-4 bg-surface group ${isPast ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-[13.5px] font-semibold text-text truncate">{meeting.title}</h4>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {meeting.date && (
              <span className="text-[11.5px] text-text-2 tabular-nums">
                {meeting.date}
                {meeting.endDate && meeting.endDate !== meeting.date ? ` — ${meeting.endDate}` : ""}
              </span>
            )}
            {recLabel && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-accent bg-accent-bg px-1.5 py-0.5 rounded">
                {recLabel}
              </span>
            )}
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity ml-2">
          {onEdit && (
            <button onClick={onEdit} className="text-text-3 hover:text-text text-[13px]">
              ✎
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="text-text-3 hover:text-red text-[13px]">
              ✕
            </button>
          )}
        </div>
      </div>

      {meeting.attendees && (
        <p className="text-[11.5px] text-text-3 mb-1.5">
          <span className="font-medium text-text-2">Attendees:</span> {meeting.attendees}
        </p>
      )}
      {meeting.description && <p className="text-[12px] text-text-2 mb-1.5 leading-relaxed">{meeting.description}</p>}
      {meeting.agenda && (
        <div className="mt-2 pt-2 border-t border-border-lt">
          <p className="text-[10.5px] font-semibold text-text-2 uppercase tracking-wider mb-1">Agenda</p>
          <p className="text-[12px] text-text-2 leading-relaxed whitespace-pre-line">{meeting.agenda}</p>
        </div>
      )}
      {meeting.notes && (
        <div className="mt-2 pt-2 border-t border-border-lt">
          <p className="text-[10.5px] font-semibold text-text-2 uppercase tracking-wider mb-1">Notes</p>
          <p className="text-[12px] text-text-2 leading-relaxed whitespace-pre-line">{meeting.notes}</p>
        </div>
      )}
      {meeting.actionItems && (
        <div className="mt-2 pt-2 border-t border-border-lt">
          <p className="text-[10.5px] font-semibold text-text-2 uppercase tracking-wider mb-1">Action Items</p>
          <p className="text-[12px] text-text-2 leading-relaxed whitespace-pre-line">{meeting.actionItems}</p>
        </div>
      )}
      {meeting.transcript && (
        <div className="mt-2 pt-2 border-t border-border-lt">
          <p className="text-[10.5px] font-semibold text-text-2 uppercase tracking-wider mb-1">Transcript</p>
          <p className="text-[12px] text-text-2 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto">
            {meeting.transcript}
          </p>
        </div>
      )}
    </div>
  );
}
