import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('express-validator', () => ({
  validationResult: vi.fn(),
}))

import { validationResult } from 'express-validator'

import { validateRequest } from '../../middleware/validateRequest.ts'

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  }

  response.status.mockReturnValue(response)
  response.json.mockReturnValue(response)

  return response
}

describe('validateRequest', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  it('calls next when validation passes', () => {
    vi.mocked(validationResult).mockReturnValueOnce({
      isEmpty: () => true,
      array: vi.fn(),
    } as never)

    const res = createResponse()
    const next = vi.fn()

    validateRequest({} as never, res as never, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 422 with validation details when validation fails', () => {
    const array = vi.fn().mockReturnValue([
      { msg: 'title is required' },
      { msg: 'dueDate is required' },
    ])

    vi.mocked(validationResult).mockReturnValueOnce({
      isEmpty: () => false,
      array,
    } as never)

    const res = createResponse()
    const next = vi.fn()

    validateRequest({} as never, res as never, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(422)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      details: ['title is required', 'dueDate is required'],
    })
    expect(array).toHaveBeenCalledTimes(1)
  })

  it('logs validation failures in development mode', () => {
    process.env.NODE_ENV = 'development'
    const array = vi.fn().mockReturnValue([{ msg: 'title is required' }])
    vi.mocked(validationResult).mockReturnValueOnce({
      isEmpty: () => false,
      array,
    } as never)

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = createResponse()

    validateRequest({} as never, res as never, vi.fn())

    expect(consoleError).toHaveBeenCalledWith('Validation failed:', [
      { msg: 'title is required' },
    ])
    expect(array).toHaveBeenCalledTimes(2)
    consoleError.mockRestore()
  })
})
