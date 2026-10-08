import type { SQL } from "bun";
import { HTTPException } from "hono/http-exception";
import { sql } from "../db";

export async function assertSpecialityExists(id: number, db: SQL = sql): Promise<void> {
  const [row] = await db`SELECT 1 FROM specialities WHERE id = ${id}`;
  if (!row) {
    throw new HTTPException(422, { message: "Invalid speciality_id" });
  }
}

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

export async function setMemberTechnos(memberId: number, ids: number[], db: SQL = sql): Promise<void> {
  await db`DELETE FROM levels WHERE member_id = ${memberId}`;

  const unique = [...new Set(ids)];
  if (unique.length === 0) return;

  const rows = unique.map((technoId) => ({ member_id: memberId, techno_id: technoId }));
  await db`INSERT INTO levels ${db(rows)}`;
}

export async function getMemberTechnos(memberId: number, db: SQL = sql): Promise<number[]> {
  const rows: { techno_id: number }[] =
    await db`SELECT techno_id FROM levels WHERE member_id = ${memberId} ORDER BY techno_id`;
  return rows.map((row) => row.techno_id);
}

export async function getTechnosByMembers(memberIds: number[], db: SQL = sql): Promise<Map<number, number[]>> {
  const byMember = new Map<number, number[]>(memberIds.map((id) => [id, []]));
  if (memberIds.length === 0) return byMember;

  const rows: { member_id: number; techno_id: number }[] = await db`
    SELECT member_id, techno_id FROM levels
    WHERE member_id IN ${db(memberIds)}
    ORDER BY member_id, techno_id`;
  for (const row of rows) {
    byMember.get(row.member_id)?.push(row.techno_id);
  }
  return byMember;
}

export async function computeGroupLevel(memberIds: number[], db: SQL = sql): Promise<number> {
  if (memberIds.length === 0) return 1;

  const [row]: { level: number | null }[] = await db`
    SELECT ROUND(AVG(experience))::int AS level FROM levels
    WHERE member_id IN ${db(memberIds)}`;
  return row?.level ?? 1;
}
