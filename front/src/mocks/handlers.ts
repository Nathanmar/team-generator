import { delay, http, HttpResponse } from 'msw'
import { API_URL } from '@/api/client'
import {
  memberInputSchema,
  memberUpdateInputSchema,
  type ErrorResponse,
  type MemberTechnoInput,
} from '@/api/schemas'
import { createMember, generateGroups, groups, members, setGroups, technos } from './db'

/**
 * Implémentation simulée de `openapi.yml` (mêmes routes, payloads et codes d'erreur).
 * Activée par `bun dev:mock` ; le reste de l'app ne sait pas qu'elle parle à un mock.
 */

const url = (path: string) => `${API_URL}${path}`

const error = (status: number, error: string, message: string) =>
  HttpResponse.json<ErrorResponse>({ error, message }, { status })

const notFound = () => error(404, 'Not found', 'Member not found')

function parseId(raw: string | readonly string[] | undefined) {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

/** Vérifie que chaque techno existe ; renvoie un message d'erreur sinon. */
function checkTechnos(inputs: MemberTechnoInput[]) {
  const unknown = inputs.find((t) => !technos.some((x) => x.id === t.techno_id))
  return unknown ? `Techno ${unknown.techno_id} does not exist` : null
}

export const handlers = [
  http.all(url('/*'), () => delay()),

  // ---------- Technos ----------
  http.get(url('/technos'), () => HttpResponse.json(technos)),

  // ---------- Members ----------
  http.get(url('/members'), () => HttpResponse.json(members)),

  http.post(url('/members'), async ({ request }) => {
    const body = await request.json().catch(() => undefined)
    if (body === undefined) return error(400, 'Bad request', 'Invalid JSON body')

    const parsed = memberInputSchema.safeParse(body)
    if (!parsed.success) return error(422, 'Validation failed', parsed.error.issues[0].message)
    const technoError = checkTechnos(parsed.data.technos)
    if (technoError) return error(422, 'Validation failed', technoError)

    const { name, first_name, technos: inputs } = parsed.data
    const member = createMember(name, first_name, inputs)
    members.push(member)
    return HttpResponse.json(member, { status: 201 })
  }),

  http.get(url('/members/:id'), ({ params }) => {
    const id = parseId(params.id)
    if (!id) return error(400, 'Bad request', 'Invalid ID format provided')
    const member = members.find((m) => m.id === id)
    return member ? HttpResponse.json(member) : notFound()
  }),

  http.patch(url('/members/:id'), async ({ params, request }) => {
    const id = parseId(params.id)
    if (!id) return error(400, 'Bad request', 'Invalid ID format provided')
    const index = members.findIndex((m) => m.id === id)
    if (index === -1) return notFound()

    const parsed = memberUpdateInputSchema.safeParse(await request.json().catch(() => undefined))
    if (!parsed.success) return error(422, 'Validation failed', parsed.error.issues[0].message)
    const technoError = parsed.data.technos && checkTechnos(parsed.data.technos)
    if (technoError) return error(422, 'Validation failed', technoError)

    const current = members[index]
    const updated = createMember(
      parsed.data.name ?? current.name,
      parsed.data.first_name ?? current.first_name,
      parsed.data.technos ??
        current.technos.map(({ techno_id, level }) => ({ techno_id, level })),
      id,
    )
    members[index] = updated
    return HttpResponse.json(updated)
  }),

  http.delete(url('/members/:id'), ({ params }) => {
    const id = parseId(params.id)
    if (!id) return error(400, 'Bad request', 'Invalid ID format provided')
    const index = members.findIndex((m) => m.id === id)
    if (index === -1) return notFound()

    members.splice(index, 1)
    setGroups(groups.map((g) => ({ ...g, members: g.members.filter((m) => m !== id) })))
    return new HttpResponse(null, { status: 204 })
  }),

  // ---------- Groups ----------
  http.get(url('/groups'), () => HttpResponse.json(groups)),

  http.delete(url('/groups'), () => {
    setGroups([])
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(url('/groups/generate/:capacity'), ({ params }) => {
    const capacity = parseId(params.capacity)
    if (!capacity) return error(400, 'Bad request', 'Capacity must be a positive integer')
    if (members.length < capacity) {
      return error(422, 'Validation failed', 'Not enough registered members to generate groups')
    }

    setGroups(generateGroups(capacity))
    return HttpResponse.json(groups, { status: 201 })
  }),
]
