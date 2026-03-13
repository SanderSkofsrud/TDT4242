import { describe, expect, it, vi } from 'vitest'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import api from '../../services/api'
import {
  getSharingStatus,
  reinstateSharing,
  revokeSharing,
} from '../../services/sharingService'

const mockedGet = vi.mocked(api.get)
const mockedPost = vi.mocked(api.post)

describe('sharingService', () => {
  it('maps sharing status responses to the frontend model', async () => {
    mockedGet.mockResolvedValueOnce({
      data: [
        {
          student_id: 'student-1',
          course_id: 'course-1',
          course_code: 'TDT4242',
          course_name: 'Software Testing',
          is_shared: true,
          updated_at: '2026-03-10T10:00:00.000Z',
        },
      ],
    } as never)

    const result = await getSharingStatus()

    expect(mockedGet).toHaveBeenCalledWith('/api/sharing/status')
    expect(result).toEqual([
      {
        studentId: 'student-1',
        courseId: 'course-1',
        courseCode: 'TDT4242',
        courseName: 'Software Testing',
        isShared: true,
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
    ])
  })

  it('revokes sharing for an encoded course id', async () => {
    mockedPost.mockResolvedValueOnce({ data: { success: true } } as never)

    await expect(revokeSharing('course/with spaces')).resolves.toEqual({
      success: true,
    })
    expect(mockedPost).toHaveBeenCalledWith(
      '/api/sharing/revoke/course%2Fwith%20spaces',
    )
  })

  it('reinstates sharing for an encoded course id', async () => {
    mockedPost.mockResolvedValueOnce({ data: { success: true } } as never)

    await expect(reinstateSharing('course/with spaces')).resolves.toEqual({
      success: true,
    })
    expect(mockedPost).toHaveBeenCalledWith(
      '/api/sharing/reinstate/course%2Fwith%20spaces',
    )
  })
})
