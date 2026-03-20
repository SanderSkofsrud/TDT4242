import { describe, expect, it, vi } from 'vitest'

async function loadDeclarationsRoute() {
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
      'declaration:write': 'declaration:write',
      'declaration:read:own': 'declaration:read:own',
    },
  }))

  vi.doMock('../../validators/declarationValidator.js', () => ({
    declarationValidator: ['validator-1', 'validator-2'],
  }))

  vi.doMock('../../controllers/declarationController.js', () => ({
    submitDeclaration: 'submitDeclaration',
    getMyDeclarations: 'getMyDeclarations',
    getDeclaration: 'getDeclaration',
  }))

  const module = await import('../../routes/declarations.ts')
  const { requireCapability } = await import('../../middleware/rbac.js')

  return { router, module, requireCapability }
}

describe('declarations routes', () => {
  it('registers the declarations routes with the expected middleware order', async () => {
    const { router, module, requireCapability } = await loadDeclarationsRoute()

    expect(module.default).toBe(router)
    expect(requireCapability).toHaveBeenCalledWith('declaration:write')
    expect(requireCapability).toHaveBeenCalledWith('declaration:read:own')
    expect(router.post).toHaveBeenCalledWith(
      '/api/declarations',
      'authenticate',
      'rbac:declaration:write',
      'validator-1',
      'validator-2',
      'validateRequest',
      'submitDeclaration',
    )
    expect(router.get).toHaveBeenNthCalledWith(
      1,
      '/api/declarations',
      'authenticate',
      'rbac:declaration:read:own',
      'getMyDeclarations',
    )
    expect(router.get).toHaveBeenNthCalledWith(
      2,
      '/api/declarations/:declarationId',
      'authenticate',
      'rbac:declaration:read:own',
      'getDeclaration',
    )
  })
})
