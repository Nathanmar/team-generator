import { HTTPException } from "hono/http-exception";
import { sql } from "../db";
import { computeSpeciality, getMembersTechnos, memberLevel, type Speciality } from "./members";

/** Group (openapi.yml). */
export type Group = { id: number; group_name: string; capacity: number; group_level: number; members: number[] };

/** Membre tel que vu par le tirage : `level` = memberLevel (moyenne des moyennes front et back), 0 sans note. */
export type DraftMember = { id: number; speciality: Speciality; level: number };

// Coefficients d'équilibrage : un fullstack compte comme un front ET un back (2 au total),
// un front ou un back compte pour 1 de son côté. Un membre sans note ne couvre rien.
const COVERAGE: Record<Speciality, { front: number; back: number }> = {
  front: { front: 1, back: 0 },
  back: { front: 0, back: 1 },
  fullstack: { front: 1, back: 1 },
};

// Poids de l'équilibre front / back face à celui des niveaux (prioritaire).
const COVERAGE_WEIGHT = 10;

const GREEK = [
  "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa", "Lambda", "Mu",
  "Nu", "Xi", "Omicron", "Pi", "Rho", "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega",
];

const average = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

const coverage = (member: DraftMember) => (member.level === 0 ? { front: 0, back: 0 } : COVERAGE[member.speciality]);

const averageLevel = (members: DraftMember[]) => average(members.filter((m) => m.level > 0).map((m) => m.level));

/** group_level : moyenne arrondie des niveaux des membres notés (0 si aucun). */
export const groupLevel = (members: DraftMember[]) => Math.round(averageLevel(members));

/**
 * Répartit les membres en ceil(n / capacity) groupes, de tailles égales à 1 près (jamais plus de `capacity`).
 *
 * Part d'une répartition aléatoire, puis échange des membres entre groupes tant que ça rapproche
 * chaque groupe de sa part de front et de back (COVERAGE), puis du niveau moyen de la promo.
 * Ex. front + back + fullstack en groupes de 2 → { front, back } et { fullstack }.
 */
export function draftGroups(members: DraftMember[], capacity: number, random = Math.random): DraftMember[][] {
  const groups: DraftMember[][] = Array.from({ length: Math.ceil(members.length / capacity) }, () => []);
  shuffle(members, random).forEach((member, i) => groups[i % groups.length]!.push(member));

  const total = (list: DraftMember[], side: "front" | "back") => list.reduce((sum, m) => sum + coverage(m)[side], 0);
  const totalFront = total(members, "front");
  const totalBack = total(members, "back");
  const meanLevel = averageLevel(members);

  // Écart d'un groupe à sa juste part (proportionnelle à sa taille).
  const cost = (group: DraftMember[]) => {
    const share = group.length / members.length;
    const sides = (total(group, "front") - totalFront * share) ** 2 + (total(group, "back") - totalBack * share) ** 2;
    const level = group.some((m) => m.level > 0) ? (averageLevel(group) - meanLevel) ** 2 : 0;
    return COVERAGE_WEIGHT * sides + level;
  };

  const costs = groups.map(cost);
  let improved = true;
  while (improved) {
    improved = false;
    for (const a of shuffle([...groups.keys()], random)) {
      for (const b of shuffle([...groups.keys()], random)) {
        if (a >= b) continue;
        for (let i = 0; i < groups[a]!.length; i++) {
          for (let j = 0; j < groups[b]!.length; j++) {
            const x = groups[a]![i]!;
            const y = groups[b]![j]!;
            if (x.speciality === y.speciality && x.level === y.level) continue;

            const nextA = groups[a]!.with(i, y);
            const nextB = groups[b]!.with(j, x);
            const [costA, costB] = [cost(nextA), cost(nextB)];
            if (costA + costB < costs[a]! + costs[b]! - 1e-9) {
              [groups[a], groups[b], costs[a], costs[b]] = [nextA, nextB, costA, costB];
              improved = true;
            }
          }
        }
      }
    }
  }
  return groups;
}

export const groupName = (index: number) => `Squad ${GREEK[index] ?? index + 1}`;

// json_agg plutôt qu'array_agg : Bun renvoie les int[] en Int32Array dès la 2e exécution
// d'une requête, ce qui se sérialise en objet {"0": …} au lieu d'un tableau.
export async function listGroups(): Promise<Group[]> {
  return await sql`
    SELECT g.id, g.group_name, g.capacity, g.group_level,
      COALESCE(json_agg(gm.member_id ORDER BY gm.member_id) FILTER (WHERE gm.member_id IS NOT NULL), '[]') AS members
    FROM groups g
    LEFT JOIN group_members gm ON gm.group_id = g.id
    GROUP BY g.id
    ORDER BY g.id`;
}

/** Nouveau tirage : remplace les groupes existants (GET /groups = dernier tirage). */
export async function generateGroups(capacity: number): Promise<Group[]> {
  return await sql.begin(async (tx) => {
    // Deux tirages simultanés ne doivent pas s'entremêler.
    await tx`LOCK TABLE groups IN EXCLUSIVE MODE`;

    const ids = (await tx`SELECT id FROM members ORDER BY id`).map((row: { id: number }) => row.id);
    if (ids.length < capacity) {
      throw new HTTPException(422, { message: "Not enough registered members to generate groups" });
    }

    const technos = await getMembersTechnos(ids, tx);
    if (ids.some((id: number) => (technos.get(id) ?? []).length === 0)) {
      throw new HTTPException(422, { message: "Every member must have at least one techno to generate groups" });
    }
    const members: DraftMember[] = ids.map((id: number) => {
      const memberTechnos = technos.get(id) ?? [];
      return { id, speciality: computeSpeciality(memberTechnos), level: memberLevel(memberTechnos) };
    });

    await tx`DELETE FROM groups`;

    const created: Group[] = [];
    for (const [index, draft] of draftGroups(members, capacity).entries()) {
      const group = { group_name: groupName(index), capacity, group_level: groupLevel(draft) };
      const [row] = await tx`INSERT INTO groups ${tx(group)} RETURNING id`;
      const memberIds = draft.map((m) => m.id).sort((a, b) => a - b);
      await tx`INSERT INTO group_members ${tx(memberIds.map((member_id) => ({ group_id: row.id, member_id })))}`;
      created.push({ id: row.id, ...group, members: memberIds });
    }
    return created;
  });
}
