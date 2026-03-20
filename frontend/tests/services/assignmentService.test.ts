import { describe, expect, it, vi } from 'vitest'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import api from '../../services/api'
import {
  createInstructorAssignment,
  getInstructorAssignments,
  getStudentAssignments,
} from '../../services/assignmentService'

const mockedGet = vi.mocked(api.get)
const mockedPost = vi.mocked(api.post)

describe('assignmentService', () => {
  it('loads student assignments without remapping', async () => {
    const response = {
      assignments: [
        {
          id: 'assignment-1',
          title: 'Exercise 3',
          dueDate: '2026-05-01',
          course: {
            id: 'course-1',
            code: 'TDT4242',
            name: 'Software Testing',
          },
          declaration: null,
        },
      ],
    }

    mockedGet.mockResolvedValueOnce({ data: response } as never)

    await expect(getStudentAssignments()).resolves.toEqual(response)
    expect(mockedGet).toHaveBeenCalledWith('/api/assignments')
  })

  it('loads instructor assignments for an encoded course id', async () => {
    const response = {
      courseId: 'course/1',
      assignments: [
        {
          id: 'assignment-1',
          courseId: 'course/1',
          title: 'Exercise 3',
          dueDate: '2026-05-01',
          guidance: {
            id: 'guidance-1',
            lockedAt: null,
          },
        },
      ],
    }

    mockedGet.mockResolvedValueOnce({ data: response } as never)

    await expect(getInstructorAssignments('course/1')).resolves.toEqual(response)
    expect(mockedGet).toHaveBeenCalledWith(
      '/api/instructor/course%2F1/assignments',
    )
  })

  it('creates an instructor assignment and forwards the payload unchanged', async () => {
    const response = {
      id: 'assignment-1',
      courseId: 'course/1',
      title: 'Exercise 3',
      dueDate: '2026-05-01',
      createdAt: '2026-03-12T10:00:00.000Z',
    }

    mockedPost.mockResolvedValueOnce({ data: response } as never)

    await expect(
      createInstructorAssignment('course/1', {
        title: 'Exercise 3',
        dueDate: '2026-05-01',
      }),
    ).resolves.toEqual(response)

    expect(mockedPost).toHaveBeenCalledWith(
      '/api/instructor/course%2F1/assignments',
      { title: 'Exercise 3', dueDate: '2026-05-01' },
    )
  })
})
