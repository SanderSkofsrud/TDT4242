import api from './api'
import type { StudentAssignmentsResponse } from '../types/models'

export async function getStudentAssignments(): Promise<StudentAssignmentsResponse> {
  const response = await api.get('/api/assignments')
  return response.data as StudentAssignmentsResponse
}
