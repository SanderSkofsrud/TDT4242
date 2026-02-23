import { pool } from '../config/database.js'
import type { Assignment } from '../types/models.js'

export interface StudentAssignmentRow {
  assignment_id: string
  course_id: string
  course_code: string
  course_name: string
  title: string
  due_date: Date
  declaration_id: string | null
  declaration_submitted_at: Date | null
}

export interface InstructorAssignmentRow {
  assignment_id: string
  course_id: string
  title: string
  due_date: Date
  guidance_id: string | null
  guidance_locked_at: Date | null
}

export async function findAssignmentById(
  id: string,
): Promise<Assignment | null> {
  const result = await pool.query<Assignment>(
    'SELECT * FROM assignments WHERE id = $1',
    [id],
  )
  return result.rows[0] ?? null
}

export async function findAssignmentsForStudent(
  studentId: string,
): Promise<StudentAssignmentRow[]> {
  const result = await pool.query<StudentAssignmentRow>(
    `SELECT a.id AS assignment_id,
            a.course_id AS course_id,
            c.code AS course_code,
            c.name AS course_name,
            a.title AS title,
            a.due_date AS due_date,
            d.id AS declaration_id,
            d.submitted_at AS declaration_submitted_at
     FROM assignments a
     INNER JOIN courses c ON c.id = a.course_id
     INNER JOIN enrolments e
       ON e.course_id = a.course_id
      AND e.user_id = $1
      AND e.role = 'student'
     LEFT JOIN declarations d
       ON d.assignment_id = a.id
      AND d.student_id = $1
     ORDER BY a.due_date ASC, a.title ASC`,
    [studentId],
  )
  return result.rows
}

export async function findAssignmentsForCourse(
  courseId: string,
): Promise<InstructorAssignmentRow[]> {
  const result = await pool.query<InstructorAssignmentRow>(
    `SELECT a.id AS assignment_id,
            a.course_id AS course_id,
            a.title AS title,
            a.due_date AS due_date,
            g.id AS guidance_id,
            g.locked_at AS guidance_locked_at
     FROM assignments a
     LEFT JOIN assignment_guidance g ON g.assignment_id = a.id
     WHERE a.course_id = $1
     ORDER BY a.due_date ASC, a.title ASC`,
    [courseId],
  )
  return result.rows
}

