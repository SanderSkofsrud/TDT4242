import { pool } from '../config/database.js'
import { runMigrations } from './migrate.js'

const REQUIRED_TABLES = [
  'users',
  'courses',
  'enrolments',
  'assignments',
  'assignment_guidance',
  'declarations',
  'policy_documents',
  'feedback_templates',
  'sharing_preferences',
  'access_log',
]

const MAX_RETRIES = 10
const RETRY_DELAY_MS = 3000

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getMissingTables(): Promise<string[]> {
  const query = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ANY($1::text[])
  `

  const result = await pool.query<{ table_name: string }>(query, [REQUIRED_TABLES])
  const existing = new Set(result.rows.map((row) => row.table_name))

  return REQUIRED_TABLES.filter((tableName) => !existing.has(tableName))
}

async function checkWithRetry(): Promise<string[]> {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await getMissingTables()
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      // eslint-disable-next-line no-console
      console.warn(`[schema] DB check attempt ${attempt}/${MAX_RETRIES} failed: ${message}`)
      await wait(RETRY_DELAY_MS)
    }
  }

  throw lastError
}

async function main(): Promise<void> {
  let shouldClosePool = true

  try {
    const missingTables = await checkWithRetry()

    if (missingTables.length === 0) {
      // eslint-disable-next-line no-console
      console.log('[schema] Database schema is present, skipping migrations')
      return
    }

    // eslint-disable-next-line no-console
    console.log(`[schema] Missing tables detected: ${missingTables.join(', ')}`)
    // eslint-disable-next-line no-console
    console.log('[schema] Running migrations...')

    shouldClosePool = false
    await runMigrations()
  } finally {
    if (shouldClosePool) {
      await pool.end()
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  // eslint-disable-next-line no-console
  console.error(`[schema] Failed to ensure schema: ${message}`)
  process.exit(1)
})
