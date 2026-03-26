import { pool } from "../db/pool.js";
import type { DashboardStats, ActivityItem } from "../types/models.js";

export async function getDashboardStats(): Promise<DashboardStats> {
  const [personnelResult, verifiedResult, checkpointsResult, weaponsResult] = await Promise.all([
    pool.query<{ count: string }>(`SELECT count(*)::text FROM sentinel_personnel WHERE status != 'RETIRED' AND service_number != 'SEED-MARKER-001'`),
    pool.query<{ count: string }>(`SELECT count(*)::text FROM sentinel_personnel WHERE zk_verified = TRUE AND status != 'RETIRED' AND service_number != 'SEED-MARKER-001'`),
    pool.query<{ count: string }>(`SELECT count(*)::text FROM sentinel_checkpoints WHERE verified_at >= CURRENT_DATE`),
    pool.query<{ count: string }>(`
      SELECT count(*)::text FROM (
        SELECT personnel_id, weapon_serial FROM sentinel_armoury
        WHERE action = 'CHECKOUT'
        AND NOT EXISTS (
          SELECT 1 FROM sentinel_armoury r
          WHERE r.weapon_serial = sentinel_armoury.weapon_serial
            AND r.action = 'RETURN'
            AND r.action_at > sentinel_armoury.action_at
        )
      ) outstanding
    `)
  ]);

  // Recent activity: last 10 events across checkpoints, armoury
  const activityResult = await pool.query<{ type: string; description: string; timestamp: string }>(`
    (
      SELECT 'checkpoint' AS type,
             p.full_name || ' verified at ' || c.checkpoint_name AS description,
             c.verified_at::text AS timestamp
      FROM sentinel_checkpoints c
      JOIN sentinel_personnel p ON p.id = c.personnel_id
      ORDER BY c.verified_at DESC LIMIT 5
    )
    UNION ALL
    (
      SELECT 'armoury' AS type,
             p.full_name || ' ' || LOWER(a.action) || ' ' || a.weapon_type AS description,
             a.action_at::text AS timestamp
      FROM sentinel_armoury a
      JOIN sentinel_personnel p ON p.id = a.personnel_id
      ORDER BY a.action_at DESC LIMIT 5
    )
    ORDER BY timestamp DESC
    LIMIT 10
  `);

  return {
    total_personnel: Number(personnelResult.rows[0].count),
    zk_verified: Number(verifiedResult.rows[0].count),
    checkpoints_today: Number(checkpointsResult.rows[0].count),
    weapons_out: Number(weaponsResult.rows[0].count),
    recent_activity: activityResult.rows as ActivityItem[]
  };
}
