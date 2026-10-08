import { z } from 'zod'

/**
 * Schémas Zod alignés sur `openapi.yml` (components/schemas).
 * Toute évolution du contrat doit être répercutée ici.
 */

const id = z.number().int().positive()

// ---------- Technos ----------
export const technoSchema = z.object({ 
  id, 
  name: z.string(),
  type: z.enum(['front', 'back'])
})

export const memberTechnoInputSchema = z.object({
  techno_id: id,
  level: z.number().int().min(1).max(5),
})

export const memberTechnoDetailSchema = z.object({
  techno_id: id,
  name: z.string(),
  type: z.enum(['front', 'back']),
  level: z.number().int().min(1).max(5),
})

// ---------- Members ----------
export const memberInputSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis'),
  first_name: z.string().trim().min(1, 'Le prénom est requis'),
  technos: z.array(memberTechnoInputSchema),
})

export const memberUpdateInputSchema = memberInputSchema.partial()

export const memberSchema = z.object({
  id,
  name: z.string().trim().min(1, 'Le nom est requis'),
  first_name: z.string().trim().min(1, 'Le prénom est requis'),
  speciality: z.enum(['front', 'back', 'fullstack']),
  technos: z.array(memberTechnoDetailSchema),
})

// ---------- Groups ----------
export const groupInputSchema = z.object({
  members: z.array(id),
  group_level: z.number().int(),
  group_name: z.string().trim().min(1, 'Le nom du groupe est requis'),
  capacity: z.number().int().positive('La capacité doit être supérieure à 0'),
})

export const groupSchema = groupInputSchema.extend({ id })

/** Paramètre de chemin de `POST /groups/generate/{capacity}`. */
export const generateGroupsParamsSchema = z.object({
  capacity: z.coerce.number().int().positive('La capacité doit être supérieure à 0'),
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
export type MemberTechnoInput = z.infer<typeof memberTechnoInputSchema>
export type MemberTechnoDetail = z.infer<typeof memberTechnoDetailSchema>
export type Group = z.infer<typeof groupSchema>
export type GroupInput = z.infer<typeof groupInputSchema>
export type Techno = z.infer<typeof technoSchema>
export type ErrorResponse = z.infer<typeof errorResponseSchema>
