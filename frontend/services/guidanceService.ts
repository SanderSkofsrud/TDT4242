import api from './api'
import type { AssignmentGuidance } from '../types/models'

type GuidanceApi = {
  id: string
  assignment_id: string
  permitted_text: string
  prohibited_text: string
  permitted_categories: AssignmentGuidance['permittedCategories']
  prohibited_categories: AssignmentGuidance['prohibitedCategories']
  examples: AssignmentGuidance['examples']
  created_by: string
  locked_at: string | null
  created_at: string
}

function mapGuidance(api: GuidanceApi): AssignmentGuidance {
  return {
    id: api.id,
    assignmentId: api.assignment_id,
    permittedText: api.permitted_text,
    prohibitedText: api.prohibited_text,
    permittedCategories: api.permitted_categories,
    prohibitedCategories: api.prohibited_categories,
    examples: api.examples,
    createdBy: api.created_by,
    lockedAt: api.locked_at,
    createdAt: api.created_at,
  }
}

export async function getGuidance(
  assignmentId: string,
): Promise<AssignmentGuidance> {
  const response = await api.get(
    `/api/assignments/${encodeURIComponent(assignmentId)}/guidance`,
  )
  return mapGuidance(response.data as GuidanceApi)
}

export async function createGuidance(
  assignmentId: string,
  data: {
    permittedText: string
    prohibitedText: string
    permittedCategories?: AssignmentGuidance['permittedCategories']
    prohibitedCategories?: AssignmentGuidance['prohibitedCategories']
    examples?: AssignmentGuidance['examples']
  },
): Promise<AssignmentGuidance> {
  const response = await api.post(
    `/api/assignments/${encodeURIComponent(assignmentId)}/guidance`,
    data,
  )
  return mapGuidance(response.data as GuidanceApi)
}

export async function updateGuidance(
  assignmentId: string,
  data: {
    permittedText: string
    prohibitedText: string
    permittedCategories?: AssignmentGuidance['permittedCategories']
    prohibitedCategories?: AssignmentGuidance['prohibitedCategories']
    examples?: AssignmentGuidance['examples']
  },
): Promise<AssignmentGuidance> {
  const response = await api.put(
    `/api/assignments/${encodeURIComponent(assignmentId)}/guidance`,
    data,
  )
  return mapGuidance(response.data as GuidanceApi)
}

