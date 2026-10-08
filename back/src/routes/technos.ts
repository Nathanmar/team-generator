import { Hono } from "hono";
import { sql } from "../db";

type Techno = { id: number; name: string; type: "front" | "back" };

const technos = new Hono();

technos.get("/", async (c) => {
  const rows: Techno[] = await sql`SELECT id, name, type FROM technos ORDER BY id`;
  return c.json(rows);
});

export default technos;
