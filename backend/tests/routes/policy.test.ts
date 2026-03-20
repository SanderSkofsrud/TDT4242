import { afterEach, describe, expect, it, vi } from 'vitest'

type DiskStorageConfig = {
  destination: (
    req: unknown,
    file: unknown,
    cb: (error: Error | null, destination: string) => void,
  ) => void
  filename: (
    req: unknown,
    file: unknown,
    cb: (error: Error | null, filename: string) => void,
  ) => void
}

async function loadPolicyRoute() {
  vi.resetModules()

  const router = {
    post: vi.fn(),
  }

  let storageConfig: DiskStorageConfig | undefined
  let multerOptions: Record<string, unknown> | undefined

  const single = vi.fn((field: string) => `single:${field}`)
  const diskStorage = vi.fn((config: DiskStorageConfig) => {
    storageConfig = config
    return 'storage-engine'
  })
  const multerFactory = vi.fn((options: Record<string, unknown>) => {
    multerOptions = options
    return { single }
  })
  const multer = Object.assign(multerFactory, { diskStorage })

  vi.doMock('express', () => ({
    Router: vi.fn(() => router),
  }))

  vi.doMock('multer', () => ({
    default: multer,
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
      'policy:write': 'policy:write',
    },
  }))

  vi.doMock('../../validators/policyValidator.js', () => ({
    policyValidator: ['policy-validator:0', 'policy-validator:1'],
  }))

  vi.doMock('../../controllers/policyController.js', () => ({
    uploadPolicy: 'uploadPolicy',
  }))

  const module = await import('../../routes/policy.ts')
  const { requireCapability } = await import('../../middleware/rbac.js')

  return {
    module,
    multer,
    multerOptions,
    requireCapability,
    router,
    single,
    storageConfig,
  }
}

afterEach(() => {
  delete process.env.POLICY_PDF_STORAGE_PATH
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('policy routes', () => {
  it('registers the upload route with the expected middleware order', async () => {
    const { module, requireCapability, router, single } = await loadPolicyRoute()

    expect(module.default).toBe(router)
    expect(requireCapability).toHaveBeenCalledWith('policy:write')
    expect(single).toHaveBeenCalledWith('file')
    expect(router.post).toHaveBeenCalledWith(
      '/api/policy/upload',
      'authenticate',
      'rbac:policy:write',
      'single:file',
      'policy-validator:0',
      'policy-validator:1',
      'validateRequest',
      'uploadPolicy',
    )
  })

  it('configures multer storage, limits and PDF-only filtering', async () => {
    process.env.POLICY_PDF_STORAGE_PATH = 'C:/tmp/policies'
    vi.spyOn(Date, 'now').mockReturnValue(1_234)

    const { multer, multerOptions, storageConfig } = await loadPolicyRoute()

    expect(multer).toHaveBeenCalledWith({
      storage: 'storage-engine',
      fileFilter: expect.any(Function),
      limits: { fileSize: 20 * 1024 * 1024 },
    })
    expect(multerOptions).toBeDefined()
    expect(storageConfig).toBeDefined()

    const destinationCallback = vi.fn()
    storageConfig?.destination({}, {}, destinationCallback)
    expect(destinationCallback).toHaveBeenCalledWith(null, 'C:/tmp/policies')

    const filenameCallback = vi.fn()
    storageConfig?.filename({}, {}, filenameCallback)
    expect(filenameCallback).toHaveBeenCalledWith(null, 'policy-upload-1234.pdf')

    const rejectCallback = vi.fn()
    const fileFilter = multerOptions?.fileFilter as DiskStorageConfig['destination']
    fileFilter({}, { mimetype: 'image/png' }, rejectCallback)
    expect(rejectCallback).toHaveBeenCalledTimes(1)
    expect(rejectCallback.mock.calls[0]?.[0]).toBeInstanceOf(Error)
    expect(
      (rejectCallback.mock.calls[0]?.[0] as Error | undefined)?.message,
    ).toBe('Only PDF files are accepted')

    const acceptCallback = vi.fn()
    fileFilter({}, { mimetype: 'application/pdf' }, acceptCallback)
    expect(acceptCallback).toHaveBeenCalledWith(null, true)
  })

  it('falls back to the default policy upload directory when no env var is set', async () => {
    const { storageConfig } = await loadPolicyRoute()
    const destinationCallback = vi.fn()

    storageConfig?.destination({}, {}, destinationCallback)

    expect(destinationCallback).toHaveBeenCalledWith(
      null,
      './uploads/policies',
    )
  })
})
