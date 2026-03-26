import { pool } from "../db/pool.js";
import type { CheckpointEntry } from "../types/models.js";

export async function listCheckpoints(personnelId?: number, result?: string, limit = 50): Promise<CheckpointEntry[]> {
  const where: string[] = [];
  const params: unknown[] = [];

  if (personnelId) {
    params.push(personnelId);
    where.push(`c.personnel_id = $${params.length}`);
  }

  if (result && result.trim()) {
    params.push(result.trim());
    where.push(`c.result = $${params.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = await pool.query<CheckpointEntry>(
    `SELECT c.id::int, c.personnel_id::int, p.full_name AS personnel_name, p.rank AS personnel_rank,
            c.checkpoint_name, c.location, u.display_name AS verified_by_name,
            c.verification_method, c.acr_at_verify, c.result, c.notes, c.verified_at::text
     FROM sentinel_checkpoints c
     JOIN sentinel_personnel p ON p.id = c.personnel_id
     LEFT JOIN sentinel_users u ON u.id = c.verified_by_id
     ${whereClause}
     ORDER BY c.verified_at DESC
     LIMIT $${params.length + 1}`,
    [...params, limit]
  );

  return rows.rows;
}

export async function createCheckpointEntry(
  personnelId: number,
  checkpointName: string,
  location: string | null,
  result: string,
  notes: string | null,
  verifiedById: number | null,
  acrAtVerify: string | null
): Promise<CheckpointEntry> {
  const row = await pool.query<CheckpointEntry>(
    `INSERT INTO sentinel_checkpoints (personnel_id, checkpoint_name, location, verified_by_id, verification_method, acr_at_verify, result, notes)
     VALUES ($1, $2, $3, $4, 'zk_biometric', $5, $6, $7)
     RETURNING id::int, personnel_id::int, checkpoint_name, location, verification_method, acr_at_verify, result, notes, verified_at::text`,
    [personnelId, checkpointName, location, verifiedById, acrAtVerify, result, notes]
  );

  // Update last_checkpoint on personnel
  await pool.query(
    `UPDATE sentinel_personnel SET last_checkpoint = $1 WHERE id = $2`,
    [checkpointName, personnelId]
  );

  return row.rows[0];
}
