import { readFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { pool } from '../config/database.js'

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirPath = dirname(currentFilePath)

async function runSqlFile(filePath: string, label: string): Promise<void> {
  const sql = await readFile(filePath, 'utf8')

  // eslint-disable-next-line no-console
  console.log(`[migrate] Running: ${label}`)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
    // eslint-disable-next-line no-console
    console.log(`[migrate] Done: ${label}`)
  } catch (error) {
    await client.query('ROLLBACK')
    const message = error instanceof Error ? error.message : String(error)
    // eslint-disable-next-line no-console
    console.error(`[migrate] Failed: ${label} — ${message}`)
    process.exitCode = 1
    throw error
  } finally {
    client.release()
  }
}

export async function runMigrations(): Promise<void> {
  const migrationsDir = join(currentDirPath, '..', 'sql', 'migrations')
  const viewsDir = join(currentDirPath, '..', 'sql', 'views')

  const migrationFiles = [
    '001_create_users.sql',
    '002_create_courses.sql',
    '003_create_enrolments.sql',
    '004_create_assignments.sql',
    '005_create_guidance.sql',
    '006_create_declarations.sql',
    '007_create_policy_documents.sql',
    '008_create_feedback_templates.sql',
    '009_create_sharing_preferences.sql',
    '010_create_access_log.sql',
    '011_add_guidance_categories.sql',
  ]

  for (const file of migrationFiles) {
    const fullPath = join(migrationsDir, file)
    await runSqlFile(fullPath, file)
  }

  const viewFiles = ['v_instructor_aggregate.sql', 'v_faculty_aggregate.sql']

  for (const file of viewFiles) {
    const fullPath = join(viewsDir, file)
    await runSqlFile(fullPath, file)
  }

  // eslint-disable-next-line no-console
  console.log('[migrate] All migrations complete')
}

const entryFilePath = process.argv[1]

if (entryFilePath && currentFilePath === entryFilePath) {
  runMigrations()
    .then(async () => {
      await pool.end()
    })
    .catch(async () => {
      await pool.end()
      if (process.exitCode === undefined) {
        process.exit(1)
      }
    })
}

