import api from './api'
import type { StudentAssignmentsResponse, InstructorAssignmentsResponse } from '../types/models'

export async function getStudentAssignments(): Promise<StudentAssignmentsResponse> {
  const response = await api.get('/api/assignments')
  return response.data as StudentAssignmentsResponse
}

export async function getInstructorAssignments(
  courseId: string,
): Promise<InstructorAssignmentsResponse> {
  const response = await api.get(
    `/api/instructor/${encodeURIComponent(courseId)}/assignments`,
  )
  return response.data as InstructorAssignmentsResponse
}
