import type { Group, Member, MemberTechnoInput, Techno } from '@/api/schemas'

/**
 * Base en mémoire du mock : reproduit l'état que le back exposerait.
 * Réinitialisée à chaque rechargement de la page.
 */

// ---------- Règles métier simulées (à terme portées par le back) ----------

const average = (values: number[]) =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0

/** Spécialité déduite de la moyenne des notes front vs back (écart < 1 => fullstack). */
function computeSpeciality(technos: Member['technos']): Member['speciality'] {
  const front = average(technos.filter((t) => t.type === 'front').map((t) => t.level))
  const back = average(technos.filter((t) => t.type === 'back').map((t) => t.level))
  if (Math.abs(front - back) < 1) return 'fullstack'
  return front > back ? 'front' : 'back'
}

const memberLevel = (m: Member) => average(m.technos.map((t) => t.level))

// ---------- Données ----------

export const technos: Techno[] = [
  { id: 1, name: 'React', type: 'front' },
  { id: 2, name: 'Hono', type: 'back' },
  { id: 3, name: 'TypeScript', type: 'front' },
  { id: 4, name: 'PostgreSQL', type: 'back' },
  { id: 5, name: 'Vue', type: 'front' },
  { id: 6, name: 'Tailwind CSS', type: 'front' },
  { id: 7, name: 'Node.js', type: 'back' },
  { id: 8, name: 'Docker', type: 'back' },
]

let nextMemberId = 1
let nextGroupId = 1

export function createMember(
  name: string,
  first_name: string,
  inputs: MemberTechnoInput[],
  id = nextMemberId++,
): Member {
  const details = inputs.map(({ techno_id, level }) => {
    const techno = technos.find((t) => t.id === techno_id)!
    return { techno_id, name: techno.name, type: techno.type, level }
  })
  return { id, name, first_name, speciality: computeSpeciality(details), technos: details }
}

type MemberSeed = [name: string, firstName: string, levels: Record<number, number>]

const seed: MemberSeed[] = [
  ['Dupont', 'Jean', { 1: 4, 2: 2, 3: 4 }],
  ['Martin', 'Alice', { 2: 5, 4: 4, 8: 3 }],
  ['Bernard', 'Lucas', { 1: 3, 3: 3, 6: 5 }],
  ['Petit', 'Emma', { 4: 3, 7: 4, 2: 3 }],
  ['Durand', 'Hugo', { 1: 5, 3: 5, 7: 4, 4: 4 }],
  ['Leroy', 'Chloé', { 5: 4, 6: 4 }],
  ['Moreau', 'Nathan', { 7: 2, 8: 2, 4: 1 }],
  ['Simon', 'Léa', { 1: 2, 5: 3, 3: 2 }],
  ['Laurent', 'Tom', { 2: 4, 7: 5, 8: 4 }],
  ['Michel', 'Inès', { 1: 3, 2: 3, 3: 3, 4: 3 }],
]

export const members: Member[] = seed.map(([name, firstName, levels]) =>
  createMember(
    name,
    firstName,
    Object.entries(levels).map(([technoId, level]) => ({ techno_id: Number(technoId), level })),
  ),
)

export let groups: Group[] = []

export function setGroups(next: Group[]) {
  groups = next
}

// ---------- Génération ----------

const GROUP_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta']

/**
 * Forme des groupes équilibrés de `capacity` personnes au plus (tailles à ±1 près).
 * Spécialités les plus rares d'abord (fullstack en dernier, comme variable d'ajustement),
 * meilleurs niveaux d'abord : chaque membre rejoint le groupe non plein qui a le moins
 * de profils identiques, puis le niveau cumulé le plus faible.
 */
export function generateGroups(capacity: number): Group[] {
  const count = Math.ceil(members.length / capacity)
  const sizes = Array.from(
    { length: count },
    (_, i) => Math.floor(members.length / count) + (i < members.length % count ? 1 : 0),
  )

  const bySpeciality = (s: Member['speciality']) => members.filter((m) => m.speciality === s)
  const rank = (s: Member['speciality']) =>
    s === 'fullstack' ? Infinity : bySpeciality(s).length
  const sorted = [...members].sort(
    (a, b) => rank(a.speciality) - rank(b.speciality) || memberLevel(b) - memberLevel(a),
  )

  const buckets: Member[][] = Array.from({ length: count }, () => [])
  const score = (bucket: Member[], m: Member) => [
    bucket.filter((x) => x.speciality === m.speciality).length,
    bucket.reduce((sum, x) => sum + memberLevel(x), 0),
  ]
  for (const m of sorted) {
    const target = buckets
      .filter((bucket, i) => bucket.length < sizes[i])
      .reduce((best, bucket) => {
        const [a1, a2] = score(bucket, m)
        const [b1, b2] = score(best, m)
        return a1 < b1 || (a1 === b1 && a2 < b2) ? bucket : best
      })
    target.push(m)
  }

  return buckets.map((bucket, i) => ({
    id: nextGroupId++,
    group_name: `Squad ${GROUP_NAMES[i] ?? i + 1}`,
    capacity,
    group_level: Math.round(average(bucket.map(memberLevel))),
    members: bucket.map((m) => m.id),
  }))
}
