import { useMembers } from '@/api/members'
import { useSpecialities } from '@/api/specialities'
import { useTechnos } from '@/api/technos'
import { QueryState } from '@/components/query-state'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function MembersPage() {
  const members = useMembers()
  const technos = useTechnos()
  const specialities = useSpecialities()

  const technoName = (id: number) => technos.data?.find((t) => t.id === id)?.name ?? `#${id}`
  const specialityName = (id: number) =>
    specialities.data?.find((s) => s.id === id)?.name ?? `#${id}`

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Membres</h1>

      <QueryState
        isPending={members.isPending}
        error={members.error}
        isEmpty={members.data?.length === 0}
        emptyMessage="Aucun membre enregistré."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Spécialité</TableHead>
              <TableHead>Technos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.data?.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.name}</TableCell>
                <TableCell>{m.first_name}</TableCell>
                <TableCell>{specialityName(m.speciality_id)}</TableCell>
                <TableCell className="flex flex-wrap gap-1">
                  {m.technos.map((t) => (
                    <Badge key={t} variant="secondary">
                      {technoName(t)}
                    </Badge>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryState>
    </section>
  )
}
