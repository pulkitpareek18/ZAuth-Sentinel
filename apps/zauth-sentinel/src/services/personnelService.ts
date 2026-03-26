import { pool } from "../db/pool.js";
import type { Personnel } from "../types/models.js";

export async function listPersonnel(q?: string, unit?: string, status?: string): Promise<Personnel[]> {
  const where: string[] = ["status != 'RETIRED'", "service_number != 'SEED-MARKER-001'"];
  const params: unknown[] = [];

  if (q && q.trim()) {
    params.push(`%${q.trim()}%`);
    where.push(`(full_name ILIKE $${params.length} OR service_number ILIKE $${params.length})`);
  }

  if (unit && unit.trim()) {
    params.push(unit.trim());
    where.push(`unit = $${params.length}`);
  }

  if (status && status.trim()) {
    params.push(status.trim());
    where.push(`status = $${params.length}`);
  }

  const result = await pool.query<Personnel>(
    `SELECT id::int, user_id::int, full_name, rank, unit, service_number, clearance_level,
            zk_verified, zk_verified_at::text, last_checkpoint, status, photo_placeholder, created_at::text
     FROM sentinel_personnel
     WHERE ${where.join(" AND ")}
     ORDER BY rank_order(rank), full_name
     LIMIT 100`,
    params
  );

  return result.rows;
}

export async function getPersonnelById(id: number): Promise<Personnel | null> {
  const result = await pool.query<Personnel>(
    `SELECT id::int, user_id::int, full_name, rank, unit, service_number, clearance_level,
            zk_verified, zk_verified_at::text, last_checkpoint, status, photo_placeholder, created_at::text
     FROM sentinel_personnel
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

// Create a SQL function for rank ordering (called once at init)
export async function ensureRankOrderFunction(): Promise<void> {
  await pool.query(`
    CREATE OR REPLACE FUNCTION rank_order(r TEXT) RETURNS INT AS $$
    BEGIN
      RETURN CASE r
        WHEN 'Field Marshal' THEN 1
        WHEN 'General' THEN 2
        WHEN 'Lieutenant General' THEN 3
        WHEN 'Major General' THEN 4
        WHEN 'Brigadier' THEN 5
        WHEN 'Colonel' THEN 6
        WHEN 'Lieutenant Colonel' THEN 7
        WHEN 'Major' THEN 8
        WHEN 'Captain' THEN 9
        WHEN 'Lieutenant' THEN 10
        WHEN 'Subedar Major' THEN 11
        WHEN 'Subedar' THEN 12
        WHEN 'Naib Subedar' THEN 13
        WHEN 'Havildar' THEN 14
        WHEN 'Naik' THEN 15
        WHEN 'Lance Naik' THEN 16
        WHEN 'Sepoy' THEN 17
        ELSE 99
      END;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;
  `);
}
