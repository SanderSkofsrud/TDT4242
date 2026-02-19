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
  category: string
  frequency: string
  declaration_count: number
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
            category,
            frequency,
            declaration_count
     FROM v_faculty_aggregate
     WHERE faculty_id = $1`,
    [facultyId],
  )

  return result.rows
}

