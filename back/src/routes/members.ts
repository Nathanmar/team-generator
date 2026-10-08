import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { sql } from "../db";
import { validate } from "../lib/validator";
import {
  assertTechnosExist,
  computeSpeciality,
  getMembersTechnos,
  replaceMemberTechnos,
  type MemberTechno,
} from "../services/members";

type MemberRow = { id: number; name: string; first_name: string };

const idParam = z.object({ id: z.coerce.number().int().positive() });

const levelError = "Level must be an integer between 1 and 5";

const memberTechnoInput = z.object({
  techno_id: z.number().int().positive(),
  level: z.number().int(levelError).min(1, levelError).max(5, levelError),
});

const memberInput = z.object({
  name: z.string().trim().min(1),
  first_name: z.string().trim().min(1),
  technos: z
    .array(memberTechnoInput)
    .refine((technos) => new Set(technos.map((t) => t.techno_id)).size === technos.length, "Duplicate techno_id"),
});

const memberUpdateInput = memberInput.partial();

// Ordre des champs du schéma Member (openapi.yml).
const toMember = (row: MemberRow, technos: MemberTechno[]) => ({
  id: row.id,
  name: row.name,
  first_name: row.first_name,
  speciality: computeSpeciality(technos),
  technos,
});

const findMember = async (id: number, db = sql) => {
  const [row]: MemberRow[] = await db`SELECT id, name, first_name FROM members WHERE id = ${id}`;
  if (!row) throw new HTTPException(404, { message: "Member not found" });

  const technos = await getMembersTechnos([id], db);
  return toMember(row, technos.get(id) ?? []);
};

const members = new Hono();

members.get("/", async (c) => {
  const rows: MemberRow[] = await sql`SELECT id, name, first_name FROM members ORDER BY id`;
  const technos = await getMembersTechnos(rows.map((row) => row.id));
  return c.json(rows.map((row) => toMember(row, technos.get(row.id) ?? [])));
});

members.get("/:id", validate("param", idParam), async (c) => {
  const { id } = c.req.valid("param");
  return c.json(await findMember(id));
});

members.post("/", validate("json", memberInput), async (c) => {
  const { technos, ...body } = c.req.valid("json");

  const member = await sql.begin(async (tx) => {
    await assertTechnosExist(technos.map((t) => t.techno_id), tx);

    const [row]: MemberRow[] = await tx`INSERT INTO members ${tx(body)} RETURNING id`;
    await replaceMemberTechnos(row!.id, technos, tx);

    return findMember(row!.id, tx);
  });

  return c.json(member, 201);
});

members.patch("/:id", validate("param", idParam), validate("json", memberUpdateInput), async (c) => {
  const { id } = c.req.valid("param");
  const { technos, ...body } = c.req.valid("json");

  const member = await sql.begin(async (tx) => {
    const [existing] = await tx`SELECT 1 FROM members WHERE id = ${id} FOR UPDATE`;
    if (!existing) throw new HTTPException(404, { message: "Member not found" });

    const fields = Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined));
    if (Object.keys(fields).length > 0) {
      await tx`UPDATE members SET ${tx(fields)} WHERE id = ${id}`;
    }
    if (technos !== undefined) {
      await assertTechnosExist(technos.map((t) => t.techno_id), tx);
      await replaceMemberTechnos(id, technos, tx);
    }

    return findMember(id, tx);
  });

  return c.json(member);
});

members.delete("/:id", validate("param", idParam), async (c) => {
  const { id } = c.req.valid("param");
  const [deleted] = await sql`DELETE FROM members WHERE id = ${id} RETURNING id`;
  if (!deleted) throw new HTTPException(404, { message: "Member not found" });

  return c.body(null, 204);
});

export default members;
