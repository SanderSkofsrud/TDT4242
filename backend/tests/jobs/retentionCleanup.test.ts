import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function loadRetentionCleanup() {
  vi.resetModules()

  const hardDeleteExpiredDeclarations = vi.fn()
  const hardDeleteExpiredLogs = vi.fn()

  vi.doMock('../../models/declaration.js', () => ({
    hardDeleteExpiredDeclarations,
  }))

  vi.doMock('../../models/accessLog.js', () => ({
    hardDeleteExpiredLogs,
  }))

  const module = await import('../../jobs/retentionCleanup.ts')

  return {
    ...module,
    hardDeleteExpiredDeclarations,
    hardDeleteExpiredLogs,
  }
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-13T10:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('retention cleanup job', () => {
  it('logs deleted declaration and access-log counts on success', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
    const {
      hardDeleteExpiredDeclarations,
      hardDeleteExpiredLogs,
      runRetentionCleanup,
    } = await loadRetentionCleanup()

    hardDeleteExpiredDeclarations.mockResolvedValue(4)
    hardDeleteExpiredLogs.mockResolvedValue(7)

    await runRetentionCleanup()

    expect(hardDeleteExpiredDeclarations).toHaveBeenCalledTimes(1)
    expect(hardDeleteExpiredLogs).toHaveBeenCalledTimes(1)
    expect(consoleLog).toHaveBeenCalledWith(
      '[retention] Deleted 4 expired declarations and 7 expired access log entries at 2026-03-13T10:00:00.000Z',
    )
  })

  it('logs the error message when cleanup fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const {
      hardDeleteExpiredDeclarations,
      hardDeleteExpiredLogs,
      runRetentionCleanup,
    } = await loadRetentionCleanup()

    hardDeleteExpiredDeclarations.mockRejectedValue(new Error('db unavailable'))

    await runRetentionCleanup()

    expect(hardDeleteExpiredDeclarations).toHaveBeenCalledTimes(1)
    expect(hardDeleteExpiredLogs).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledWith(
      '[retention] Cleanup failed at 2026-03-13T10:00:00.000Z: db unavailable',
    )
  })

  it('falls back to an unknown-error message for non-Error failures', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { hardDeleteExpiredDeclarations, runRetentionCleanup } =
      await loadRetentionCleanup()

    hardDeleteExpiredDeclarations.mockRejectedValue('boom')

    await runRetentionCleanup()

    expect(consoleError).toHaveBeenCalledWith(
      '[retention] Cleanup failed at 2026-03-13T10:00:00.000Z: Unknown error',
    )
  })

  it('runs once immediately and schedules a new run every 24 hours', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const setIntervalSpy = vi
      .spyOn(globalThis, 'setInterval')
      .mockImplementation((handler: TimerHandler) => {
        return { handler } as never
      })
    const {
      hardDeleteExpiredDeclarations,
      hardDeleteExpiredLogs,
      scheduleRetentionCleanup,
    } = await loadRetentionCleanup()

    hardDeleteExpiredDeclarations.mockResolvedValue(1)
    hardDeleteExpiredLogs.mockResolvedValue(2)

    scheduleRetentionCleanup()
    await flushPromises()

    expect(hardDeleteExpiredDeclarations).toHaveBeenCalledTimes(1)
    expect(hardDeleteExpiredLogs).toHaveBeenCalledTimes(1)
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 86_400_000)

    const scheduledHandler = setIntervalSpy.mock.calls[0]?.[0] as () => void
    scheduledHandler()
    await flushPromises()

    expect(hardDeleteExpiredDeclarations).toHaveBeenCalledTimes(2)
    expect(hardDeleteExpiredLogs).toHaveBeenCalledTimes(2)
  })
})
