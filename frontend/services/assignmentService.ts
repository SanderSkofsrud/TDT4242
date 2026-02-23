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

export interface CreateAssignmentInput {
  title: string
  dueDate: string
}

export async function createInstructorAssignment(
  courseId: string,
  data: CreateAssignmentInput,
): Promise<{ id: string; courseId: string; title: string; dueDate: string; createdAt: string }> {
  const response = await api.post(
    `/api/instructor/${encodeURIComponent(courseId)}/assignments`,
    { title: data.title, dueDate: data.dueDate },
  )
  return response.data
}
