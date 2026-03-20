import { describe, expect, it, vi } from 'vitest'

async function loadAssignmentGuidanceRoute() {
  vi.resetModules()

  const router = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
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
      'guidance:read': 'guidance:read',
      'guidance:write': 'guidance:write',
    },
  }))

  vi.doMock('../../validators/guidanceValidator.js', () => ({
    guidanceValidator: ['validator-1', 'validator-2'],
  }))

  vi.doMock('../../controllers/assignmentGuidanceController.js', () => ({
    getGuidance: 'getGuidance',
    createGuidance: 'createGuidance',
    updateGuidance: 'updateGuidance',
  }))

  const module = await import('../../routes/assignmentGuidance.ts')
  const { requireCapability } = await import('../../middleware/rbac.js')

  return { router, module, requireCapability }
}

describe('assignmentGuidance routes', () => {
  it('registers the guidance routes with the expected middleware order', async () => {
    const { router, module, requireCapability } = await loadAssignmentGuidanceRoute()

    expect(module.default).toBe(router)
    expect(requireCapability).toHaveBeenCalledWith('guidance:read')
    expect(requireCapability).toHaveBeenCalledWith('guidance:write')
    expect(requireCapability).toHaveBeenCalledWith('guidance:write')
    expect(router.get).toHaveBeenCalledWith(
      '/api/assignments/:assignmentId/guidance',
      'authenticate',
      'rbac:guidance:read',
      'getGuidance',
    )
    expect(router.post).toHaveBeenCalledWith(
      '/api/assignments/:assignmentId/guidance',
      'authenticate',
      'rbac:guidance:write',
      'validator-1',
      'validator-2',
      'validateRequest',
      'createGuidance',
    )
    expect(router.put).toHaveBeenCalledWith(
      '/api/assignments/:assignmentId/guidance',
      'authenticate',
      'rbac:guidance:write',
      'validator-1',
      'validator-2',
      'validateRequest',
      'updateGuidance',
    )
  })
})
