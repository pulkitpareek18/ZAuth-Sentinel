import { pool } from "../db/pool.js";
import type { ArmouryEntry } from "../types/models.js";

export async function listArmouryLog(personnelId?: number, action?: string, limit = 50): Promise<ArmouryEntry[]> {
  const where: string[] = [];
  const params: unknown[] = [];

  if (personnelId) {
    params.push(personnelId);
    where.push(`a.personnel_id = $${params.length}`);
  }

  if (action && action.trim()) {
    params.push(action.trim());
    where.push(`a.action = $${params.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = await pool.query<ArmouryEntry>(
    `SELECT a.id::int, a.personnel_id::int, p.full_name AS personnel_name, p.rank AS personnel_rank,
            a.weapon_type, a.weapon_serial, a.action, u.display_name AS authorized_by_name,
            a.acr_at_action, a.reason, a.action_at::text
     FROM sentinel_armoury a
     JOIN sentinel_personnel p ON p.id = a.personnel_id
     LEFT JOIN sentinel_users u ON u.id = a.authorized_by
     ${whereClause}
     ORDER BY a.action_at DESC
     LIMIT $${params.length + 1}`,
    [...params, limit]
  );

  return rows.rows;
}

export async function createArmouryEntry(
  personnelId: number,
  weaponType: string,
  weaponSerial: string,
  action: string,
  reason: string | null,
  authorizedBy: number | null,
  acrAtAction: string | null
): Promise<ArmouryEntry> {
  const row = await pool.query<ArmouryEntry>(
    `INSERT INTO sentinel_armoury (personnel_id, weapon_type, weapon_serial, action, authorized_by, acr_at_action, reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id::int, personnel_id::int, weapon_type, weapon_serial, action, acr_at_action, reason, action_at::text`,
    [personnelId, weaponType, weaponSerial, action, authorizedBy, acrAtAction, reason]
  );

  return row.rows[0];
}
