import { describe, expect, it, vi } from 'vitest'

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

import api from '../../services/api'
import {
  acknowledgePrivacyNotice,
  login,
  register,
} from '../../services/userService'

const mockedPost = vi.mocked(api.post)

describe('userService', () => {
  it('registers a user and returns the API payload', async () => {
    const response = {
      id: 'user-1',
      email: 'student@example.com',
      role: 'student',
    } as const

    mockedPost.mockResolvedValueOnce({ data: response } as never)

    await expect(
      register('student@example.com', 'secret', 'student'),
    ).resolves.toEqual(response)

    expect(mockedPost).toHaveBeenCalledWith('/api/auth/register', {
      email: 'student@example.com',
      password: 'secret',
      role: 'student',
    })
  })

  it('logs in a user and returns the token', async () => {
    mockedPost.mockResolvedValueOnce({ data: { token: 'jwt-token' } } as never)

    await expect(login('student@example.com', 'secret')).resolves.toEqual({
      token: 'jwt-token',
    })

    expect(mockedPost).toHaveBeenCalledWith('/api/auth/login', {
      email: 'student@example.com',
      password: 'secret',
    })
  })

  it('acknowledges the privacy notice version', async () => {
    mockedPost.mockResolvedValueOnce({ data: { success: true } } as never)

    await expect(acknowledgePrivacyNotice(3)).resolves.toEqual({
      success: true,
    })

    expect(mockedPost).toHaveBeenCalledWith('/api/auth/privacy-ack', {
      version: 3,
    })
  })
})
