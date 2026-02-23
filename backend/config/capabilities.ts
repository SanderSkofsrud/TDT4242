export const CAPABILITIES = {
  'assignment:read:own': 'assignment:read:own',
  'assignment:read:course': 'assignment:read:course',
  'declaration:write': 'declaration:write',
  'declaration:read:own': 'declaration:read:own',
  'declaration:read:shared': 'declaration:read:shared',
  'dashboard:read:own': 'dashboard:read:own',
  'dashboard:read:course_aggregate': 'dashboard:read:course_aggregate',
  'dashboard:read:faculty_aggregate': 'dashboard:read:faculty_aggregate',
  'sharing:manage': 'sharing:manage',
  'data:export:own': 'data:export:own',
  'guidance:read': 'guidance:read',
  'guidance:write': 'guidance:write',
  'policy:write': 'policy:write',
  'tools:write': 'tools:write',
  'privacy_notice:write': 'privacy_notice:write',
} as const

export type Capability = keyof typeof CAPABILITIES

export type Role = 'student' | 'instructor' | 'head_of_faculty' | 'admin'

export const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  student: [
    'assignment:read:own',
    'declaration:write',
    'declaration:read:own',
    'dashboard:read:own',
    'sharing:manage',
    'data:export:own',
    'guidance:read',
  ],
  instructor: [
    'assignment:read:course',
    'guidance:write',
    'guidance:read',
    'dashboard:read:course_aggregate',
    'declaration:read:shared',
  ],
  head_of_faculty: ['dashboard:read:faculty_aggregate'],
  admin: [
    'policy:write',
    'tools:write',
    'privacy_notice:write',
  ],
}

