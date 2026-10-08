import { useState, type FormEvent } from 'react'
import { RotateCcwIcon, SparklesIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useGenerateGroups, useGroups, useResetGroups } from '@/api/groups'
import { useMembers } from '@/api/members'
import { generateGroupsParamsSchema, type Group, type Member } from '@/api/schemas'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { SpecialityBadge } from '@/components/members/member-badges'
import { QueryState } from '@/components/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function GroupsPage() {
  const groups = useGroups()
  const members = useMembers()
  const generate = useGenerateGroups()
  const resetGroups = useResetGroups()
  const [capacity, setCapacity] = useState('3')
  const [fieldError, setFieldError] = useState<string>()

  const membersById = new Map(members.data?.map((m) => [m.id, m]))

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = generateGroupsParamsSchema.safeParse({ capacity })
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message)
      return
    }
    setFieldError(undefined)
    generate.mutate(parsed.data.capacity, {
      onSuccess: (created) => toast.success(`${created.length} groupe(s) généré(s)`),
      onError: (err) => toast.error(err.message),
    })
  }

  function onReset() {
    resetGroups.mutate(undefined, {
      onSuccess: () => toast.success('Groupes réinitialisés'),
      onError: (err) => toast.error(err.message),
    })
  }

  const hasGroups = !!groups.data?.length

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Groupes</h1>
        <p className="text-sm text-muted-foreground">
          Équipes équilibrées en niveau et en répartition front / back.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="capacity">Personnes par groupe</Label>
          <Input
            id="capacity"
            type="number"
            inputMode="numeric"
            min={1}
            className="h-9 sm:w-40"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? 'capacity-error' : undefined}
          />
          {fieldError && (
            <p id="capacity-error" className="text-sm text-destructive">
              {fieldError}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" disabled={generate.isPending}>
          <SparklesIcon />
          {generate.isPending
            ? 'Génération…'
            : hasGroups
              ? 'Regénérer les groupes'
              : 'Générer les groupes'}
        </Button>
        {hasGroups && (
          <ConfirmDialog
            title="Réinitialiser les groupes ?"
            description="Tous les groupes générés seront supprimés. Les membres sont conservés."
            confirmLabel="Réinitialiser"
            onConfirm={onReset}
            trigger={
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={resetGroups.isPending}
                className="sm:ml-auto"
              >
                <RotateCcwIcon />
                Réinitialiser
              </Button>
            }
          />
        )}
      </form>

      <QueryState
        isPending={groups.isPending || members.isPending}
        error={groups.error ?? members.error}
        isEmpty={!hasGroups}
        emptyMessage="Aucun groupe pour le moment : choisissez une taille et lancez la génération."
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.data?.map((g) => (
            <li key={g.id}>
              <GroupCard group={g} membersById={membersById} />
            </li>
          ))}
        </ul>
      </QueryState>
    </section>
  )
}

function GroupCard({ group, membersById }: { group: Group; membersById: Map<number, Member> }) {
  const groupMembers = group.members.map((id) => ({ id, member: membersById.get(id) }))
  const count = (speciality: Member['speciality']) =>
    groupMembers.filter(({ member }) => member?.speciality === speciality).length
  const composition = (['front', 'back', 'fullstack'] as const)
    .map((s) => [s, count(s)] as const)
    .filter(([, n]) => n > 0)
    .map(([s, n]) => `${n} ${s}`)
    .join(' · ')

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{group.group_name}</CardTitle>
          <Badge variant="outline">Niveau {group.group_level}/5</Badge>
        </div>
        <CardDescription>
          {group.members.length} / {group.capacity} membres
          {composition && ` — ${composition}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {groupMembers.map(({ id, member }) => (
            <li key={id} className="flex items-center justify-between gap-2 py-2">
              <span className="truncate">
                {member ? `${member.first_name} ${member.name}` : `Membre #${id}`}
              </span>
              {member && <SpecialityBadge speciality={member.speciality} />}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
