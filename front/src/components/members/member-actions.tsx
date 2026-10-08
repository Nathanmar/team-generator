import { PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteMember } from '@/api/members'
import type { Member } from '@/api/schemas'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { MemberFormDialog } from '@/components/members/member-form-dialog'
import { Button } from '@/components/ui/button'

/** Boutons Modifier / Supprimer d'une personne. */
export function MemberActions({ member }: { member: Member }) {
  const remove = useDeleteMember()
  const fullName = `${member.first_name} ${member.name}`

  function onDelete() {
    remove.mutate(member.id, {
      onSuccess: () => toast.success(`${fullName} a été supprimé·e`),
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <div className="flex justify-end gap-1">
      <MemberFormDialog
        member={member}
        trigger={
          <Button variant="ghost" size="icon" aria-label={`Modifier ${fullName}`} title="Modifier">
            <PencilIcon />
          </Button>
        }
      />
      <ConfirmDialog
        title={`Supprimer ${fullName} ?`}
        description="La personne et ses niveaux seront définitivement supprimés, et elle sera retirée de son groupe."
        confirmLabel="Supprimer"
        onConfirm={onDelete}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Supprimer ${fullName}`}
            title="Supprimer"
            disabled={remove.isPending}
          >
            <Trash2Icon />
          </Button>
        }
      />
    </div>
  )
}
