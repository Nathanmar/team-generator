import type { SQL, TransactionSQL } from "bun";
import { HTTPException } from "hono/http-exception";
import { sql } from "../db";

export type TechnoType = "front" | "back";
export type Speciality = TechnoType | "fullstack";

/** MemberTechnoInput (openapi.yml). */
export type MemberTechnoInput = { techno_id: number; level: number };

/** MemberTechnoDetail (openapi.yml). */
export type MemberTechno = { techno_id: number; name: string; type: TechnoType; level: number };

// Écart de moyenne front / back en dessous duquel un membre est fullstack.
// Règle provisoire : le contrat dit seulement « selon la moyenne des notes front vs back ».
const FULLSTACK_THRESHOLD = 1;

const average = (levels: number[]) =>
  levels.length === 0 ? 0 : levels.reduce((sum, level) => sum + level, 0) / levels.length;

/** Profil déduit des notes : un côté sans techno compte pour 0. */
export function computeSpeciality(technos: MemberTechno[]): Speciality {
  const front = average(technos.filter((t) => t.type === "front").map((t) => t.level));
  const back = average(technos.filter((t) => t.type === "back").map((t) => t.level));

  if (Math.abs(front - back) < FULLSTACK_THRESHOLD) return "fullstack";
  return front > back ? "front" : "back";
}

/** 422 "Invalid techno id: …" si au moins une techno n'existe pas. */
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

/** Remplace les notes d'un membre (à appeler dans `sql.begin`). */
export async function replaceMemberTechnos(
  memberId: number,
  technos: MemberTechnoInput[],
  tx: TransactionSQL,
): Promise<void> {
  await tx`DELETE FROM levels WHERE member_id = ${memberId}`;
  if (technos.length === 0) return;

  const rows = technos.map((t) => ({ member_id: memberId, techno_id: t.techno_id, experience: t.level }));
  await tx`INSERT INTO levels ${tx(rows)}`;
}

/** Technos détaillées de plusieurs membres en une requête. */
export async function getMembersTechnos(memberIds: number[], db: SQL = sql): Promise<Map<number, MemberTechno[]>> {
  const byMember = new Map<number, MemberTechno[]>(memberIds.map((id) => [id, []]));
  if (memberIds.length === 0) return byMember;

  const rows: (MemberTechno & { member_id: number })[] = await db`
    SELECT l.member_id, l.techno_id, t.name, t.type, l.experience AS level
    FROM levels l
    JOIN technos t ON t.id = l.techno_id
    WHERE l.member_id IN ${db(memberIds)}
    ORDER BY l.member_id, l.techno_id`;
  for (const { member_id, ...techno } of rows) {
    byMember.get(member_id)?.push(techno);
  }
  return byMember;
}
