import api from './api'
import type { Declaration } from '../types/models'

export type DeclarationSubmitInput = {
  assignmentId: string
  toolsUsed: string[]
  categories: Declaration['categories']
  frequency: Declaration['frequency']
  contextText: string | null
}

export async function submitDeclaration(
  data: DeclarationSubmitInput,
): Promise<Declaration> {
  const response = await api.post('/api/declarations', {
    assignmentId: data.assignmentId,
    toolsUsed: data.toolsUsed,
    categories: data.categories,
    frequency: data.frequency,
    contextText: data.contextText,
  })
  return response.data
}

export async function getDeclaration(
  declarationId: string,
): Promise<Declaration> {
  const response = await api.get(`/api/declarations/${declarationId}`)
  return response.data
}

export async function getMyDeclarations(): Promise<Declaration[]> {
  const response = await api.get('/api/declarations')
  return response.data
}

