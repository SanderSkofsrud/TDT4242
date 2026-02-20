import { pool } from '../config/database.js'

export interface InstructorCourseRow {
  id: string
  code: string
  name: string
}

export async function getCoursesForInstructor(
  userId: string,
): Promise<InstructorCourseRow[]> {
  const result = await pool.query<InstructorCourseRow>(
    `SELECT c.id, c.code, c.name
     FROM courses c
     INNER JOIN enrolments e ON e.course_id = c.id
     WHERE e.user_id = $1 AND e.role = 'instructor'
     ORDER BY c.code`,
    [userId],
  )
  return result.rows
}

export async function isUserInstructorInCourse(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1
     FROM enrolments
     WHERE user_id = $1
       AND course_id = $2
       AND role = 'instructor'
     LIMIT 1`,
    [userId, courseId],
  )

  return result.rowCount === 1
}

export async function isStudentEnrolledInCourse(
  studentId: string,
  courseId: string,
): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1
     FROM enrolments
     WHERE user_id = $1
       AND course_id = $2
       AND role = 'student'
     LIMIT 1`,
    [studentId, courseId],
  )

  return result.rowCount === 1
}

