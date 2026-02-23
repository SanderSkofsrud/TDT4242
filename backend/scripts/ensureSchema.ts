import { pool } from '../config/database.js'
import { runMigrations } from './migrate.js'
import { runSeedData } from './seed.js'

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

const REQUIRED_COLUMNS: Array<{
  table: string
  column: string
}> = [
  { table: 'assignment_guidance', column: 'permitted_categories' },
  { table: 'assignment_guidance', column: 'prohibited_categories' },
]

const REQUIRED_VIEWS: Array<{
  viewName: string
  requiredSnippet: string
}> = [
  { viewName: 'v_instructor_aggregate', requiredSnippet: 'sharing_preferences' },
  { viewName: 'v_faculty_aggregate', requiredSnippet: 'course_code' },
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

async function getMissingColumns(): Promise<Array<{ table: string; column: string }>> {
  if (REQUIRED_COLUMNS.length === 0) return []

  const tables = Array.from(new Set(REQUIRED_COLUMNS.map((item) => item.table)))
  const result = await pool.query<{ table_name: string; column_name: string }>(
    `
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ANY($1::text[])
  `,
    [tables],
  )

  const existing = new Set(
    result.rows.map((row) => `${row.table_name}:${row.column_name}`),
  )

  return REQUIRED_COLUMNS.filter(
    (item) => !existing.has(`${item.table}:${item.column}`),
  )
}

async function getMissingViews(): Promise<Array<{ viewName: string; requiredSnippet: string }>> {
  if (REQUIRED_VIEWS.length === 0) return []

  const viewNames = REQUIRED_VIEWS.map((item) => item.viewName)
  const result = await pool.query<{ viewname: string; definition: string }>(
    `
    SELECT viewname, definition
    FROM pg_views
    WHERE schemaname = 'public' AND viewname = ANY($1::text[])
  `,
    [viewNames],
  )

  const definitionByView = new Map(
    result.rows.map((row) => [row.viewname, row.definition]),
  )

  return REQUIRED_VIEWS.filter((item) => {
    const definition = definitionByView.get(item.viewName)
    if (!definition) return true
    return !definition.includes(item.requiredSnippet)
  })
}

async function checkWithRetry(): Promise<string[]> {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const [missingTables, missingColumns, missingViews] = await Promise.all([
        getMissingTables(),
        getMissingColumns(),
        getMissingViews(),
      ])

      if (missingColumns.length > 0) {
        const details = missingColumns
          .map((item) => `${item.table}.${item.column}`)
          .join(', ')
        // eslint-disable-next-line no-console
        console.log(`[schema] Missing columns detected: ${details}`)
      }

      if (missingViews.length > 0) {
        const details = missingViews
          .map((item) => item.viewName)
          .join(', ')
        // eslint-disable-next-line no-console
        console.log(`[schema] Outdated views detected: ${details}`)
      }

      return missingTables.length > 0 || missingColumns.length > 0 || missingViews.length > 0
        ? ['schema_update_required']
        : []
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
  try {
    const missingTables = await checkWithRetry()

    if (missingTables.length > 0) {
      // eslint-disable-next-line no-console
      console.log('[schema] Running migrations...')
      await runMigrations()
    } else {
      // eslint-disable-next-line no-console
      console.log('[schema] Database schema is present, skipping migrations')
    }

    await runSeedData()
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  // eslint-disable-next-line no-console
  console.error(`[schema] Failed to ensure schema: ${message}`)
  process.exit(1)
})
