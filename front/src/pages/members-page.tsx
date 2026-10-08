import { useMembers } from '@/api/members'
import { AddMemberDialog } from '@/components/members/add-member-dialog'
import { SpecialityBadge, TechnoBadges } from '@/components/members/member-badges'
import { QueryState } from '@/components/query-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Membres</h1>
          <p className="text-sm text-muted-foreground">
            {members.data
              ? `${members.data.length} personne(s) inscrite(s)`
              : 'Personnes inscrites et leurs niveaux par techno'}
          </p>
        </div>
        <AddMemberDialog />
      </div>

      <QueryState
        isPending={members.isPending}
        error={members.error}
        isEmpty={members.data?.length === 0}
        emptyMessage="Aucun membre enregistré."
      >
        {/* Mobile : une carte par personne */}
        <ul className="grid gap-3 md:hidden">
          {members.data?.map((m) => (
            <li key={m.id}>
              <Card size="sm">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle>
                    {m.first_name} {m.name}
                  </CardTitle>
                  <SpecialityBadge speciality={m.speciality} />
                </CardHeader>
                <CardContent>
                  <TechnoBadges technos={m.technos} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        {/* Desktop : tableau */}
        <div className="hidden rounded-xl border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Spécialité</TableHead>
                <TableHead>Technos & niveaux</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.data?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="pl-4 font-medium">{m.name}</TableCell>
                  <TableCell>{m.first_name}</TableCell>
                  <TableCell>
                    <SpecialityBadge speciality={m.speciality} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <TechnoBadges technos={m.technos} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </QueryState>
    </section>
  )
}
