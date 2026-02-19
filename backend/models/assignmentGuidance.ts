import { pool } from '../config/database.js'
import type { AssignmentGuidance } from '../types/models.js'

export interface GuidanceInsert {
  assignment_id: string
  permitted_text: string
  prohibited_text: string
  examples: AssignmentGuidance['examples']
  created_by: string
}

export interface GuidanceUpdate {
  permitted_text?: string
  prohibited_text?: string
  examples?: AssignmentGuidance['examples']
}

export async function createGuidance(
  data: GuidanceInsert,
): Promise<AssignmentGuidance> {
  const result = await pool.query<AssignmentGuidance>(
    `INSERT INTO assignment_guidance (
       assignment_id,
       permitted_text,
       prohibited_text,
       examples,
       created_by
     )
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.assignment_id,
      data.permitted_text,
      data.prohibited_text,
      data.examples,
      data.created_by,
    ],
  )

  return result.rows[0]
}

export async function findGuidanceByAssignment(
  assignmentId: string,
): Promise<AssignmentGuidance | null> {
  const result = await pool.query<AssignmentGuidance>(
    'SELECT * FROM assignment_guidance WHERE assignment_id = $1',
    [assignmentId],
  )
  return result.rows[0] ?? null
}

export async function updateGuidance(
  assignmentId: string,
  data: GuidanceUpdate,
): Promise<AssignmentGuidance | null> {
  const fields: string[] = []
  const values: unknown[] = []

  if (data.permitted_text !== undefined) {
    fields.push('permitted_text')
    values.push(data.permitted_text)
  }
  if (data.prohibited_text !== undefined) {
    fields.push('prohibited_text')
    values.push(data.prohibited_text)
  }
  if (data.examples !== undefined) {
    fields.push('examples')
    values.push(data.examples)
  }

  if (fields.length === 0) {
    const current = await findGuidanceByAssignment(assignmentId)
    return current && current.locked_at === null ? current : null
  }

  const setClauses = fields.map((field, index) => `${field} = $${index + 1}`)
  values.push(assignmentId)

  const result = await pool.query<AssignmentGuidance>(
    `UPDATE assignment_guidance
     SET ${setClauses.join(', ')}
     WHERE assignment_id = $${values.length}
       AND locked_at IS NULL
     RETURNING *`,
    values,
  )

  return result.rows[0] ?? null
}

export async function lockGuidance(
  assignmentId: string,
): Promise<AssignmentGuidance | null> {
  const result = await pool.query<AssignmentGuidance>(
    `UPDATE assignment_guidance
     SET locked_at = now()
     WHERE assignment_id = $1
       AND locked_at IS NULL
     RETURNING *`,
    [assignmentId],
  )

  return result.rows[0] ?? null
}

