import { describe, expect, it } from 'vitest'

import { CAPABILITIES, ROLE_CAPABILITIES } from '../../types/capabilities.ts'

describe('capabilities', () => {
  it('exposes all expected capability identifiers', () => {
    expect(CAPABILITIES['dashboard:read:own']).toBe('dashboard:read:own')
    expect(CAPABILITIES['guidance:write']).toBe('guidance:write')
    expect(CAPABILITIES['privacy_notice:write']).toBe('privacy_notice:write')
  })

  it('maps roles to the correct capability sets', () => {
    expect(ROLE_CAPABILITIES.student).toContain('sharing:manage')
    expect(ROLE_CAPABILITIES.instructor).toContain('assignment:write:course')
    expect(ROLE_CAPABILITIES.head_of_faculty).toEqual([
      'dashboard:read:faculty_aggregate',
    ])
    expect(ROLE_CAPABILITIES.admin).toContain('policy:write')
  })
})
