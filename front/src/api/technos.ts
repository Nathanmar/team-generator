import { useQuery } from '@tanstack/react-query'
import { request } from './client'
import { technoSchema } from './schemas'

export const technosKeys = {
  all: ['technos'] as const,
}

export const technosApi = {
  list: () => request('/technos', { schema: technoSchema.array() }),
}

// Référentiel quasi statique : pas besoin de le recharger.
export const useTechnos = () =>
  useQuery({ queryKey: technosKeys.all, queryFn: technosApi.list, staleTime: Infinity })
