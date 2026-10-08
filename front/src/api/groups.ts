import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from './client'
import { groupInputSchema, groupSchema, type GroupInput } from './schemas'

export const groupsKeys = {
  all: ['groups'] as const,
  detail: (id: number) => ['groups', id] as const,
}

export const groupsApi = {
  list: () => request('/groups', { schema: groupSchema.array() }),
  get: (id: number) => request(`/groups/${id}`, { schema: groupSchema }),
  create: (input: GroupInput) =>
    request('/groups', {
      method: 'POST',
      body: groupInputSchema.parse(input),
      schema: groupSchema,
    }),
  generate: (capacity: number) =>
    request(`/groups/generate/${capacity}`, { method: 'POST', schema: groupSchema.array() }),
  remove: (id: number) => request(`/groups/${id}`, { method: 'DELETE' }),
}

export const useGroups = () => useQuery({ queryKey: groupsKeys.all, queryFn: groupsApi.list })

export const useGroup = (id: number) =>
  useQuery({ queryKey: groupsKeys.detail(id), queryFn: () => groupsApi.get(id) })

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: groupsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: groupsKeys.all }),
  })
}

export function useGenerateGroups() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: groupsApi.generate,
    onSuccess: () => qc.invalidateQueries({ queryKey: groupsKeys.all }),
  })
}

export function useDeleteGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: groupsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: groupsKeys.all }),
  })
}
