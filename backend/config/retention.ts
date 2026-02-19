export const RETENTION_DAYS = 183

export function calculateExpiresAt(dueDate: Date): Date {
  const expires = new Date(dueDate.getTime())
  expires.setDate(expires.getDate() + RETENTION_DAYS)
  return expires
}

