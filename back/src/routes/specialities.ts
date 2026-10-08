import { Hono } from "hono";
import { sql } from "../db";

type Speciality = { id: number; name: string };

const specialities = new Hono();

specialities.get("/", async (c) => {
  const rows: Speciality[] = await sql`SELECT id, name FROM specialities ORDER BY id`;
  return c.json(rows);
});

export default specialities;
