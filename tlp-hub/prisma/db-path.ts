import path from "path";

export const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");
export const DB_URL = `file:${DB_PATH}`;
