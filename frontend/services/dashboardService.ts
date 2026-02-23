import api from './api'
import type {
  StudentDashboardResponse,
  Declaration,
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
  return response.data
}

export async function getFacultyDashboard(
  facultyId: string,
): Promise<FacultyDashboardResponse> {
  const response = await api.get('/api/dashboard/faculty', {
    params: { facultyId },
  })
  return response.data
}

