import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { DB_URL } from "./db-path";

const adapter = new PrismaBetterSqlite3({ url: DB_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const recurringMeetings = await prisma.sboMeeting.findMany({
    where: {
      recurrence: { not: "none" },
      recurrenceEnd: { not: "" },
    },
    select: {
      id: true,
      title: true,
      recurrence: true,
      date: true,
      endDate: true,
      recurrenceEnd: true,
    },
  });

  const staleRows = recurringMeetings.filter((meeting) => {
    const endDate = meeting.endDate || "";
    return meeting.recurrenceEnd === meeting.date || (endDate && meeting.recurrenceEnd === endDate);
  });

  if (staleRows.length === 0) {
    console.log("No recurring meetings needed backfill.");
    return;
  }

  const result = await prisma.sboMeeting.updateMany({
    where: {
      id: { in: staleRows.map((meeting) => meeting.id) },
    },
    data: {
      recurrenceEnd: "",
    },
  });

  console.log(`Backfill complete. Updated ${result.count} recurring meetings.`);
  staleRows.forEach((meeting) => {
    console.log(`- ${meeting.title} (${meeting.id}) had recurrenceEnd ${meeting.recurrenceEnd}`);
  });
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
