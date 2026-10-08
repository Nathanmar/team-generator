import type { SQL, TransactionSQL } from "bun";
import { HTTPException } from "hono/http-exception";
import { sql } from "../db";

export type TechnoType = "front" | "back" | "fullstack";
export type Speciality = "front" | "back" | "fullstack";

/** MemberTechnoInput (openapi.yml). */
export type MemberTechnoInput = { techno_id: number; level: number };

/** MemberTechnoDetail (openapi.yml). */
export type MemberTechno = { techno_id: number; name: string; type: TechnoType; level: number };

const FULLSTACK_RATIO = 0.2;

const average = (levels: number[]) =>
  levels.length === 0 ? null : levels.reduce((sum, level) => sum + level, 0) / levels.length;

/** Moyennes des notes front et back (null si aucune note) ; une techno fullstack compte des deux côtés. */
export function sideAverages(technos: MemberTechno[]): { front: number | null; back: number | null } {
  const side = (type: "front" | "back") =>
    average(technos.filter((t) => t.type === type || t.type === "fullstack").map((t) => t.level));
  return { front: side("front"), back: side("back") };
}

export function computeSpeciality(technos: MemberTechno[]): Speciality {
  const score = (type: "front" | "back") =>
    technos.filter((t) => t.type === type || t.type === "fullstack").reduce((sum, t) => sum + t.level, 0);
  const front = score("front");
  const back = score("back");

  if (Math.abs(front - back) <= FULLSTACK_RATIO * Math.max(front, back)) return "fullstack";
  return front > back ? "front" : "back";
}

/** Niveau utilisé pour les groupes : moyenne des moyennes front et back (côté sans note ignoré), 0 sans note. */
export function memberLevel(technos: MemberTechno[]): number {
  const { front, back } = sideAverages(technos);
  return average([front, back].filter((side): side is number => side !== null)) ?? 0;
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
