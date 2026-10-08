import type { z } from 'zod'
import { errorResponseSchema, type ErrorResponse } from './schemas'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

/** Erreur HTTP normalisée selon `ErrorResponse` du contrat. */
export class ApiError extends Error {
  readonly status: number
  readonly error: string

  constructor(status: number, body: ErrorResponse) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.error = body.error
  }
}

type RequestOptions<T> = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Schéma de la réponse. Omis pour les réponses 204 (No Content). */
  schema?: z.ZodType<T>
}

export async function request<T = void>(
  path: string,
  { method = 'GET', body, schema }: RequestOptions<T> = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const json = await res.json().catch(() => null)
    const parsed = errorResponseSchema.safeParse(json)
    throw new ApiError(
      res.status,
      parsed.success ? parsed.data : { error: res.statusText, message: `HTTP ${res.status}` },
    )
  }

  if (res.status === 204 || !schema) return undefined as T

  // Valide la réponse contre le contrat : une dérive du back est détectée immédiatement.
  return schema.parse(await res.json())
}
