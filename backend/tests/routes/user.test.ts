import { describe, expect, it, vi } from 'vitest'

async function loadUserRoute() {
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
      'data:export:own': 'data:export:own',
    },
  }))

  vi.doMock('../../controllers/userController.js', () => ({
    register: 'register',
    login: 'login',
    acknowledgePrivacyNotice: 'acknowledgePrivacyNotice',
  }))

  vi.doMock('../../controllers/exportController.js', () => ({
    exportMyData: 'exportMyData',
  }))

  const module = await import('../../routes/user.ts')
  const { requireCapability } = await import('../../middleware/rbac.js')

  return { module, requireCapability, router }
}

describe('user routes', () => {
  it('registers auth and export routes with the expected middleware order', async () => {
    const { module, requireCapability, router } = await loadUserRoute()

    expect(module.default).toBe(router)
    expect(router.post).toHaveBeenNthCalledWith(1, '/api/auth/register', 'register')
    expect(router.post).toHaveBeenNthCalledWith(2, '/api/auth/login', 'login')
    expect(router.post).toHaveBeenNthCalledWith(
      3,
      '/api/auth/privacy-ack',
      'authenticate',
      'acknowledgePrivacyNotice',
    )
    expect(requireCapability).toHaveBeenCalledWith('data:export:own')
    expect(router.get).toHaveBeenCalledWith(
      '/api/user/export',
      'authenticate',
      'rbac:data:export:own',
      'exportMyData',
    )
  })
})
