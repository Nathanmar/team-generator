# Team Generator — Front

React 19 + Vite + TypeScript, UI [shadcn/ui](https://ui.shadcn.com) (Tailwind v4), validation [Zod](https://zod.dev), data fetching [TanStack Query](https://tanstack.com/query), routing [React Router](https://reactrouter.com).

## Démarrage

```bash
bun install
bun dev        # http://localhost:5173
```

Les appels `/api/*` sont proxifiés par Vite vers l'API Bun / Hono sur `http://localhost:3000` (voir `vite.config.ts`).
Pour pointer ailleurs, copier `.env.example` en `.env.local` et modifier `VITE_API_URL`.

### Mock de l'API (sans back)

En dev, si le back ne répond pas au démarrage, le front bascule automatiquement sur un mock du contrat
([MSW](https://mswjs.io), `src/mocks/`) : données simulées en mémoire, remises à zéro à chaque rechargement.
Un badge « API mockée » s'affiche alors dans le header. `bun dev:mock` force le mock même si le back tourne.
Le mock n'est jamais inclus dans le build de production.

| Script          | Rôle                          |
| --------------- | ----------------------------- |
| `bun dev`       | Serveur de dev                |
| `bun dev:mock`  | Serveur de dev, API mockée    |
| `bun run build` | Type-check + build production |
| `bun run lint`  | Lint (oxlint)                 |

## Structure

```
src/
  api/              # Couche d'accès au contrat OpenAPI (../openapi.yml)
    schemas.ts      #   Schémas Zod + types (miroir de components/schemas)
    client.ts       #   fetch typé, validation Zod des réponses, ApiError
    members.ts      #   /members        (list, get, create, update, delete)
    groups.ts       #   /groups         (list, generate, reset)
    technos.ts      #   /technos        (list)
  mocks/            # Mock MSW du contrat (db.ts : données, handlers.ts : routes)
  components/
    ui/             # Composants shadcn (ajout : bunx shadcn@latest add <composant>)
    layout/         # Layout de l'app
  pages/            # Pages routées
  lib/              # utils (cn), queryClient
  router.tsx
```

## Contrat API

Toute modification de `openapi.yml` doit être répercutée dans `src/api/schemas.ts`.
Les réponses du back sont validées par Zod : un écart avec le contrat lève une erreur explicite côté front.
