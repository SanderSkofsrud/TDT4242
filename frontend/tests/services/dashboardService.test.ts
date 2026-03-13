import { describe, expect, it, vi } from 'vitest'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import api from '../../services/api'
import {
  getFacultyDashboard,
  getInstructorCourses,
  getInstructorDashboard,
  getStudentDashboard,
} from '../../services/dashboardService'

const mockedGet = vi.mocked(api.get)

describe('dashboardService', () => {
  it('maps student declarations to the frontend model', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        declarations: [
          {
            id: 'declaration-1',
            student_id: 'student-1',
            assignment_id: 'assignment-1',
            tools_used: ['ChatGPT'],
            categories: ['explanation'],
            frequency: 'light',
            context_text: 'Used for outlining.',
            policy_version: 2,
            submitted_at: '2026-03-01T10:00:00.000Z',
            expires_at: '2026-09-01T10:00:00.000Z',
          },
        ],
        summary: {
          totalDeclarations: 1,
          byCategory: { explanation: 1 },
          byFrequency: { light: 1 },
          perAssignment: [],
          perMonth: [],
        },
      },
    } as never)

    const result = await getStudentDashboard()

    expect(mockedGet).toHaveBeenCalledWith('/api/dashboard/student')
    expect(result.declarations).toEqual([
      {
        id: 'declaration-1',
        studentId: 'student-1',
        assignmentId: 'assignment-1',
        toolsUsed: ['ChatGPT'],
        categories: ['explanation'],
        frequency: 'light',
        contextText: 'Used for outlining.',
        policyVersion: 2,
        submittedAt: '2026-03-01T10:00:00.000Z',
        expiresAt: '2026-09-01T10:00:00.000Z',
      },
    ])
  })

  it('returns instructor courses without remapping', async () => {
    const response = {
      courses: [
        {
          id: 'course-1',
          code: 'TDT4242',
          name: 'Software Testing',
        },
      ],
    }

    mockedGet.mockResolvedValueOnce({ data: response } as never)

    await expect(getInstructorCourses()).resolves.toEqual(response)
    expect(mockedGet).toHaveBeenCalledWith('/api/dashboard/instructor-courses')
  })

  it('maps instructor aggregate rows from mixed API shapes', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        suppressed: false,
        data: [
          {
            assignmentId: 'assignment-1',
            courseId: 'course-1',
            category: 'explanation',
            frequency: 'light',
            declarationCount: 7,
          },
          {
            assignment_id: 'assignment-2',
            course_id: 'course-2',
            category: 'structure',
            frequency: 'moderate',
            declaration_count: '5',
          },
          {
            category: 'rephrasing',
            frequency: 'extensive',
            declaration_count: 'not-a-number',
          },
          {
            assignment_id: 'assignment-3',
            course_id: 'course-3',
            category: 'code_assistance',
            frequency: 'none',
          },
        ],
      },
    } as never)

    const result = await getInstructorDashboard('course/with spaces')

    expect(mockedGet).toHaveBeenCalledWith(
      '/api/dashboard/instructor/course%2Fwith%20spaces',
    )
    expect(result.data).toEqual([
      {
        assignmentId: 'assignment-1',
        courseId: 'course-1',
        category: 'explanation',
        frequency: 'light',
        declarationCount: 7,
      },
      {
        assignmentId: 'assignment-2',
        courseId: 'course-2',
        category: 'structure',
        frequency: 'moderate',
        declarationCount: 5,
      },
      {
        assignmentId: '',
        courseId: '',
        category: 'rephrasing',
        frequency: 'extensive',
        declarationCount: 0,
      },
      {
        assignmentId: 'assignment-3',
        courseId: 'course-3',
        category: 'code_assistance',
        frequency: 'none',
        declarationCount: 0,
      },
    ])
  })

  it('maps faculty aggregate rows and forwards the faculty filter', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        suppressed: false,
        data: [
          {
            courseId: 'course-1',
            facultyId: 'faculty-1',
            courseCode: 'TDT4242',
            courseName: 'Software Testing',
            category: 'code_assistance',
            frequency: 'light',
            declarationCount: 4,
          },
          {
            course_id: 'course-2',
            faculty_id: 'faculty-2',
            course_code: 'TMA4100',
            course_name: 'Calculus',
            category: 'structure',
            frequency: 'moderate',
            declaration_count: '8',
          },
          {
            category: 'rephrasing',
            frequency: 'none',
            declaration_count: 'invalid',
          },
        ],
      },
    } as never)

    const result = await getFacultyDashboard('faculty-42')

    expect(mockedGet).toHaveBeenCalledWith('/api/dashboard/faculty', {
      params: { facultyId: 'faculty-42' },
    })
    expect(result.data).toEqual([
      {
        courseId: 'course-1',
        facultyId: 'faculty-1',
        courseCode: 'TDT4242',
        courseName: 'Software Testing',
        category: 'code_assistance',
        frequency: 'light',
        declarationCount: 4,
      },
      {
        courseId: 'course-2',
        facultyId: 'faculty-2',
        courseCode: 'TMA4100',
        courseName: 'Calculus',
        category: 'structure',
        frequency: 'moderate',
        declarationCount: 8,
      },
      {
        courseId: '',
        facultyId: '',
        courseCode: '',
        courseName: '',
        category: 'rephrasing',
        frequency: 'none',
        declarationCount: 0,
      },
    ])
  })
})
