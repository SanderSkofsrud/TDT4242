import { pool } from '../config/database.js'
import type { PolicyDocument } from '../types/models.js'

export async function uploadPolicyDocument(
  filePath: string,
  version: number,
  uploadedBy: string,
): Promise<PolicyDocument> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query('UPDATE policy_documents SET is_current = FALSE WHERE is_current = TRUE')

    const result = await client.query<PolicyDocument>(
      `INSERT INTO policy_documents (version, file_path, uploaded_by, is_current)
       VALUES ($1, $2, $3, TRUE)
       RETURNING *`,
      [version, filePath, uploadedBy],
    )

    await client.query('COMMIT')
    return result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getCurrentPolicy(): Promise<PolicyDocument | null> {
  const result = await pool.query<PolicyDocument>(
    'SELECT * FROM policy_documents WHERE is_current = TRUE LIMIT 1',
  )
  return result.rows[0] ?? null
}

export async function getPolicyByVersion(
  version: number,
): Promise<PolicyDocument | null> {
  const result = await pool.query<PolicyDocument>(
    'SELECT * FROM policy_documents WHERE version = $1',
    [version],
  )
  return result.rows[0] ?? null
}

