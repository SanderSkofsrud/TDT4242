import { pool } from '../config/database.js'
import { RETENTION_DAYS } from '../config/retention.js'
import type { AccessLog } from '../types/models.js'

const DAY_IN_MS = 24 * 60 * 60 * 1000

export async function logAccess(
  actorId: string,
  capability: string,
  resourceId: string | null,
): Promise<AccessLog> {
  const accessedAt = new Date()
  const expiresAt = new Date(accessedAt.getTime() + RETENTION_DAYS * DAY_IN_MS)

  const result = await pool.query<AccessLog>(
    `INSERT INTO access_log (
       actor_id,
       capability,
       resource_id,
       accessed_at,
       expires_at
     )
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [actorId, capability, resourceId, accessedAt, expiresAt],
  )

  return result.rows[0]
}

export async function hardDeleteExpiredLogs(): Promise<number> {
  const result = await pool.query(
    'DELETE FROM access_log WHERE expires_at < now()',
  )
  return result.rowCount ?? 0
}

