import { describe, expect, it, vi } from 'vitest'

async function loadSharingRoute() {
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
      'sharing:manage': 'sharing:manage',
    },
  }))

  vi.doMock('../../controllers/sharingController.js', () => ({
    getSharingStatus: 'getSharingStatus',
    revokeSharing: 'revokeSharing',
    reinstateSharing: 'reinstateSharing',
  }))

  const module = await import('../../routes/sharing.ts')
  const { requireCapability } = await import('../../middleware/rbac.js')

  return { router, module, requireCapability }
}

describe('sharing routes', () => {
  it('registers the sharing routes with the expected middleware order', async () => {
    const { router, module, requireCapability } = await loadSharingRoute()

    expect(module.default).toBe(router)
    expect(requireCapability).toHaveBeenCalledTimes(3)
    expect(requireCapability).toHaveBeenCalledWith('sharing:manage')
    expect(router.get).toHaveBeenCalledWith(
      '/api/sharing/status',
      'authenticate',
      'rbac:sharing:manage',
      'getSharingStatus',
    )
    expect(router.post).toHaveBeenNthCalledWith(
      1,
      '/api/sharing/revoke/:courseId',
      'authenticate',
      'rbac:sharing:manage',
      'revokeSharing',
    )
    expect(router.post).toHaveBeenNthCalledWith(
      2,
      '/api/sharing/reinstate/:courseId',
      'authenticate',
      'rbac:sharing:manage',
      'reinstateSharing',
    )
  })
})
