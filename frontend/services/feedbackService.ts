import api from './api'
import type { FeedbackResponse, PolicyDocument } from '../types/models'

export async function getFeedback(
  declarationId: string,
): Promise<FeedbackResponse> {
  const response = await api.get(
    `/api/declarations/${encodeURIComponent(declarationId)}/feedback`,
  )
  return response.data
}

export async function getCurrentPolicy(): Promise<PolicyDocument> {
  const response = await api.get('/api/policy/current')
  return response.data
}

