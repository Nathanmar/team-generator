import { useState } from 'react'
import { ChevronsUpDownIcon, XIcon } from 'lucide-react'
import { technoTypeSchema, type Techno } from '@/api/schemas'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const LEVELS = [1, 2, 3, 4, 5]
const TYPE_LABELS: Record<Techno['type'], string> = {
  front: 'Front',
  back: 'Back',
  fullstack: 'Fullstack',
}

type TechnoPickerProps = {
  id: string
  /** Référentiel `GET /technos` : seules ces technos peuvent être choisies. */
  technos: Techno[]
  /** techno_id -> niveau des technos choisies. */
  levels: Record<number, number>
  onAdd: (id: number) => void
  onRemove: (id: number) => void
  onLevelChange: (id: number, level: number) => void
  invalid?: boolean
}

/** Recherche avec autocomplétion parmi les technos en base, puis notation de 1 à 5. */
export function TechnoPicker({
  id,
  technos,
  levels,
  onAdd,
  onRemove,
  onLevelChange,
  invalid,
}: TechnoPickerProps) {
  const [open, setOpen] = useState(false)
  const selected = technos.filter((t) => levels[t.id] !== undefined)
  const available = technos.filter((t) => levels[t.id] === undefined)

  return (
    <div className="grid gap-3">
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={invalid}
            className="h-9 w-full justify-between font-normal text-muted-foreground"
          >
            Rechercher une techno…
            <ChevronsUpDownIcon className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command>
            <CommandInput placeholder="React, PostgreSQL…" />
            <CommandList>
              <CommandEmpty>
                {available.length ? 'Aucune techno trouvée.' : 'Toutes les technos sont ajoutées.'}
              </CommandEmpty>
              {technoTypeSchema.options.map((type) => {
                const items = available.filter((t) => t.type === type)
                if (items.length === 0) return null
                return (
                  <CommandGroup key={type} heading={TYPE_LABELS[type]}>
                    {items.map((t) => (
                      <CommandItem
                        key={t.id}
                        value={t.name}
                        onSelect={() => {
                          onAdd(t.id)
                          setOpen(false)
                        }}
                      >
                        {t.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {selected.map((t) => {
            const level = levels[t.id]
            return (
              <li
                key={t.id}
                className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-1.5 pr-1.5 pl-3"
              >
                <div className="flex items-center gap-2 text-sm">
                  {t.name}
                  <Badge variant="outline" className="text-muted-foreground">
                    {TYPE_LABELS[t.type]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Retirer ${t.name}`}
                    title="Retirer"
                    onClick={() => onRemove(t.id)}
                  >
                    <XIcon />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
