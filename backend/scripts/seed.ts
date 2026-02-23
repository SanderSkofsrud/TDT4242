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
  course2: '55555555-5555-5555-5555-555555555556',
  course3: '55555555-5555-5555-5555-555555555557',
  course4: '55555555-5555-5555-5555-555555555558',
  course5: '55555555-5555-5555-5555-555555555559',
  assignment: '66666666-6666-6666-6666-666666666666',
  assignment2: '66666666-6666-6666-6666-666666666667',
  assignment3: '66666666-6666-6666-6666-666666666668',
  assignment4: '66666666-6666-6666-6666-666666666669',
  assignment5: '66666666-6666-6666-6666-666666666670',
  assignment6: '66666666-6666-6666-6666-666666666671',
  assignment7: '66666666-6666-6666-6666-666666666672',
  assignment8: '66666666-6666-6666-6666-666666666673',
  assignment9: '66666666-6666-6666-6666-666666666674',
  assignment10: '66666666-6666-6666-6666-666666666675',
  assignment11: '66666666-6666-6666-6666-666666666676',
  assignment12: '66666666-6666-6666-6666-666666666677',
  guidance: '77777777-7777-7777-7777-777777777777',
  policy: '88888888-8888-8888-8888-888888888888',
  template: '99999999-9999-9999-9999-999999999999',
  template2: '99999999-9999-9999-9999-999999999998',
  template3: '99999999-9999-9999-9999-999999999997',
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

