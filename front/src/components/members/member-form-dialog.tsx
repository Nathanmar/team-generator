import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useCreateMember, useUpdateMember } from '@/api/members'
import { memberInputSchema, technoTypeSchema, type Member, type Techno } from '@/api/schemas'
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
const TYPE_LABELS: Record<Techno['type'], string> = {
  front: 'Front',
  back: 'Back',
  fullstack: 'Fullstack',
}

type Values = {
  firstName: string
  name: string
  /** techno_id -> niveau, pour les technos cochées uniquement. */
  levels: Record<number, number>
}

type Errors = Partial<Record<'name' | 'first_name' | 'technos', string>>

const initialValues = (member?: Member): Values => ({
  firstName: member?.first_name ?? '',
  name: member?.name ?? '',
  levels: Object.fromEntries(member?.technos.map((t) => [t.techno_id, t.level]) ?? []),
})

/** Formulaire d'ajout (`POST /members`) ou, si `member` est fourni, de modification (`PATCH /members/{id}`). */
export function MemberFormDialog({ member, trigger }: { member?: Member; trigger: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(() => initialValues(member))
  const [errors, setErrors] = useState<Errors>({})
  const technos = useTechnos()
  const create = useCreateMember()
  const update = useUpdateMember()
  const isPending = create.isPending || update.isPending
  const ids = useId()

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setValues(initialValues(member))
      setErrors({})
    }
  }

  function setLevels(fn: (levels: Values['levels']) => Values['levels']) {
    setValues((v) => ({ ...v, levels: fn(v.levels) }))
  }

  function toggleTechno(id: number) {
    setLevels(({ [id]: current, ...rest }) =>
      current === undefined ? { ...rest, [id]: DEFAULT_LEVEL } : rest,
    )
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = memberInputSchema.safeParse({
      name: values.name,
      first_name: values.firstName,
      technos: Object.entries(values.levels).map(([id, level]) => ({
        techno_id: Number(id),
        level,
      })),
    })

    const next: Errors = {}
    for (const issue of parsed.error?.issues ?? []) {
      next[issue.path[0] as keyof Errors] ??= issue.message
    }
    if (Object.keys(values.levels).length === 0) next.technos = 'Sélectionnez au moins une techno'
    setErrors(next)
    if (!parsed.success || next.technos) return

    const callbacks = {
      onSuccess: (saved: Member) => {
        toast.success(
          `${saved.first_name} ${saved.name} a été ${member ? 'modifié·e' : 'ajouté·e'}`,
        )
        setOpen(false)
      },
      onError: (err: Error) => toast.error(err.message),
    }
    if (member) update.mutate({ id: member.id, input: parsed.data }, callbacks)
    else create.mutate(parsed.data, callbacks)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={onSubmit} noValidate className="grid gap-5">
          <DialogHeader>
            <DialogTitle>
              {member ? `Modifier ${member.first_name} ${member.name}` : 'Nouvelle personne'}
            </DialogTitle>
            <DialogDescription>
              Sélectionnez ses technos et notez son niveau de 1 (débutant) à 5 (expert).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${ids}-first_name`} label="Prénom" error={errors.first_name}>
              <Input
                id={`${ids}-first_name`}
                autoComplete="given-name"
                value={values.firstName}
                onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
                aria-invalid={!!errors.first_name}
              />
            </Field>
            <Field id={`${ids}-name`} label="Nom" error={errors.name}>
              <Input
                id={`${ids}-name`}
                autoComplete="family-name"
                value={values.name}
                onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                aria-invalid={!!errors.name}
              />
            </Field>
          </div>

          <fieldset className="grid gap-3">
            <legend className="mb-3 text-sm font-medium">Technos</legend>
            <QueryState isPending={technos.isPending} error={technos.error}>
              {technoTypeSchema.options.map((type) => (
                <TechnoGroup
                  key={type}
                  title={TYPE_LABELS[type]}
                  technos={technos.data?.filter((t) => t.type === type) ?? []}
                  levels={values.levels}
                  onToggle={toggleTechno}
                  onLevelChange={(id, level) => setLevels((prev) => ({ ...prev, [id]: level }))}
                />
              ))}
            </QueryState>
            {errors.technos && <p className="text-sm text-destructive">{errors.technos}</p>}
          </fieldset>

          <DialogFooter>
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? 'Enregistrement…' : member ? 'Enregistrer' : 'Ajouter'}
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
            <li
              key={t.id}
              className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-3 py-1.5"
            >
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
