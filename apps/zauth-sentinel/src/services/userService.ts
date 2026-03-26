import { pool } from "../db/pool.js";
import type { SentinelUser } from "../types/models.js";

export async function upsertSentinelUser(subjectId: string, preferredUsername?: string, displayName?: string): Promise<SentinelUser> {
  const result = await pool.query<SentinelUser>(
    `INSERT INTO sentinel_users (subject_id, email, display_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (subject_id) DO UPDATE
     SET email = COALESCE(EXCLUDED.email, sentinel_users.email),
         display_name = COALESCE(EXCLUDED.display_name, sentinel_users.display_name)
     RETURNING id::int, subject_id, email, display_name, rank, unit, clearance_level`,
    [subjectId, preferredUsername ?? null, displayName ?? null]
  );

  return result.rows[0];
}

export async function getUserById(userId: number): Promise<SentinelUser | null> {
  const result = await pool.query<SentinelUser>(
    `SELECT id::int, subject_id, email, display_name, rank, unit, clearance_level FROM sentinel_users WHERE id = $1`,
    [userId]
  );
  return result.rows[0] ?? null;
}
