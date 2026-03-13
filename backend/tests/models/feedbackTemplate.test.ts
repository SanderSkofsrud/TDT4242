import { describe, expect, it, vi } from 'vitest'

vi.mock('../../config/database.js', () => ({
  pool: {
    query: vi.fn(),
  },
}))

import {
  createTemplate,
  findTemplatesByCategory,
  findTemplatesByPolicyVersion,
} from '../../models/feedbackTemplate.ts'
import { pool } from '../../config/database.js'

describe('feedbackTemplate model', () => {
  it('finds templates by policy version', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ id: 'template-1' }],
    } as never)

    await expect(findTemplatesByPolicyVersion(2)).resolves.toEqual([
      { id: 'template-1' },
    ])
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM feedback_templates WHERE policy_version = $1',
      [2],
    )
  })

  it('finds templates by category and policy version', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ id: 'template-1' }],
    } as never)

    await expect(findTemplatesByCategory('structure', 2)).resolves.toEqual([
      { id: 'template-1' },
    ])
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE (category = $1 OR category IS NULL)'),
      ['structure', 2],
    )
  })

  it('creates a feedback template', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ id: 'template-1' }],
    } as never)

    await expect(
      createTemplate({
        category: 'structure',
        trigger_condition: 'uses structure',
        template_text: 'Template text',
        policy_version: 2,
        created_by: 'admin-1',
      }),
    ).resolves.toEqual({ id: 'template-1' })
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO feedback_templates'),
      ['structure', 'uses structure', 'Template text', 2, 'admin-1'],
    )
  })
})
