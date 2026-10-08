import { useQuery } from '@tanstack/react-query'
import { request } from './client'
import { specialitySchema } from './schemas'

export const specialitiesKeys = {
  all: ['specialities'] as const,
  detail: (id: number) => ['specialities', id] as const,
}

export const specialitiesApi = {
  list: () => request('/specialities', { schema: specialitySchema.array() }),
  get: (id: number) => request(`/specialities/${id}`, { schema: specialitySchema }),
}

// Référentiel quasi statique : pas besoin de le recharger.
export const useSpecialities = () =>
  useQuery({ queryKey: specialitiesKeys.all, queryFn: specialitiesApi.list, staleTime: Infinity })

export const useSpeciality = (id: number) =>
  useQuery({ queryKey: specialitiesKeys.detail(id), queryFn: () => specialitiesApi.get(id) })
