import { Pool } from "pg";

let pool: Pool | undefined;

export function getPool() {
  if (!pool) {
    const conn = process.env.DATABASE_URL;
    if (!conn) throw new Error("DATABASE_URL missing");
    pool = new Pool({
      connectionString: conn,
      // Jika butuh SSL self-signed:
      // ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}
