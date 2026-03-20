import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

import api from '../../services/api'
import { exportMyData } from '../../services/exportService'

const mockedGet = vi.mocked(api.get)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('exportService', () => {
  it('downloads the exported data and cleans up DOM and object URLs', async () => {
    mockedGet.mockResolvedValueOnce({ data: '{"ok":true}' } as never)

    const anchor = document.createElement('a')
    const click = vi.fn()
    anchor.click = click

    const createElement = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(anchor)
    const appendChild = vi.spyOn(document.body, 'appendChild')
    const removeChild = vi.spyOn(document.body, 'removeChild')
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    const createObjectURL = vi.fn(() => 'blob:export-url')
    const revokeObjectURL = vi.fn()

    Object.assign(URL, {
      createObjectURL,
      revokeObjectURL,
    })

    await exportMyData()

    expect(mockedGet).toHaveBeenCalledWith('/api/user/export', {
      responseType: 'blob',
    })
    expect(createElement).toHaveBeenCalledWith('a')
    expect(anchor.href).toBe('blob:export-url')
    expect(anchor.download).toBe('ai-usage-export.json')
    expect(appendChild).toHaveBeenCalledWith(anchor)
    expect(click).toHaveBeenCalledTimes(1)
    expect(removeChild).toHaveBeenCalledWith(anchor)
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export-url')

    Object.assign(URL, {
      createObjectURL: originalCreateObjectURL,
      revokeObjectURL: originalRevokeObjectURL,
    })
  })
})