export async function runSeedData(): Promise<void> {
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

    const courses = [
      {
        id: IDS.course,
        code: 'TDT4242',
        name: 'Software Architecture & AI Compliance Demo Course',
      },
      {
        id: IDS.course2,
        code: 'TDT4201',
        name: 'AI Systems Engineering',
      },
      {
        id: IDS.course3,
        code: 'TDT4202',
        name: 'Responsible AI Studio',
      },
      {
        id: IDS.course4,
        code: 'TDT4203',
        name: 'Human-Centered ML',
      },
      {
        id: IDS.course5,
        code: 'TDT4204',
        name: 'AI Product Design',
      },
    ] as const

    for (const course of courses) {
      await client.query(
        `INSERT INTO courses (id, code, name, faculty_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [course.id, course.code, course.name, IDS.faculty],
      )
    }

    const enrolments: Array<[string, string, 'student' | 'instructor']> = []
    for (const course of courses) {
      enrolments.push([IDS.instructor, course.id, 'instructor'])
      enrolments.push([IDS.student1, course.id, 'student'])
      enrolments.push([IDS.student2, course.id, 'student'])
      enrolments.push([IDS.student3, course.id, 'student'])
      enrolments.push([IDS.student4, course.id, 'student'])
      enrolments.push([IDS.student5, course.id, 'student'])
    }

    for (const [userId, courseId, role] of enrolments) {
      await client.query(
        `INSERT INTO enrolments (user_id, course_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, course_id, role) DO NOTHING`,
        [userId, courseId, role],
      )
    }

    const assignments = [
      { id: IDS.assignment, courseId: IDS.course, title: 'Assignment 1: AI Usage Reflection', dueInDays: 14 },
      { id: IDS.assignment2, courseId: IDS.course, title: 'Assignment 2: Architecture Critique', dueInDays: 28 },
      { id: IDS.assignment3, courseId: IDS.course, title: 'Assignment 3: Design Tradeoffs', dueInDays: 42 },
      { id: IDS.assignment4, courseId: IDS.course2, title: 'Assignment 1: System Design Brief', dueInDays: 10 },
      { id: IDS.assignment5, courseId: IDS.course2, title: 'Assignment 2: Data Pipeline Review', dueInDays: 24 },
      { id: IDS.assignment6, courseId: IDS.course3, title: 'Assignment 1: Policy Summary', dueInDays: 12 },
      { id: IDS.assignment7, courseId: IDS.course3, title: 'Assignment 2: Risk Assessment', dueInDays: 26 },
      { id: IDS.assignment8, courseId: IDS.course4, title: 'Assignment 1: User Study Plan', dueInDays: 16 },
      { id: IDS.assignment9, courseId: IDS.course4, title: 'Assignment 2: UX Evaluation', dueInDays: 30 },
      { id: IDS.assignment10, courseId: IDS.course5, title: 'Assignment 1: Product Strategy Memo', dueInDays: 18 },
      { id: IDS.assignment11, courseId: IDS.course5, title: 'Assignment 2: Experiment Roadmap', dueInDays: 32 },
      { id: IDS.assignment12, courseId: IDS.course5, title: 'Assignment 3: Launch Review', dueInDays: 46 },
    ] as const

    for (const assignment of assignments) {
      await client.query(
        `INSERT INTO assignments (id, course_id, title, due_date)
         VALUES ($1, $2, $3, CURRENT_DATE + ($4 || ' days')::interval)
         ON CONFLICT (id) DO NOTHING`,
        [assignment.id, assignment.courseId, assignment.title, String(assignment.dueInDays)],
      )
    }

    const guidanceTemplates = [
      {
        permittedText: 'You may use AI to brainstorm and improve clarity.',
        prohibitedText: 'You may not submit AI-generated content without disclosure.',
        permittedCategories: ['explanation', 'structure'],
        prohibitedCategories: ['code_assistance'],
        examples: {
          permitted: ['Outline ideas and explain concepts in your own words'],
          prohibited: ['Copy AI answers directly into the final submission'],
        },
      },
      {
        permittedText: 'AI may be used to rephrase your own text.',
        prohibitedText: 'AI should not generate the core content for this assignment.',
        permittedCategories: ['rephrasing'],
        prohibitedCategories: ['explanation', 'structure', 'code_assistance'],
        examples: {
          permitted: ['Improve grammar in your draft after writing it yourself'],
          prohibited: ['Ask AI to draft the entire report'],
        },
      },
      {
        permittedText: 'AI can support code assistance within the stated boundaries.',
        prohibitedText: 'AI may not be used to design the full solution or produce final code.',
        permittedCategories: ['code_assistance'],
        prohibitedCategories: ['structure'],
        examples: {
          permitted: ['Use AI to debug a specific error'],
          prohibited: ['Generate the full assignment solution'],
        },
      },
    ] as const

    for (let i = 0; i < assignments.length; i += 1) {
      const template = guidanceTemplates[i % guidanceTemplates.length]
      await client.query(
        `INSERT INTO assignment_guidance (
           assignment_id,
           permitted_text,
           prohibited_text,
           permitted_categories,
           prohibited_categories,
           examples,
           created_by
         )
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
         ON CONFLICT (assignment_id) DO NOTHING`,
        [
          assignments[i].id,
          template.permittedText,
          template.prohibitedText,
          template.permittedCategories,
          template.prohibitedCategories,
          JSON.stringify(template.examples),
          IDS.instructor,
        ],
      )
    }

    const declarationStudents = [
      IDS.student1,
      IDS.student2,
      IDS.student3,
      IDS.student4,
      IDS.student5,
    ] as const

    const categorySets = [
      ['explanation'],
      ['structure'],
      ['rephrasing'],
      ['code_assistance'],
      ['explanation', 'structure'],
      ['rephrasing', 'code_assistance'],
    ] as const
    const frequencies = ['none', 'light', 'moderate', 'extensive'] as const
    const toolsUsed = [
      ['ChatGPT'],
      ['Claude'],
      ['GitHub Copilot'],
      ['ChatGPT', 'Copilot'],
    ] as const

    let declarationIndex = 0
    for (const assignment of assignments) {
      for (const studentId of declarationStudents) {
        const categories = categorySets[declarationIndex % categorySets.length]
        const frequency = frequencies[declarationIndex % frequencies.length]
        const tools = toolsUsed[declarationIndex % toolsUsed.length]
        const contextText = `Used AI for ${categories.join(', ')} with ${frequency} frequency.`

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
             $3,
             $4,
             $5,
             $6,
             1,
             NOW() + INTERVAL '180 days'
           )
           ON CONFLICT ON CONSTRAINT declarations_unique_student_assignment DO NOTHING`,
          [studentId, assignment.id, tools, categories, frequency, contextText],
        )

        declarationIndex += 1
      }
    }

    for (const studentId of declarationStudents) {
      for (const course of courses) {
        await client.query(
          `INSERT INTO sharing_preferences (student_id, course_id, is_shared)
           VALUES ($1, $2, FALSE)
           ON CONFLICT (student_id, course_id) DO NOTHING`,
          [studentId, course.id],
        )
      }
    }

    await client.query(
      `INSERT INTO policy_documents (id, version, file_path, uploaded_by, is_current)
       VALUES ($1, 1, $2, $3, TRUE)
       ON CONFLICT (id) DO NOTHING`,
      [IDS.policy, './uploads/policies/demo-policy-v1.pdf', IDS.headOfFaculty],
    )

    const feedbackTemplates = [
      {
        id: IDS.template,
        category: 'code_assistance',
        trigger: 'frequency = light',
        text: 'Good disclosure quality. Keep documenting tool usage and boundaries.',
      },
      {
        id: IDS.template2,
        category: 'explanation',
        trigger: 'frequency = moderate',
        text: 'Consider adding more detail on how AI supported your understanding.',
      },
      {
        id: IDS.template3,
        category: null,
        trigger: 'frequency = extensive',
        text: 'High AI usage noted. Re-check assignment guidance for boundaries.',
      },
    ] as const

    for (const template of feedbackTemplates) {
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
          template.id,
          template.category,
          template.trigger,
          template.text,
          IDS.instructor,
        ],
      )
    }

    await client.query('COMMIT')

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
