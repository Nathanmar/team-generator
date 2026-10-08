import { useState, type FormEvent, type ReactNode } from 'react'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateMember } from '@/api/members'
import { memberInputSchema, type Techno } from '@/api/schemas'
import { useTechnos } from '@/api/technos'
import { QueryState } from '@/components/query-state'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const LEVELS = [1, 2, 3, 4, 5]
const DEFAULT_LEVEL = 3

type Errors = Partial<Record<'name' | 'first_name' | 'technos', string>>

export function AddMemberDialog() {
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [name, setName] = useState('')
  /** techno_id -> niveau, pour les technos cochées uniquement. */
  const [levels, setLevels] = useState<Record<number, number>>({})
  const [errors, setErrors] = useState<Errors>({})
  const technos = useTechnos()
  const create = useCreateMember()

  function reset() {
    setFirstName('')
    setName('')
    setLevels({})
    setErrors({})
  }

  function toggleTechno(id: number) {
    setLevels(({ [id]: current, ...rest }) =>
      current === undefined ? { ...rest, [id]: DEFAULT_LEVEL } : rest,
    )
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = memberInputSchema.safeParse({
      name,
      first_name: firstName,
      technos: Object.entries(levels).map(([id, level]) => ({ techno_id: Number(id), level })),
    })

    const next: Errors = {}
    for (const issue of parsed.error?.issues ?? []) {
      next[issue.path[0] as keyof Errors] ??= issue.message
    }
    if (Object.keys(levels).length === 0) next.technos = 'Sélectionnez au moins une techno'
    setErrors(next)
    if (!parsed.success || next.technos) return

    create.mutate(parsed.data, {
      onSuccess: (member) => {
        toast.success(`${member.first_name} ${member.name} a été ajouté·e`)
        reset()
        setOpen(false)
      },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto">
          <PlusIcon />
          Ajouter une personne
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={onSubmit} noValidate className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Nouvelle personne</DialogTitle>
            <DialogDescription>
              Sélectionnez ses technos et notez son niveau de 1 (débutant) à 5 (expert).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="first_name" label="Prénom" error={errors.first_name}>
              <Input
                id="first_name"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                aria-invalid={!!errors.first_name}
              />
            </Field>
            <Field id="name" label="Nom" error={errors.name}>
              <Input
                id="name"
                autoComplete="family-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
              />
            </Field>
          </div>

          <fieldset className="grid gap-3">
            <legend className="mb-3 text-sm font-medium">Technos</legend>
            <QueryState isPending={technos.isPending} error={technos.error}>
              {(['front', 'back'] as const).map((type) => (
                <TechnoGroup
                  key={type}
                  title={type === 'front' ? 'Front' : 'Back'}
                  technos={technos.data?.filter((t) => t.type === type) ?? []}
                  levels={levels}
                  onToggle={toggleTechno}
                  onLevelChange={(id, level) => setLevels((prev) => ({ ...prev, [id]: level }))}
                />
              ))}
            </QueryState>
            {errors.technos && <p className="text-sm text-destructive">{errors.technos}</p>}
          </fieldset>

          <DialogFooter>
            <Button type="submit" size="lg" disabled={create.isPending}>
              {create.isPending ? 'Ajout…' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

function TechnoGroup({
  title,
  technos,
  levels,
  onToggle,
  onLevelChange,
}: {
  title: string
  technos: Techno[]
  levels: Record<number, number>
  onToggle: (id: number) => void
  onLevelChange: (id: number, level: number) => void
}) {
  if (technos.length === 0) return null

  return (
    <div className="grid gap-1">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
      <ul className="divide-y rounded-lg border">
        {technos.map((t) => {
          const level = levels[t.id]
          return (
            <li key={t.id} className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-3 py-1.5">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={level !== undefined}
                  onChange={() => onToggle(t.id)}
                />
                {t.name}
              </label>
              {level !== undefined && (
                <div role="radiogroup" aria-label={`Niveau en ${t.name}`} className="flex gap-1">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      role="radio"
                      aria-checked={l === level}
                      onClick={() => onLevelChange(t.id, l)}
                      className={cn(
                        'size-8 rounded-md border text-sm font-medium transition-colors',
                        l <= level
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
