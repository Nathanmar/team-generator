import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";

// zValidator dont les erreurs suivent ErrorResponse (openapi.yml) :
// paramètre d'URL invalide → 400, données invalides → 422.
export const validate = <Target extends keyof ValidationTargets, Schema extends ZodType>(
  target: Target,
  schema: Schema,
) =>
  zValidator(target, schema, (result, c) => {
    if (result.success) return;

    const message = result.error.issues
      .map((issue) => `${issue.path.map(String).join(".") || target}: ${issue.message}`)
      .join("; ");

    return target === "param"
      ? c.json({ error: "Bad request", message }, 400)
      : c.json({ error: "Validation failed", message }, 422);
  });
