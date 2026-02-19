import api from './api'
import type { SharingPreference } from '../types/models'

export async function getSharingStatus(): Promise<SharingPreference[]> {
  const response = await api.get('/api/sharing/status')
  return response.data
}

export async function revokeSharing(
  courseId: string,
): Promise<{ success: true }> {
  const response = await api.post(
    `/api/sharing/revoke/${encodeURIComponent(courseId)}`,
  )
  return response.data
}

export async function reinstateSharing(
  courseId: string,
): Promise<{ success: true }> {
  const response = await api.post(
    `/api/sharing/reinstate/${encodeURIComponent(courseId)}`,
  )
  return response.data
}

