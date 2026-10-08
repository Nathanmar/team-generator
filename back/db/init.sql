-- Schéma initial, dérivé de openapi.yml.
-- Exécuté automatiquement par Postgres au premier démarrage du volume
-- (relancer avec `bun run db:reset` après modification).

CREATE TABLE specialities (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE technos (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('front', 'back', 'fullstack'))
);

CREATE TABLE members (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  speciality_id INTEGER NOT NULL REFERENCES specialities (id)
);

-- Level : niveau d'expérience d'un membre sur une techno (Member.technos).
CREATE TABLE levels (
  member_id  INTEGER NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  techno_id  INTEGER NOT NULL REFERENCES technos (id) ON DELETE CASCADE,
  experience INTEGER NOT NULL DEFAULT 1 CHECK (experience BETWEEN 1 AND 5),
  PRIMARY KEY (member_id, techno_id)
);

CREATE TABLE groups (
  id          SERIAL PRIMARY KEY,
  group_name  TEXT NOT NULL,
  group_level INTEGER NOT NULL,
  capacity    INTEGER NOT NULL CHECK (capacity > 0)
);

CREATE TABLE group_members (
  group_id  INTEGER NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, member_id)
);

-- Référentiels (pas d'endpoint de création dans le contrat).
INSERT INTO specialities (name) VALUES
  ('Front-end'),
  ('Back-end'),
  ('Full-stack');

INSERT INTO technos (name, type) VALUES
  ('React', 'front'),
  ('Hono', 'back'),
  ('TypeScript', 'front'),
  ('PostgreSQL', 'back'),
  ('Vue', 'front'),
  ('Angular', 'front'),
  ('Node.js', 'back'),
  ('Laravel', 'back'),
  ('Symfony', 'back');
