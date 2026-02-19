import { pool } from '../config/database.js'
import type { Assignment } from '../types/models.js'

export async function findAssignmentById(
  id: string,
): Promise<Assignment | null> {
  const result = await pool.query<Assignment>(
    'SELECT * FROM assignments WHERE id = $1',
    [id],
  )
  return result.rows[0] ?? null
}

