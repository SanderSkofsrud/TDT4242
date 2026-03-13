import { vi } from 'vitest'

export function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  }

  response.status.mockReturnValue(response)
  response.json.mockReturnValue(response)

  return response
}

export function createNext() {
  return vi.fn()
}
