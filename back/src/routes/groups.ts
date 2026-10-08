import { Hono } from "hono";
import { z } from "zod";
import { sql } from "../db";
import { validate } from "../lib/validator";
import { generateGroups, listGroups } from "../services/groups";

const capacityError = "Capacity must be a positive integer";

const capacityParam = z.object({
  capacity: z.coerce.number(capacityError).int(capacityError).positive(capacityError),
});

const groups = new Hono();

groups.get("/", async (c) => c.json(await listGroups()));

groups.delete("/", async (c) => {
  await sql`DELETE FROM groups`;
  return c.body(null, 204);
});

groups.post("/generate/:capacity", validate("param", capacityParam), async (c) => {
  const { capacity } = c.req.valid("param");
  return c.json(await generateGroups(capacity), 201);
});

export default groups;
