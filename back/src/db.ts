import { SQL } from "bun";
import { env } from "./env";

export const sql = new SQL(env.DATABASE_URL);
