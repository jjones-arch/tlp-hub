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
  sbo?: { id: string; name: string };
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
        });
      }
      current = addInterval(current, m.recurrence);
      if (!current) break;
      idx++;
    }
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
}
