import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from './client'
import { groupSchema } from './schemas'

export const groupsKeys = {
  all: ['groups'] as const,
}

export const groupsApi = {
  list: () => request('/groups', { schema: groupSchema.array() }),
  generate: (capacity: number) =>
    request(`/groups/generate/${capacity}`, { method: 'POST', schema: groupSchema.array() }),
  reset: () => request('/groups', { method: 'DELETE' }),
}

export const useGroups = () => useQuery({ queryKey: groupsKeys.all, queryFn: groupsApi.list })

export function useGenerateGroups() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: groupsApi.generate,
    onSuccess: (groups) => qc.setQueryData(groupsKeys.all, groups),
  })
}

export function useResetGroups() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: groupsApi.reset,
    onSuccess: () => qc.setQueryData(groupsKeys.all, []),
  })
}
