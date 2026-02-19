import { pool } from '../config/database.js'

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

