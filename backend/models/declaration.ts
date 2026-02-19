import { pool } from '../config/database.js'
import { calculateExpiresAt } from '../config/retention.js'
import type { Declaration } from '../types/models.js'

export interface DeclarationInsert {
  student_id: string
  assignment_id: string
  tools_used: string[]
  categories: string[]
  frequency: Declaration['frequency']
  context_text: string | null
  policy_version: number
}

export async function createDeclaration(
  data: DeclarationInsert,
): Promise<Declaration> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const assignmentRes = await client.query<{ due_date: Date }>(
      'SELECT due_date FROM assignments WHERE id = $1',
      [data.assignment_id],
    )
    const assignment = assignmentRes.rows[0]
    if (!assignment) {
      throw new Error('Assignment not found for declaration')
    }

    const expiresAt = calculateExpiresAt(new Date(assignment.due_date))

    const insertRes = await client.query<Declaration>(
      `INSERT INTO declarations (
         student_id,
         assignment_id,
         tools_used,
         categories,
         frequency,
         context_text,
         policy_version,
         expires_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.student_id,
        data.assignment_id,
        data.tools_used,
        data.categories,
        data.frequency,
        data.context_text,
        data.policy_version,
        expiresAt,
      ],
    )

    await client.query('COMMIT')
    return insertRes.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function findDeclarationById(id: string): Promise<Declaration | null> {
  const result = await pool.query<Declaration>(
    'SELECT * FROM declarations WHERE id = $1',
    [id],
  )
  return result.rows[0] ?? null
}

export async function findDeclarationsByStudent(
  studentId: string,
): Promise<Declaration[]> {
  const result = await pool.query<Declaration>(
    'SELECT * FROM declarations WHERE student_id = $1',
    [studentId],
  )
  return result.rows
}

export async function findDeclarationByStudentAndAssignment(
  studentId: string,
  assignmentId: string,
): Promise<Declaration | null> {
  const result = await pool.query<Declaration>(
    'SELECT * FROM declarations WHERE student_id = $1 AND assignment_id = $2',
    [studentId, assignmentId],
  )
  return result.rows[0] ?? null
}

export async function findSharedDeclarationsForCourse(
  courseId: string,
  assignmentIds: string[],
): Promise<Declaration[]> {
  if (assignmentIds.length === 0) {
    return []
  }

  const result = await pool.query<Declaration>(
    `SELECT d.*
     FROM declarations d
     JOIN assignments a ON a.id = d.assignment_id
     JOIN sharing_preferences sp
       ON sp.student_id = d.student_id
      AND sp.course_id = a.course_id
     WHERE a.course_id = $1
       AND a.id = ANY($2::uuid[])
       AND sp.is_shared = TRUE`,
    [courseId, assignmentIds],
  )

  return result.rows
}

export async function hardDeleteExpiredDeclarations(): Promise<number> {
  const result = await pool.query(
    'DELETE FROM declarations WHERE expires_at < now()',
  )
  return result.rowCount ?? 0
}

