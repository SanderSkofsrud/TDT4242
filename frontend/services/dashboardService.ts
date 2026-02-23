import api from './api'
import type {
  StudentDashboardResponse,
  Declaration,
  InstructorAggregateRow,
  FacultyAggregateRow,
  InstructorCoursesResponse,
  InstructorDashboardResponse,
  FacultyDashboardResponse,
} from '../types/models'

type DeclarationApi = {
  id: string
  student_id: string
  assignment_id: string
  tools_used: string[]
  categories: Declaration['categories']
  frequency: Declaration['frequency']
  context_text: string | null
  policy_version: number
  submitted_at: string
  expires_at: string
}

function mapDeclaration(api: DeclarationApi): Declaration {
  return {
    id: api.id,
    studentId: api.student_id,
    assignmentId: api.assignment_id,
    toolsUsed: api.tools_used,
    categories: api.categories,
    frequency: api.frequency,
    contextText: api.context_text,
    policyVersion: api.policy_version,
    submittedAt: api.submitted_at,
    expiresAt: api.expires_at,
  }
}

type InstructorAggregateApi = {
  assignmentId?: string
  assignment_id?: string
  courseId?: string
  course_id?: string
  category: string
  frequency: string
  declarationCount?: number | string
  declaration_count?: number | string
}

type FacultyAggregateApi = {
  courseId?: string
  course_id?: string
  facultyId?: string
  faculty_id?: string
  courseCode?: string
  course_code?: string
  courseName?: string
  course_name?: string
  category: string
  frequency: string
  declarationCount?: number | string
  declaration_count?: number | string
}

function toCount(value: number | string | undefined): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function mapInstructorAggregateRow(row: InstructorAggregateApi): InstructorAggregateRow {
  return {
    assignmentId: row.assignmentId ?? row.assignment_id ?? '',
    courseId: row.courseId ?? row.course_id ?? '',
    category: row.category,
    frequency: row.frequency,
    declarationCount: toCount(row.declarationCount ?? row.declaration_count),
  }
}

function mapFacultyAggregateRow(row: FacultyAggregateApi): FacultyAggregateRow {
  return {
    courseId: row.courseId ?? row.course_id ?? '',
    facultyId: row.facultyId ?? row.faculty_id ?? '',
    courseCode: row.courseCode ?? row.course_code ?? '',
    courseName: row.courseName ?? row.course_name ?? '',
    category: row.category,
    frequency: row.frequency,
    declarationCount: toCount(row.declarationCount ?? row.declaration_count),
  }
}

export async function getStudentDashboard(): Promise<StudentDashboardResponse> {
  const response = await api.get('/api/dashboard/student')
  const raw = response.data as StudentDashboardResponse & {
    declarations: DeclarationApi[]
  }
  return {
    ...raw,
    declarations: raw.declarations.map(mapDeclaration),
  }
}

export async function getInstructorCourses(): Promise<InstructorCoursesResponse> {
  const response = await api.get('/api/dashboard/instructor-courses')
  return response.data
}

export async function getInstructorDashboard(
  courseId: string,
): Promise<InstructorDashboardResponse> {
  const response = await api.get(
    `/api/dashboard/instructor/${encodeURIComponent(courseId)}`,
  )
  const raw = response.data as InstructorDashboardResponse & {
    data?: InstructorAggregateApi[]
  }
  return {
    ...raw,
    data: raw.data?.map(mapInstructorAggregateRow),
  }
}

export async function getFacultyDashboard(
  facultyId: string,
): Promise<FacultyDashboardResponse> {
  const response = await api.get('/api/dashboard/faculty', {
    params: { facultyId },
  })
  const raw = response.data as FacultyDashboardResponse & {
    data?: FacultyAggregateApi[]
  }
  return {
    ...raw,
    data: raw.data?.map(mapFacultyAggregateRow),
  }
}

