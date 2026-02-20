import api from './api'
import type {
  StudentDashboardResponse,
  InstructorCoursesResponse,
  InstructorDashboardResponse,
  FacultyDashboardResponse,
} from '../types/models'

export async function getStudentDashboard(): Promise<StudentDashboardResponse> {
  const response = await api.get('/api/dashboard/student')
  return response.data
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

