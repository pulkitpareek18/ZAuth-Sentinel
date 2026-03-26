import { pool } from "../db/pool.js";
import type { Dispatch } from "../types/models.js";

export function parseTags(input: unknown): string[] {
  const raw = Array.isArray(input)
    ? input.map((tag) => String(tag).trim())
    : String(input ?? "")
        .split(",")
        .map((tag) => tag.trim());

  const unique = new Set<string>();
  for (const tag of raw) {
    if (!tag || tag.length > 40) continue;
    unique.add(tag.toLowerCase());
    if (unique.size >= 32) break;
  }

  return Array.from(unique);
}

export async function listDispatches(userId: number, q?: string, classification?: string, priority?: string): Promise<Dispatch[]> {
  const where: string[] = ["user_id = $1", "is_archived = FALSE"];
  const params: unknown[] = [userId];

  if (q && q.trim()) {
    params.push(`%${q.trim()}%`);
    where.push(`(title ILIKE $${params.length} OR content ILIKE $${params.length})`);
  }

  if (classification && classification.trim()) {
    params.push(classification.trim());
    where.push(`classification = $${params.length}`);
  }

  if (priority && priority.trim()) {
    params.push(priority.trim());
    where.push(`priority = $${params.length}`);
  }

  const result = await pool.query<Dispatch>(
    `SELECT id::int, title, content, classification, priority, tags, is_archived, updated_at::text, created_at::text
     FROM sentinel_dispatches
     WHERE ${where.join(" AND ")}
     ORDER BY updated_at DESC
     LIMIT 200`,
    params
  );

  return result.rows;
}

export async function createDispatch(
  userId: number,
  title: string,
  content: string,
  classification: string,
  priority: string,
  tags: string[]
): Promise<Dispatch> {
  const result = await pool.query<Dispatch>(
    `INSERT INTO sentinel_dispatches (user_id, title, content, classification, priority, tags)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING id::int, title, content, classification, priority, tags, is_archived, updated_at::text, created_at::text`,
    [userId, title, content, classification, priority, JSON.stringify(tags)]
  );

  return result.rows[0];
}

export async function updateDispatch(
  userId: number,
  dispatchId: number,
  updates: { title?: string; content?: string; classification?: string; priority?: string; tags?: string[] }
): Promise<Dispatch | null> {
  const fields: string[] = [];
  const values: unknown[] = [userId, dispatchId];

  if (updates.title !== undefined) { values.push(updates.title); fields.push(`title = $${values.length}`); }
  if (updates.content !== undefined) { values.push(updates.content); fields.push(`content = $${values.length}`); }
  if (updates.classification !== undefined) { values.push(updates.classification); fields.push(`classification = $${values.length}`); }
  if (updates.priority !== undefined) { values.push(updates.priority); fields.push(`priority = $${values.length}`); }
  if (updates.tags !== undefined) { values.push(JSON.stringify(updates.tags)); fields.push(`tags = $${values.length}::jsonb`); }

  if (fields.length === 0) return null;

  fields.push("updated_at = NOW()");

  const result = await pool.query<Dispatch>(
    `UPDATE sentinel_dispatches
     SET ${fields.join(", ")}
     WHERE user_id = $1 AND id = $2
     RETURNING id::int, title, content, classification, priority, tags, is_archived, updated_at::text, created_at::text`,
    values
  );

  return result.rows[0] ?? null;
}

export async function deleteDispatch(userId: number, dispatchId: number): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM sentinel_dispatches WHERE id = $1 AND user_id = $2`,
    [dispatchId, userId]
  );

  return Boolean(result.rowCount);
}
