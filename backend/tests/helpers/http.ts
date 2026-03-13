import { vi } from 'vitest'

export function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
    send: vi.fn(),
    setHeader: vi.fn(),
    cookie: vi.fn(),
  }

  response.status.mockReturnValue(response)
  response.json.mockReturnValue(response)
  response.send.mockReturnValue(response)
  response.setHeader.mockReturnValue(response)
  response.cookie.mockReturnValue(response)

  return response
}

export function createNext() {
  return vi.fn()
}
