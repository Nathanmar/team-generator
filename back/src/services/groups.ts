import { HTTPException } from "hono/http-exception";
import { sql } from "../db";
import { computeSpeciality, getMembersTechnos, memberLevel, type Speciality } from "./members";

/** Group (openapi.yml). */
export type Group = { id: number; group_name: string; capacity: number; group_level: number; members: number[] };

/** Membre tel que vu par le tirage : `level` = memberLevel (moyenne des moyennes front et back), 0 sans note. */
export type DraftMember = { id: number; speciality: Speciality; level: number };

const SPECIALITY_ORDER: Record<Speciality, number> = { front: 0, back: 1, fullstack: 2 };

// Nombre de tirages comparés : on garde celui dont les niveaux moyens sont les plus proches.
const DRAFT_ATTEMPTS = 30;

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

/**
 * Répartit les membres en ceil(n / capacity) groupes, de tailles égales à 1 près (jamais plus de `capacity`).
 *
 * Tirage « par chapeaux » : les membres sont rangés front → back → fullstack, du plus fort au plus
 * faible, puis découpés en chapeaux d'autant de personnes qu'il y a de groupes. Chaque groupe reçoit
 * une personne par chapeau, placée au hasard parmi les groupes qui ont le moins de son profil :
 * les profils et les niveaux sont répartis, la composition reste aléatoire.
 */
export function draftGroups(members: DraftMember[], capacity: number, random = Math.random): DraftMember[][] {
  const groups: DraftMember[][] = Array.from({ length: Math.ceil(members.length / capacity) }, () => []);
  const ordered = shuffle(members, random).sort(
    (a, b) => SPECIALITY_ORDER[a.speciality] - SPECIALITY_ORDER[b.speciality] || b.level - a.level,
  );

  for (let start = 0; start < ordered.length; start += groups.length) {
    const available = new Set(groups.keys());

    for (const member of ordered.slice(start, start + groups.length)) {
      const sameProfile = (g: number) => groups[g]!.filter((m) => m.speciality === member.speciality).length;
      const fewest = Math.min(...[...available].map(sameProfile));
      const choices = [...available].filter((g) => sameProfile(g) === fewest);
      const pick = choices[Math.floor(random() * choices.length)]!;

      groups[pick]!.push(member);
      available.delete(pick);
    }
  }
  return groups;
}

const averageLevel = (members: DraftMember[]) => average(members.filter((m) => m.level > 0).map((m) => m.level));

/** group_level : moyenne arrondie des niveaux des membres notés (0 si aucun). */
export const groupLevel = (members: DraftMember[]) => Math.round(averageLevel(members));

const levelSpread = (groups: DraftMember[][]) => {
  const levels = groups.map(averageLevel);
  return Math.max(...levels) - Math.min(...levels);
};

/** Meilleur de DRAFT_ATTEMPTS tirages : niveaux plus proches, composition toujours aléatoire. */
export function balancedDraft(members: DraftMember[], capacity: number, random = Math.random): DraftMember[][] {
  let best = draftGroups(members, capacity, random);
  for (let attempt = 1; attempt < DRAFT_ATTEMPTS; attempt++) {
    const candidate = draftGroups(members, capacity, random);
    if (levelSpread(candidate) < levelSpread(best)) best = candidate;
  }
  return best;
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
    const members: DraftMember[] = ids.map((id: number) => {
      const memberTechnos = technos.get(id) ?? [];
      return { id, speciality: computeSpeciality(memberTechnos), level: memberLevel(memberTechnos) };
    });

    await tx`DELETE FROM groups`;

    const created: Group[] = [];
    for (const [index, draft] of balancedDraft(members, capacity).entries()) {
      const group = { group_name: groupName(index), capacity, group_level: groupLevel(draft) };
      const [row] = await tx`INSERT INTO groups ${tx(group)} RETURNING id`;
      const memberIds = draft.map((m) => m.id).sort((a, b) => a - b);
      await tx`INSERT INTO group_members ${tx(memberIds.map((member_id) => ({ group_id: row.id, member_id })))}`;
      created.push({ id: row.id, ...group, members: memberIds });
    }
    return created;
  });
}
