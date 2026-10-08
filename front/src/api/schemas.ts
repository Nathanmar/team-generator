import { z } from 'zod'

/**
 * Schémas Zod alignés sur `openapi.yml` (components/schemas).
 * Toute évolution du contrat doit être répercutée ici.
 */

const id = z.int().positive()

// ---------- Members ----------
export const memberInputSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis'),
  first_name: z.string().trim().min(1, 'Le prénom est requis'),
  technos: z.array(id),
  speciality_id: id,
})

export const memberUpdateInputSchema = memberInputSchema.partial()

export const memberSchema = memberInputSchema.extend({ id })

// ---------- Groups ----------
export const groupInputSchema = z.object({
  members: z.array(id),
  group_level: z.int(),
  group_name: z.string().trim().min(1, 'Le nom du groupe est requis'),
  capacity: z.int().positive('La capacité doit être supérieure à 0'),
})

export const groupSchema = groupInputSchema.extend({ id })

/** Paramètre de chemin de `POST /groups/generate/{capacity}`. */
export const generateGroupsParamsSchema = z.object({
  capacity: z.coerce.number().int().positive('La capacité doit être supérieure à 0'),
})

// ---------- Référentiels ----------
export const technoSchema = z.object({ id, name: z.string() })

export const specialitySchema = z.object({ id, name: z.string() })

export const levelSchema = z.object({
  experience: z.int(),
  member_id: id,
  techno_id: id,
})

// ---------- Erreurs ----------
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
})

// ---------- Types ----------
export type Member = z.infer<typeof memberSchema>
export type MemberInput = z.infer<typeof memberInputSchema>
export type MemberUpdateInput = z.infer<typeof memberUpdateInputSchema>
export type Group = z.infer<typeof groupSchema>
export type GroupInput = z.infer<typeof groupInputSchema>
export type Techno = z.infer<typeof technoSchema>
export type Speciality = z.infer<typeof specialitySchema>
export type Level = z.infer<typeof levelSchema>
export type ErrorResponse = z.infer<typeof errorResponseSchema>
