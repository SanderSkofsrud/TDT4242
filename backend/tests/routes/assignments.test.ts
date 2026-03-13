import { describe, expect, it, vi } from 'vitest'

async function loadAssignmentsRoute() {
  vi.resetModules()

  const router = {
    get: vi.fn(),
    post: vi.fn(),
  }

  vi.doMock('express', () => ({
    Router: vi.fn(() => router),
  }))

  vi.doMock('../../middleware/authenticate.js', () => ({
    authenticate: 'authenticate',
  }))

  vi.doMock('../../middleware/rbac.js', () => ({
    requireCapability: vi.fn((capability: string) => `rbac:${capability}`),
  }))

  vi.doMock('../../middleware/validateRequest.js', () => ({
    validateRequest: 'validateRequest',
  }))

  vi.doMock('../../config/capabilities.js', () => ({
    CAPABILITIES: {
      'assignment:read:own': 'assignment:read:own',
      'assignment:read:course': 'assignment:read:course',
      'assignment:write:course': 'assignment:write:course',
    },
  }))

  vi.doMock('../../validators/assignmentValidator.js', () => ({
    createAssignmentValidator: ['validator-1', 'validator-2'],
  }))

  vi.doMock('../../controllers/assignmentsController.js', () => ({
    getStudentAssignments: 'getStudentAssignments',
    getInstructorAssignmentsForCourse: 'getInstructorAssignmentsForCourse',
    createAssignmentForCourse: 'createAssignmentForCourse',
  }))

  const module = await import('../../routes/assignments.ts')
  const { requireCapability } = await import('../../middleware/rbac.js')

  return { router, module, requireCapability }
}

describe('assignments routes', () => {
  it('registers the assignment routes with the expected middleware order', async () => {
    const { router, module, requireCapability } = await loadAssignmentsRoute()

    expect(module.default).toBe(router)
    expect(requireCapability).toHaveBeenCalledWith('assignment:read:own')
    expect(requireCapability).toHaveBeenCalledWith('assignment:read:course')
    expect(requireCapability).toHaveBeenCalledWith('assignment:write:course')
    expect(router.get).toHaveBeenNthCalledWith(
      1,
      '/api/assignments',
      'authenticate',
      'rbac:assignment:read:own',
      'getStudentAssignments',
    )
    expect(router.get).toHaveBeenNthCalledWith(
      2,
      '/api/instructor/:courseId/assignments',
      'authenticate',
      'rbac:assignment:read:course',
      'getInstructorAssignmentsForCourse',
    )
    expect(router.post).toHaveBeenCalledWith(
      '/api/instructor/:courseId/assignments',
      'authenticate',
      'rbac:assignment:write:course',
      'validator-1',
      'validator-2',
      'validateRequest',
      'createAssignmentForCourse',
    )
  })
})
