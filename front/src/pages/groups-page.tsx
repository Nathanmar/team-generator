import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useGenerateGroups, useGroups } from '@/api/groups'
import { generateGroupsParamsSchema } from '@/api/schemas'
import { QueryState } from '@/components/query-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function GroupsPage() {
  const groups = useGroups()
  const generate = useGenerateGroups()
  const [capacity, setCapacity] = useState('3')
  const [fieldError, setFieldError] = useState<string>()

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

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Groupes</h1>

      <form onSubmit={onSubmit} className="flex items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="capacity">Personnes par groupe</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            className="w-40"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            aria-invalid={!!fieldError}
          />
        </div>
        <Button type="submit" disabled={generate.isPending}>
          {generate.isPending ? 'Génération…' : 'Générer les groupes'}
        </Button>
      </form>
      {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}

      <QueryState
        isPending={groups.isPending}
        error={groups.error}
        isEmpty={groups.data?.length === 0}
        emptyMessage="Aucun groupe pour le moment."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.data?.map((g) => (
            <Card key={g.id}>
              <CardHeader>
                <CardTitle>{g.group_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Membres : {g.members.length} / {g.capacity}
                </p>
                <p>Niveau : {g.group_level}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </QueryState>
    </section>
  )
}
