import { afterEach, describe, expect, it, vi } from 'vitest'

type EnvKeys = 'NODE_ENV' | 'PORT'

const originalEnv = new Map<EnvKeys, string | undefined>()

for (const key of ['NODE_ENV', 'PORT'] as const) {
  originalEnv.set(key, process.env[key])
}

async function loadServer() {
  vi.resetModules()

  const app = {
    get: vi.fn(),
    listen: vi.fn(),
    use: vi.fn(),
  }

  const expressFactory = vi.fn(() => app)
  const express = Object.assign(expressFactory, {
    json: vi.fn(() => 'json-middleware'),
  })
  const cors = vi.fn((options: Record<string, unknown>) => ({
    kind: 'cors-middleware',
    options,
  }))
  const scheduleRetentionCleanup = vi.fn()

  vi.doMock('express', () => ({
    default: express,
  }))

  vi.doMock('cors', () => ({
    default: cors,
  }))

  vi.doMock('../middleware/noTelemetry.js', () => ({
    default: 'noTelemetry',
  }))

  vi.doMock('../routes/user.js', () => ({
    default: 'userRoutes',
  }))

  vi.doMock('../routes/assignmentGuidance.js', () => ({
    default: 'assignmentGuidanceRoutes',
  }))

  vi.doMock('../routes/assignments.js', () => ({
    default: 'assignmentRoutes',
  }))

  vi.doMock('../routes/declarations.js', () => ({
    default: 'declarationRoutes',
  }))

  vi.doMock('../routes/feedback.js', () => ({
    default: 'feedbackRoutes',
  }))

  vi.doMock('../routes/dashboard.js', () => ({
    default: 'dashboardRoutes',
  }))

  vi.doMock('../routes/sharing.js', () => ({
    default: 'sharingRoutes',
  }))

  vi.doMock('../routes/policy.js', () => ({
    default: 'policyRoutes',
  }))

  vi.doMock('../jobs/retentionCleanup.js', () => ({
    scheduleRetentionCleanup,
  }))

  const module = await import('../server.ts')

  return { app, cors, express, module, scheduleRetentionCleanup }
}

afterEach(() => {
  for (const [key, value] of originalEnv.entries()) {
    if (value === undefined) {
      delete process.env[key]
      continue
    }

    process.env[key] = value
  }

  vi.restoreAllMocks()
  vi.resetModules()
})

describe('server bootstrap', () => {
  it('registers middleware, health check, routes and skips listening in test mode', async () => {
    process.env.NODE_ENV = 'test'

    const { app, cors, express, module, scheduleRetentionCleanup } =
      await loadServer()

    expect(module.app).toBe(app)
    expect(cors).toHaveBeenCalledWith({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
    expect(express.json).toHaveBeenCalledTimes(1)
    expect(app.use).toHaveBeenNthCalledWith(1, {
      kind: 'cors-middleware',
      options: {
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
      },
    })
    expect(app.use).toHaveBeenNthCalledWith(2, 'json-middleware')
    expect(app.use).toHaveBeenNthCalledWith(3, 'noTelemetry')
    expect(app.use).toHaveBeenNthCalledWith(4, 'userRoutes')
    expect(app.use).toHaveBeenNthCalledWith(5, 'assignmentGuidanceRoutes')
    expect(app.use).toHaveBeenNthCalledWith(6, 'assignmentRoutes')
    expect(app.use).toHaveBeenNthCalledWith(7, 'declarationRoutes')
    expect(app.use).toHaveBeenNthCalledWith(8, 'feedbackRoutes')
    expect(app.use).toHaveBeenNthCalledWith(9, 'dashboardRoutes')
    expect(app.use).toHaveBeenNthCalledWith(10, 'sharingRoutes')
    expect(app.use).toHaveBeenNthCalledWith(11, 'policyRoutes')
    expect(app.get).toHaveBeenCalledWith('/health', expect.any(Function))
    expect(scheduleRetentionCleanup).toHaveBeenCalledTimes(1)
    expect(app.listen).not.toHaveBeenCalled()

    const healthHandler = app.get.mock.calls[0]?.[1] as (
      req: unknown,
      res: { json: (payload: unknown) => void },
    ) => void
    const response = { json: vi.fn() }
    healthHandler({}, response)
    expect(response.json).toHaveBeenCalledWith({ status: 'ok' })
  })

  it('listens on the configured port outside test mode and logs startup', async () => {
    process.env.NODE_ENV = 'development'
    process.env.PORT = '4567'
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

    const { app } = await loadServer()

    expect(app.listen).toHaveBeenCalledWith(4567, expect.any(Function))

    const listenCallback = app.listen.mock.calls[0]?.[1] as () => void
    listenCallback()

    expect(consoleLog).toHaveBeenCalledWith('Server listening on port 4567')
  })

  it('falls back to port 3000 when PORT is unset outside test mode', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.PORT

    const { app } = await loadServer()

    expect(app.listen).toHaveBeenCalledWith(3000, expect.any(Function))
  })
})
