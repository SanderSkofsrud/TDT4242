import { pool } from '../config/database.js'
import type { FeedbackTemplate } from '../types/models.js'

export interface FeedbackTemplateInsert {
  category: string | null
  trigger_condition: string
  template_text: string
  policy_version: number
  created_by: string
}

export async function findTemplatesByPolicyVersion(
  policyVersion: number,
): Promise<FeedbackTemplate[]> {
  const result = await pool.query<FeedbackTemplate>(
    'SELECT * FROM feedback_templates WHERE policy_version = $1',
    [policyVersion],
  )
  return result.rows
}

export async function findTemplatesByCategory(
  category: string,
  policyVersion: number,
): Promise<FeedbackTemplate[]> {
  const result = await pool.query<FeedbackTemplate>(
    `SELECT * FROM feedback_templates
     WHERE (category = $1 OR category IS NULL)
       AND policy_version = $2`,
    [category, policyVersion],
  )
  return result.rows
}

export async function createTemplate(
  data: FeedbackTemplateInsert,
): Promise<FeedbackTemplate> {
  const result = await pool.query<FeedbackTemplate>(
    `INSERT INTO feedback_templates (
       category,
       trigger_condition,
       template_text,
       policy_version,
       created_by
     )
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.category,
      data.trigger_condition,
      data.template_text,
      data.policy_version,
      data.created_by,
    ],
  )

  return result.rows[0]
}

