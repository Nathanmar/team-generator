import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { sql } from "./db";
import { env } from "./env";
import { swaggerUI } from "@hono/swagger-ui";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import groups from "./routes/groups";
import members from "./routes/members";
import technos from "./routes/technos";

// Résolution robuste du fichier openapi.yml à la racine du projet
const openapiCandidates: string[] = [
  resolve(import.meta.dir, "../../openapi.yml"),
  resolve(process.cwd(), "../openapi.yml"),
  resolve(process.cwd(), "openapi.yml"),
];
const openapiPath: string = openapiCandidates.find((p) => existsSync(p)) ?? openapiCandidates[0]!;

// Libellés du champ `error` d'ErrorResponse (openapi.yml).
const errorLabels: Record<number, string> = {
  400: "Bad request",
  401: "Unauthorized",
  404: "Not found",
  422: "Validation failed",
};

const app = new Hono();

app.use(logger());
app.use(cors());

// Documentation interactive Swagger UI
app.get("/openapi.yaml", (c) => {
  if (!existsSync(openapiPath)) {
    return c.text("Fichier openapi.yml introuvable", 404);
  }
  const content = readFileSync(openapiPath, { encoding: "utf-8" });
  return c.text(String(content), 200, {
    "Content-Type": "text/yaml; charset=utf-8",
  });
});

app.get("/ui", swaggerUI({ url: "/openapi.yaml" }));
app.get("/docs", swaggerUI({ url: "/openapi.yaml" }));

app.get("/health", async (c) => {
  try {
    await sql`SELECT 1`;
    return c.json({ status: "ok", database: "up" });
  } catch {
    return c.json({ status: "degraded", database: "down" }, 503);
  }
});

app.route("/members", members);
app.route("/groups", groups);
app.route("/technos", technos);

app.notFound((c) =>
  c.json({ error: "Not found", message: `Route ${c.req.method} ${c.req.path} not found` }, 404),
);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: errorLabels[err.status] ?? "Error", message: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "Internal server error", message: "An unexpected internal error occurred" }, 500);
});

export default {
  port: env.PORT,
  fetch: app.fetch,
};
