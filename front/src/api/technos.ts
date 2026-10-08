import { useQuery } from '@tanstack/react-query'
import { request } from './client'
import { technoSchema } from './schemas'

export const technosKeys = {
  all: ['technos'] as const,
  detail: (id: number) => ['technos', id] as const,
}

export const technosApi = {
  list: () => request('/technos', { schema: technoSchema.array() }),
  get: (id: number) => request(`/technos/${id}`, { schema: technoSchema }),
}

// Référentiel quasi statique : pas besoin de le recharger.
export const useTechnos = () =>
  useQuery({ queryKey: technosKeys.all, queryFn: technosApi.list, staleTime: Infinity })

export const useTechno = (id: number) =>
  useQuery({ queryKey: technosKeys.detail(id), queryFn: () => technosApi.get(id) })
