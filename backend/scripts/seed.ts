import bcrypt from 'bcrypt'
import { fileURLToPath } from 'url'

import { pool } from '../config/database.js'

const BCRYPT_COST = 12

const IDS = {
  faculty: '11111111-1111-1111-1111-111111111111',
  instructor: '22222222-2222-2222-2222-222222222222',
  headOfFaculty: '33333333-3333-3333-3333-333333333333',
  student1: '44444444-4444-4444-4444-444444444441',
  student2: '44444444-4444-4444-4444-444444444442',
  student3: '44444444-4444-4444-4444-444444444443',
  student4: '44444444-4444-4444-4444-444444444444',
  student5: '44444444-4444-4444-4444-444444444445',
  course: '55555555-5555-5555-5555-555555555555',
  assignment: '66666666-6666-6666-6666-666666666666',
  guidance: '77777777-7777-7777-7777-777777777777',
  policy: '88888888-8888-8888-8888-888888888888',
  template: '99999999-9999-9999-9999-999999999999',
} as const

const DEMO_PASSWORD = 'Password123!'

const DEMO_USERS = [
  { id: IDS.instructor, email: 'instructor.demo@ntnu.no', role: 'instructor' },
  { id: IDS.headOfFaculty, email: 'faculty.demo@ntnu.no', role: 'head_of_faculty' },
  { id: IDS.student1, email: 'student1.demo@ntnu.no', role: 'student' },
  { id: IDS.student2, email: 'student2.demo@ntnu.no', role: 'student' },
  { id: IDS.student3, email: 'student3.demo@ntnu.no', role: 'student' },
  { id: IDS.student4, email: 'student4.demo@ntnu.no', role: 'student' },
  { id: IDS.student5, email: 'student5.demo@ntnu.no', role: 'student' },
] as const

async function ensureUserCountAtLeast(minimum: number): Promise<boolean> {
  const result = await pool.query<{ total: string }>('SELECT COUNT(*)::text AS total FROM users')
  const total = Number.parseInt(result.rows[0]?.total ?? '0', 10)
  return total >= minimum
}

export async function runSeedData(): Promise<void> {
  const hasEnoughUsers = await ensureUserCountAtLeast(7)
  if (hasEnoughUsers) {
    // eslint-disable-next-line no-console
    console.log('[seed] Existing data detected, skipping demo seed')
    return
  }

  const client = await pool.connect()
  try {
    // eslint-disable-next-line no-console
    console.log('[seed] Seeding demo data...')

    await client.query('BEGIN')

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_COST)

    for (const user of DEMO_USERS) {
      await client.query(
        `INSERT INTO users (id, email, password_hash, role, privacy_ack_version)
         VALUES ($1, $2, $3, $4, 0)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.email, passwordHash, user.role],
      )
    }

    await client.query(
      `INSERT INTO courses (id, code, name, faculty_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [
        IDS.course,
        'TDT4242',
        'Software Architecture & AI Compliance Demo Course',
        IDS.faculty,
      ],
    )

    const enrolments = [
      [IDS.instructor, IDS.course, 'instructor'],
      [IDS.student1, IDS.course, 'student'],
      [IDS.student2, IDS.course, 'student'],
      [IDS.student3, IDS.course, 'student'],
      [IDS.student4, IDS.course, 'student'],
      [IDS.student5, IDS.course, 'student'],
    ] as const

    for (const [userId, courseId, role] of enrolments) {
      await client.query(
        `INSERT INTO enrolments (user_id, course_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, course_id, role) DO NOTHING`,
        [userId, courseId, role],
      )
    }

    await client.query(
      `INSERT INTO assignments (id, course_id, title, due_date)
       VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '30 days')
       ON CONFLICT (id) DO NOTHING`,
      [IDS.assignment, IDS.course, 'Assignment 1: AI Usage Reflection'],
    )

    await client.query(
      `INSERT INTO assignment_guidance (
         id,
         assignment_id,
         permitted_text,
         prohibited_text,
         examples,
         created_by
       )
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        IDS.guidance,
        IDS.assignment,
        'You may use AI to brainstorm and improve clarity.',
        'You may not submit AI-generated content without disclosure.',
        JSON.stringify({
          permitted: ['Outline ideas and explain concepts in your own words'],
          prohibited: ['Copy AI answers directly into the final submission'],
        }),
        IDS.instructor,
      ],
    )

    const declarationStudents = [
      IDS.student1,
      IDS.student2,
      IDS.student3,
      IDS.student4,
      IDS.student5,
    ] as const

    for (const studentId of declarationStudents) {
      await client.query(
        `INSERT INTO declarations (
           student_id,
           assignment_id,
           tools_used,
           categories,
           frequency,
           context_text,
           policy_version,
           expires_at
         )
         VALUES (
           $1,
           $2,
           ARRAY['ChatGPT'],
           ARRAY['code_assistance'],
           'light',
           'Used AI to clarify implementation details.',
           1,
           NOW() + INTERVAL '180 days'
         )
         ON CONFLICT ON CONSTRAINT declarations_unique_student_assignment DO NOTHING`,
        [studentId, IDS.assignment],
      )
    }

    for (const studentId of declarationStudents) {
      await client.query(
        `INSERT INTO sharing_preferences (student_id, course_id, is_shared)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (student_id, course_id) DO NOTHING`,
        [studentId, IDS.course],
      )
    }

    await client.query(
      `INSERT INTO policy_documents (id, version, file_path, uploaded_by, is_current)
       VALUES ($1, 1, $2, $3, TRUE)
       ON CONFLICT (id) DO NOTHING`,
      [IDS.policy, './uploads/policies/demo-policy-v1.pdf', IDS.headOfFaculty],
    )

    await client.query(
      `INSERT INTO feedback_templates (
         id,
         category,
         trigger_condition,
         template_text,
         policy_version,
         created_by
       )
       VALUES ($1, $2, $3, $4, 1, $5)
       ON CONFLICT (id) DO NOTHING`,
      [
        IDS.template,
        'code_assistance',
        'frequency = light',
        'Good disclosure quality. Keep documenting tool usage and boundaries.',
        IDS.instructor,
      ],
    )

    await client.query(
      `INSERT INTO access_log (actor_id, capability, resource_id, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '180 days')`,
      [IDS.instructor, 'dashboard:read:course_aggregate', IDS.course],
    )

    await client.query('COMMIT')

    // eslint-disable-next-line no-console
    console.log('[seed] Demo data inserted successfully')
    // eslint-disable-next-line no-console
    console.log('[seed] Demo login password for all seeded users: Password123!')
  } catch (error) {
    await client.query('ROLLBACK')
    const message = error instanceof Error ? error.message : String(error)
    // eslint-disable-next-line no-console
    console.error(`[seed] Failed: ${message}`)
    process.exitCode = 1
    throw error
  } finally {
    client.release()
  }
}

const entryFilePath = process.argv[1]
const currentFilePath = fileURLToPath(import.meta.url)

if (entryFilePath && currentFilePath === entryFilePath) {
  runSeedData()
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
