import api from './api'
import type { Declaration } from '../types/models'

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
  return mapDeclaration(response.data as DeclarationApi)
}

export async function getDeclaration(
  declarationId: string,
): Promise<Declaration> {
  const response = await api.get(`/api/declarations/${declarationId}`)
  return mapDeclaration(response.data as DeclarationApi)
}

export async function getMyDeclarations(): Promise<Declaration[]> {
  const response = await api.get('/api/declarations')
  return (response.data as DeclarationApi[]).map(mapDeclaration)
}

