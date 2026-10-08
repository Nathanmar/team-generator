import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from './client'
import { groupsKeys } from './groups'
import {
  memberInputSchema,
  memberSchema,
  memberUpdateInputSchema,
  type MemberInput,
  type MemberUpdateInput,
} from './schemas'

export const membersKeys = {
  all: ['members'] as const,
  detail: (id: number) => ['members', id] as const,
}

export const membersApi = {
  list: () => request('/members', { schema: memberSchema.array() }),
  get: (id: number) => request(`/members/${id}`, { schema: memberSchema }),
  create: (input: MemberInput) =>
    request('/members', {
      method: 'POST',
      body: memberInputSchema.parse(input),
      schema: memberSchema,
    }),
  update: (id: number, input: MemberUpdateInput) =>
    request(`/members/${id}`, {
      method: 'PATCH',
      body: memberUpdateInputSchema.parse(input),
      schema: memberSchema,
    }),
  remove: (id: number) => request(`/members/${id}`, { method: 'DELETE' }),
}

export const useMembers = () => useQuery({ queryKey: membersKeys.all, queryFn: membersApi.list })

export const useMember = (id: number) =>
  useQuery({ queryKey: membersKeys.detail(id), queryFn: () => membersApi.get(id) })

export function useCreateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: membersApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKeys.all }),
  })
}

export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: MemberUpdateInput }) =>
      membersApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKeys.all }),
  })
}

export function useDeleteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: membersApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: membersKeys.all })
      // La personne supprimée disparaît aussi de son groupe.
      qc.invalidateQueries({ queryKey: groupsKeys.all })
    },
  })
}
