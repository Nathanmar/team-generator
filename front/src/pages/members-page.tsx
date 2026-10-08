import { useMembers } from '@/api/members'
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
              <TableHead>Technos & Niveaux</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.data?.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.name}</TableCell>
                <TableCell>{m.first_name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{m.speciality}</Badge>
                </TableCell>
                <TableCell className="flex flex-wrap gap-1">
                  {m.technos.map((t) => (
                    <Badge key={t.techno_id} variant="secondary">
                      {t.name} (Lvl {t.level})
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
