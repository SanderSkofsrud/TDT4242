import api from './api'
import type { SharingPreference } from '../types/models'

export async function getSharingStatus(): Promise<SharingPreference[]> {
  const response = await api.get('/api/sharing/status')
  const raw = response.data as Array<{
    student_id: string
    course_id: string
    course_code: string
    course_name: string
    is_shared: boolean
    updated_at: string
  }>
  return raw.map((item) => ({
    studentId: item.student_id,
    courseId: item.course_id,
    courseCode: item.course_code,
    courseName: item.course_name,
    isShared: item.is_shared,
    updatedAt: item.updated_at,
  }))
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

