import api from './api'
import type { AssignmentGuidance } from '../types/models'

export async function getGuidance(
  assignmentId: string,
): Promise<AssignmentGuidance> {
  const response = await api.get(
    `/api/assignments/${encodeURIComponent(assignmentId)}/guidance`,
  )
  return response.data
}

export async function createGuidance(
  assignmentId: string,
  data: {
    permittedText: string
    prohibitedText: string
    examples?: AssignmentGuidance['examples']
  },
): Promise<AssignmentGuidance> {
  const response = await api.post(
    `/api/assignments/${encodeURIComponent(assignmentId)}/guidance`,
    data,
  )
  return response.data
}

export async function updateGuidance(
  assignmentId: string,
  data: {
    permittedText: string
    prohibitedText: string
    examples?: AssignmentGuidance['examples']
  },
): Promise<AssignmentGuidance> {
  const response = await api.put(
    `/api/assignments/${encodeURIComponent(assignmentId)}/guidance`,
    data,
  )
  return response.data
}

