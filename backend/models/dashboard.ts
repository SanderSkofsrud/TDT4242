import { pool } from '../config/database.js'

export interface InstructorAggregateRow {
  assignment_id: string
  course_id: string
  category: string
  frequency: string
  declaration_count: number
}

export interface FacultyAggregateRow {
  course_id: string
  faculty_id: string
  course_code: string
  course_name: string
  category: string
  frequency: string
  declaration_count: number
}

export interface CourseCohortStats {
  enrolled_students: number
  shared_students_with_declarations: number
}

export interface FacultyCohortStats {
  enrolled_students: number
  shared_students_with_declarations: number
}

export async function getInstructorAggregateForCourse(
  courseId: string,
): Promise<InstructorAggregateRow[]> {
  const result = await pool.query<InstructorAggregateRow>(
    `SELECT assignment_id,
            course_id,
            category,
            frequency,
            declaration_count
     FROM v_instructor_aggregate
     WHERE course_id = $1`,
    [courseId],
  )

  return result.rows
}

export async function getFacultyAggregateForFaculty(
  facultyId: string,
): Promise<FacultyAggregateRow[]> {
  const result = await pool.query<FacultyAggregateRow>(
    `SELECT course_id,
            faculty_id,
            course_code,
            course_name,
            category,
            frequency,
            declaration_count
     FROM v_faculty_aggregate
     WHERE faculty_id = $1`,
    [facultyId],
  )

  return result.rows
}

export async function getCourseCohortStats(
  courseId: string,
): Promise<CourseCohortStats> {
  const result = await pool.query<CourseCohortStats>(
    `SELECT
       (
         SELECT COUNT(DISTINCT e.user_id)::int
         FROM enrolments e
         WHERE e.course_id = $1
           AND e.role = 'student'
       ) AS enrolled_students,
       (
         SELECT COUNT(DISTINCT d.student_id)::int
         FROM declarations d
         JOIN assignments a ON a.id = d.assignment_id
         JOIN sharing_preferences sp
           ON sp.student_id = d.student_id
          AND sp.course_id = a.course_id
          AND sp.is_shared = TRUE
         WHERE a.course_id = $1
           AND d.expires_at > now()
       ) AS shared_students_with_declarations`,
    [courseId],
  )

  return result.rows[0]
}

export async function getFacultyCohortStats(
  facultyId: string,
): Promise<FacultyCohortStats> {
  const result = await pool.query<FacultyCohortStats>(
    `SELECT
       (
         SELECT COUNT(DISTINCT e.user_id)::int
         FROM enrolments e
         JOIN courses c ON c.id = e.course_id
         WHERE c.faculty_id = $1
           AND e.role = 'student'
       ) AS enrolled_students,
       (
         SELECT COUNT(DISTINCT d.student_id)::int
         FROM declarations d
         JOIN assignments a ON a.id = d.assignment_id
         JOIN courses c ON c.id = a.course_id
         JOIN sharing_preferences sp
           ON sp.student_id = d.student_id
          AND sp.course_id = a.course_id
          AND sp.is_shared = TRUE
         WHERE c.faculty_id = $1
           AND d.expires_at > now()
       ) AS shared_students_with_declarations`,
    [facultyId],
  )

  return result.rows[0]
}

