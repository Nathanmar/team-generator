import type { Member } from '@/api/schemas'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const styles: Record<Member['speciality'], string> = {
  front: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  back: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  fullstack: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
}

export function SpecialityBadge({
  speciality,
  className,
}: {
  speciality: Member['speciality']
  className?: string
}) {
  return <Badge className={cn('capitalize', styles[speciality], className)}>{speciality}</Badge>
}

export function TechnoBadges({ technos }: { technos: Member['technos'] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {technos.map((t) => (
        <Badge key={t.techno_id} variant="secondary" title={`${t.name} : niveau ${t.level}/5`}>
          {t.name}
          <span className="text-muted-foreground">{t.level}/5</span>
        </Badge>
      ))}
    </div>
  )
}
