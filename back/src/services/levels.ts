import type { SQL } from "bun";
import { HTTPException } from "hono/http-exception";
import { sql } from "../db";

export async function assertTechnosExist(ids: number[], db: SQL = sql): Promise<void> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return;

  const rows: { id: number }[] = await db`SELECT id FROM technos WHERE id IN ${db(unique)}`;
  const found = new Set(rows.map((row) => row.id));
  const missing = unique.filter((id) => !found.has(id));

  if (missing.length > 0) {
    throw new HTTPException(422, { message: `Invalid techno id: ${missing.join(", ")}` });
  }
}

export async function computeGroupLevel(memberIds: number[], db: SQL = sql): Promise<number> {
  if (memberIds.length === 0) return 1;

  const [row]: { level: number | null }[] = await db`
    SELECT ROUND(AVG(experience))::int AS level FROM levels
    WHERE member_id IN ${db(memberIds)}`;
  return row?.level ?? 1;
}
