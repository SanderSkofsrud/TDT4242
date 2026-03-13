import { describe, expect, it } from 'vitest'

import {
  RETENTION_DAYS,
  calculateExpiresAt,
} from '../../config/retention.ts'

describe('retention', () => {
  it('uses the expected retention period', () => {
    expect(RETENTION_DAYS).toBe(183)
  })

  it('calculates the expiry date without mutating the input date', () => {
    const dueDate = new Date(2026, 0, 1, 12, 0, 0)
    const expiresAt = calculateExpiresAt(dueDate)

    expect(expiresAt).not.toBe(dueDate)
    expect(expiresAt.getFullYear()).toBe(2026)
    expect(expiresAt.getMonth()).toBe(6)
    expect(expiresAt.getDate()).toBe(3)
    expect(expiresAt.getHours()).toBe(12)
    expect(dueDate.getFullYear()).toBe(2026)
    expect(dueDate.getMonth()).toBe(0)
    expect(dueDate.getDate()).toBe(1)
    expect(dueDate.getHours()).toBe(12)
  })
})
