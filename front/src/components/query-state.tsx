import type { ReactNode } from 'react'

type QueryStateProps = {
  isPending: boolean
  error: Error | null
  isEmpty?: boolean
  emptyMessage?: string
  children: ReactNode
}

/** Affiche chargement / erreur / état vide d'une requête, sinon son contenu. */
export function QueryState({
  isPending,
  error,
  isEmpty,
  emptyMessage = 'Aucun élément.',
  children,
}: QueryStateProps) {
  if (isPending) return <p className="text-sm text-muted-foreground">Chargement…</p>
  if (error) return <p className="text-sm text-destructive">Erreur : {error.message}</p>
  if (isEmpty) return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  return children
}
