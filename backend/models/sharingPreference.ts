import { pool } from '../config/database.js'
import type { SharingPreference } from '../types/models.js'

export async function createSharingPreference(
  studentId: string,
  courseId: string,
): Promise<SharingPreference> {
  const result = await pool.query<SharingPreference>(
    `INSERT INTO sharing_preferences (student_id, course_id)
     VALUES ($1, $2)
     RETURNING *`,
    [studentId, courseId],
  )

  return result.rows[0]
}

export async function getSharingStatus(
  studentId: string,
  courseId: string,
): Promise<SharingPreference | null> {
  const result = await pool.query<SharingPreference>(
    `SELECT * FROM sharing_preferences
     WHERE student_id = $1 AND course_id = $2`,
    [studentId, courseId],
  )
  return result.rows[0] ?? null
}

export async function revokeSharing(
  studentId: string,
  courseId: string,
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE sharing_preferences
     SET is_shared = FALSE,
         updated_at = now()
     WHERE student_id = $1 AND course_id = $2`,
    [studentId, courseId],
  )

  return (result.rowCount ?? 0) > 0
}

export async function reinstateSharing(
  studentId: string,
  courseId: string,
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE sharing_preferences
     SET is_shared = TRUE,
         updated_at = now()
     WHERE student_id = $1 AND course_id = $2`,
    [studentId, courseId],
  )

  return (result.rowCount ?? 0) > 0
}

export async function getSharingPreferencesForStudent(
  studentId: string,
): Promise<SharingPreference[]> {
  const result = await pool.query<SharingPreference>(
    `SELECT * FROM sharing_preferences
     WHERE student_id = $1`,
    [studentId],
  )
  return result.rows
}

