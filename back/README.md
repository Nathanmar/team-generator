# Team Generator — Back

API Hono sur Bun, base PostgreSQL dans Docker. Contrat : [`../openapi.yml`](../openapi.yml).

## Prérequis

- [Bun](https://bun.sh) ≥ 1.2
- Docker avec Compose v2 (Docker Desktop sous Windows / macOS, Docker Engine sous Linux)

Fonctionne sous Linux (SELinux compris), macOS et Windows.

## Démarrage

```sh
cp .env.example .env   # Windows (cmd) : copy .env.example .env
bun install
bun run db:up          # lance Postgres (schéma + référentiels créés depuis db/init.sql)
bun run dev            # http://localhost:3000 (hot reload)
```

Vérification : `curl localhost:3000/health` → `{"status":"ok","database":"up"}`

> Port 5432 déjà utilisé (autre conteneur, Postgres installé en local sous Windows…) ? Change `DB_PORT` dans `.env` (ex. `5433`), puis `bun run db:up`.
>
> Base vide alors que le conteneur tourne ? `db/init.sql` n'est joué qu'à la création du volume : lance `bun run db:reset`.

## Scripts

| Script             | Rôle                                                  |
| ------------------ | ----------------------------------------------------- |
| `bun run dev`      | Serveur en hot reload                                 |
| `bun run start`    | Serveur sans hot reload                               |
| `bun run typecheck`| Vérification TypeScript                               |
| `bun run db:up`    | Démarre Postgres                                      |
| `bun run db:down`  | Arrête Postgres (données conservées)                  |
| `bun run db:reset` | Supprime le volume et relance (rejoue `db/init.sql`)  |
| `bun run db:psql`  | Ouvre un shell `psql`                                 |

## Structure

```
back/
├── db/init.sql          # schéma + données des référentiels
├── docker-compose.yml   # service Postgres 17
└── src/
    ├── index.ts         # app Hono : middlewares, montage des routes, erreurs
    ├── db.ts            # client Postgres (Bun.SQL)
    ├── env.ts           # variables d'environnement validées avec Zod
    ├── lib/validator.ts # zValidator avec erreurs au format ErrorResponse
    └── routes/          # un routeur Hono par ressource, monté dans index.ts
        ├── members.ts       → /members
        ├── groups.ts        → /groups
        ├── technos.ts       → /technos
        └── specialities.ts  → /specialities
```

Les routes d'une ressource s'écrivent dans son fichier, avec des chemins relatifs :

```ts
// src/routes/technos.ts
const technos = new Hono();

technos.get("/", async (c) => c.json(await sql`SELECT id, name FROM technos ORDER BY id`));

export default technos;
```

## Validation des requêtes

Utiliser `validate` (wrapper de `@hono/zod-validator`) plutôt que `zValidator` directement :

```ts
import { z } from "zod";
import { validate } from "./lib/validator";

app.patch(
  "/members/:id",
  validate("param", z.object({ id: z.coerce.number().int().positive() })), // invalide → 400
  validate("json", memberUpdateSchema),                                    // invalide → 422
  (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    // ...
  },
);
```
