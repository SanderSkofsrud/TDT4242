import { describe, expect, it, vi } from 'vitest'

async function loadFeedbackRoute() {
  vi.resetModules()

  const router = {
    get: vi.fn(),
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
      'declaration:read:own': 'declaration:read:own',
    },
  }))

  vi.doMock('../../controllers/feedbackController.js', () => ({
    getFeedback: 'getFeedback',
    getCurrentPolicyDocument: 'getCurrentPolicyDocument',
  }))

  const module = await import('../../routes/feedback.ts')
  const { requireCapability } = await import('../../middleware/rbac.js')

  return { router, module, requireCapability }
}

describe('feedback routes', () => {
  it('registers the feedback routes with the expected middleware order', async () => {
    const { router, module, requireCapability } = await loadFeedbackRoute()

    expect(module.default).toBe(router)
    expect(requireCapability).toHaveBeenCalledWith('declaration:read:own')
    expect(router.get).toHaveBeenNthCalledWith(
      1,
      '/api/declarations/:declarationId/feedback',
      'authenticate',
      'rbac:declaration:read:own',
      'getFeedback',
    )
    expect(router.get).toHaveBeenNthCalledWith(
      2,
      '/api/policy/current',
      'authenticate',
      'getCurrentPolicyDocument',
    )
  })
})
