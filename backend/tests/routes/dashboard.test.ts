import { describe, expect, it, vi } from 'vitest'

async function loadDashboardRoute() {
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

  vi.doMock('../../config/capabilities.js', () => ({
    CAPABILITIES: {
      'dashboard:read:own': 'dashboard:read:own',
      'dashboard:read:course_aggregate': 'dashboard:read:course_aggregate',
      'dashboard:read:faculty_aggregate': 'dashboard:read:faculty_aggregate',
    },
  }))

  vi.doMock('../../controllers/dashboardController.js', () => ({
    getStudentDashboard: 'getStudentDashboard',
    getInstructorCourses: 'getInstructorCourses',
    getInstructorDashboard: 'getInstructorDashboard',
    getFacultyDashboard: 'getFacultyDashboard',
  }))

  const module = await import('../../routes/dashboard.ts')
  const { requireCapability } = await import('../../middleware/rbac.js')

  return { router, module, requireCapability }
}

describe('dashboard routes', () => {
  it('registers the dashboard routes with the expected middleware order', async () => {
    const { router, module, requireCapability } = await loadDashboardRoute()

    expect(module.default).toBe(router)
    expect(requireCapability).toHaveBeenCalledWith('dashboard:read:own')
    expect(requireCapability).toHaveBeenCalledWith(
      'dashboard:read:course_aggregate',
    )
    expect(requireCapability).toHaveBeenCalledWith(
      'dashboard:read:course_aggregate',
    )
    expect(requireCapability).toHaveBeenCalledWith(
      'dashboard:read:faculty_aggregate',
    )
    expect(router.get).toHaveBeenNthCalledWith(
      1,
      '/api/dashboard/student',
      'authenticate',
      'rbac:dashboard:read:own',
      'getStudentDashboard',
    )
    expect(router.get).toHaveBeenNthCalledWith(
      2,
      '/api/dashboard/instructor-courses',
      'authenticate',
      'rbac:dashboard:read:course_aggregate',
      'getInstructorCourses',
    )
    expect(router.get).toHaveBeenNthCalledWith(
      3,
      '/api/dashboard/instructor/:courseId',
      'authenticate',
      'rbac:dashboard:read:course_aggregate',
      'getInstructorDashboard',
    )
    expect(router.get).toHaveBeenNthCalledWith(
      4,
      '/api/dashboard/faculty',
      'authenticate',
      'rbac:dashboard:read:faculty_aggregate',
      'getFacultyDashboard',
    )
  })
})
