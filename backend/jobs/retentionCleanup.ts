// Hard boundary: deletion is unconditional. Do not add any condition, flag, or override that prevents deletion of expired records.

import { hardDeleteExpiredDeclarations } from '../models/declaration.js'
import { hardDeleteExpiredLogs } from '../models/accessLog.js'

const DAY_IN_MS = 24 * 60 * 60 * 1000

export async function runRetentionCleanup(): Promise<void> {
  const nowIso = new Date().toISOString()

  try {
    const deletedDeclarations = await hardDeleteExpiredDeclarations()
    const deletedLogs = await hardDeleteExpiredLogs()

    // eslint-disable-next-line no-console
    console.log(
      `[retention] Deleted ${deletedDeclarations} expired declarations and ${deletedLogs} expired access log entries at ${nowIso}`,
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'

    // eslint-disable-next-line no-console
    console.error(
      `[retention] Cleanup failed at ${nowIso}: ${message}`,
    )
  }
}

export function scheduleRetentionCleanup(): void {
  // Run once immediately on startup.
  void runRetentionCleanup()

  // Then schedule once every 24 hours.
  setInterval(() => {
    void runRetentionCleanup()
  }, DAY_IN_MS)
}

