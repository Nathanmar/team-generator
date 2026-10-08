# Team Generator — Front

React 19 + Vite + TypeScript, UI [shadcn/ui](https://ui.shadcn.com) (Tailwind v4), validation [Zod](https://zod.dev), data fetching [TanStack Query](https://tanstack.com/query), routing [React Router](https://reactrouter.com).

## Démarrage

```bash
bun install
bun dev        # http://localhost:5173
```

Les appels `/api/*` sont proxifiés par Vite vers l'API Bun / Hono sur `http://localhost:3000` (voir `vite.config.ts`).
Pour pointer ailleurs, copier `.env.example` en `.env.local` et modifier `VITE_API_URL`.

| Script          | Rôle                          |
| --------------- | ----------------------------- |
| `bun dev`       | Serveur de dev                |
| `bun run build` | Type-check + build production |
| `bun run lint`  | Lint (oxlint)                 |

## Structure

```
src/
  api/              # Couche d'accès au contrat OpenAPI (../openapi.yml)
    schemas.ts      #   Schémas Zod + types (miroir de components/schemas)
    client.ts       #   fetch typé, validation Zod des réponses, ApiError
    members.ts      #   /members        (list, get, create, update, delete)
    groups.ts       #   /groups         (list, get, create, generate, delete)
    technos.ts      #   /technos        (list, get)
    specialities.ts #   /specialities   (list, get)
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
