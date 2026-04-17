export interface MeetingOccurrence {
  id: string;
  meetingId: string;
  title: string;
  date: string;
  endDate: string;
  sboId: string;
  sboName?: string;
  recurrence: string;
  attendees: string;
  description: string;
  agenda: string;
  notes: string;
  actionItems: string;
  transcript: string;
}

interface BaseMeeting {
  id: string;
  title: string;
  date: string;
  endDate: string;
  sboId: string;
  recurrence: string;
  recurrenceEnd: string;
  attendees: string;
  description: string;
  agenda: string;
  notes: string;
  actionItems: string;
  transcript: string;
  sbo?: { id: string; name: string };
}

function getNthWeekdayDate(year: number, month: number, weekday: number, nth: number): Date | null {
  const firstOfMonth = new Date(year, month, 1);
  const offset = (weekday - firstOfMonth.getDay() + 7) % 7;
  const dayOfMonth = 1 + offset + (nth - 1) * 7;
  const candidate = new Date(year, month, dayOfMonth);
  if (candidate.getMonth() !== month) return null;
  return candidate;
}

function addInterval(dateStr: string, recurrence: string): string {
  const d = new Date(dateStr + "T00:00:00");
  switch (recurrence) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
    case "monthly_nth_weekday": {
      const weekday = d.getDay();
      const nth = Math.floor((d.getDate() - 1) / 7) + 1;
      const targetMonth = d.getMonth() + 1;
      const targetYear = targetMonth > 11 ? d.getFullYear() + 1 : d.getFullYear();
      const normalizedMonth = targetMonth % 12;
      const next = getNthWeekdayDate(targetYear, normalizedMonth, weekday, nth);
      if (!next) {
        // Some months do not have a 5th weekday; skip ahead until we find a valid month.
        for (let i = 2; i <= 12; i++) {
          const iterMonth = d.getMonth() + i;
          const iterYear = d.getFullYear() + Math.floor(iterMonth / 12);
          const normalizedIterMonth = ((iterMonth % 12) + 12) % 12;
          const fallback = getNthWeekdayDate(iterYear, normalizedIterMonth, weekday, nth);
          if (fallback) return fallback.toISOString().slice(0, 10);
        }
        return "";
      }
      return next.toISOString().slice(0, 10);
    }
    default:
      return "";
  }
  return d.toISOString().slice(0, 10);
}

export function expandMeetings(
  meetings: BaseMeeting[],
  rangeStart: string,
  rangeEnd: string,
  limit = 200,
): MeetingOccurrence[] {
  const results: MeetingOccurrence[] = [];

  for (const m of meetings) {
    if (!m.date) continue;

    const baseDate = m.date.slice(0, 10);
    const sboName = m.sbo?.name;

    if (m.recurrence === "none" || !m.recurrence) {
      if (baseDate >= rangeStart && baseDate <= rangeEnd) {
        results.push({
          id: m.id,
          meetingId: m.id,
          title: m.title,
          date: baseDate,
          endDate: m.endDate?.slice(0, 10) || baseDate,
          sboId: m.sboId,
          sboName,
          recurrence: m.recurrence,
          attendees: m.attendees,
          description: m.description,
          agenda: m.agenda,
          notes: m.notes,
          actionItems: m.actionItems,
          transcript: m.transcript,
        });
      }
      continue;
    }

    let current = baseDate;
    const recEnd = m.recurrenceEnd?.slice(0, 10) || rangeEnd;
    const effectiveEnd = recEnd < rangeEnd ? recEnd : rangeEnd;
    let idx = 0;

    while (current <= effectiveEnd && results.length < limit) {
      if (current >= rangeStart) {
        results.push({
          id: `${m.id}-${idx}`,
          meetingId: m.id,
          title: m.title,
          date: current,
          endDate: m.endDate ? current : current,
          sboId: m.sboId,
          sboName,
          recurrence: m.recurrence,
          attendees: m.attendees,
          description: m.description,
          agenda: m.agenda,
          notes: m.notes,
          actionItems: m.actionItems,
          transcript: m.transcript,
        });
      }
      current = addInterval(current, m.recurrence);
      if (!current) break;
      idx++;
    }
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
}
