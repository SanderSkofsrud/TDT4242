import { afterEach, describe, expect, it, vi } from 'vitest'

type EnvKeys =
  | 'POSTGRES_HOST'
  | 'POSTGRES_PORT'
  | 'POSTGRES_DB'
  | 'POSTGRES_USER'
  | 'POSTGRES_PASSWORD'

const originalEnv = new Map<EnvKeys, string | undefined>()

for (const key of [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
] as const) {
  originalEnv.set(key, process.env[key])
}

async function loadDatabaseConfig() {
  vi.resetModules()

  const Pool = vi.fn((config: Record<string, unknown>) => ({ config }))

  vi.doMock('pg', () => ({
    Pool,
  }))

  const module = await import('../../config/database.ts')

  return { module, Pool }
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

describe('database config', () => {
  it('creates the pool with localhost and the default port when env vars are missing', async () => {
    delete process.env.POSTGRES_HOST
    delete process.env.POSTGRES_PORT
    delete process.env.POSTGRES_DB
    delete process.env.POSTGRES_USER
    delete process.env.POSTGRES_PASSWORD

    const { Pool, module } = await loadDatabaseConfig()

    expect(Pool).toHaveBeenCalledWith({
      host: 'localhost',
      port: 5432,
      database: undefined,
      user: undefined,
      password: undefined,
    })
    expect(module.pool).toEqual({
      config: {
        host: 'localhost',
        port: 5432,
        database: undefined,
        user: undefined,
        password: undefined,
      },
    })
  })

  it('creates the pool from explicit postgres environment settings', async () => {
    process.env.POSTGRES_HOST = 'db.internal'
    process.env.POSTGRES_PORT = '6543'
    process.env.POSTGRES_DB = 'privacy'
    process.env.POSTGRES_USER = 'service'
    process.env.POSTGRES_PASSWORD = 'secret'

    const { Pool, module } = await loadDatabaseConfig()

    expect(Pool).toHaveBeenCalledWith({
      host: 'db.internal',
      port: 6543,
      database: 'privacy',
      user: 'service',
      password: 'secret',
    })
    expect(module.pool).toEqual({
      config: {
        host: 'db.internal',
        port: 6543,
        database: 'privacy',
        user: 'service',
        password: 'secret',
      },
    })
  })
})
