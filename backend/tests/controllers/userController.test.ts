import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
  },
}))

vi.mock('../../models/user.js', () => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  updatePrivacyAckVersion: vi.fn(),
}))

vi.mock('../../models/accessLog.js', () => ({
  logAccess: vi.fn(),
}))

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import {
  acknowledgePrivacyNotice,
  login,
  register,
} from '../../controllers/userController.ts'
import { createNext, createResponse } from '../helpers/http.ts'
import {
  createUser,
  findUserByEmail,
  updatePrivacyAckVersion,
} from '../../models/user.js'
import { logAccess } from '../../models/accessLog.js'

describe('userController', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalJwtSecret = process.env.JWT_SECRET
  const originalPrivacyVersion = process.env.PRIVACY_NOTICE_VERSION

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'jwt-secret'
    process.env.PRIVACY_NOTICE_VERSION = '2'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    process.env.JWT_SECRET = originalJwtSecret
    process.env.PRIVACY_NOTICE_VERSION = originalPrivacyVersion
  })

  describe('register', () => {
    it('returns 400 for an invalid role', async () => {
      const res = createResponse()

      await register(
        {
          body: {
            email: 'student@example.com',
            password: 'secret',
            role: 'admin',
          },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid role' })
    })

    it('returns 400 when email or password is missing', async () => {
      const res = createResponse()

      await register(
        {
          body: { email: '', password: '', role: 'student' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' })
    })

    it('returns 409 when the email is already registered', async () => {
      vi.mocked(findUserByEmail).mockResolvedValueOnce({ id: 'user-1' } as never)
      const res = createResponse()

      await register(
        {
          body: {
            email: 'student@example.com',
            password: 'secret',
            role: 'student',
          },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already registered' })
    })

    it('hashes the password and creates the user on success', async () => {
      vi.mocked(findUserByEmail).mockResolvedValueOnce(null)
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed-password' as never)
      vi.mocked(createUser).mockResolvedValueOnce({
        id: 'user-1',
        email: 'student@example.com',
        role: 'student',
      } as never)
      const res = createResponse()

      await register(
        {
          body: {
            email: 'student@example.com',
            password: 'secret',
            role: 'student',
          },
        } as never,
        res as never,
        createNext(),
      )

      expect(bcrypt.hash).toHaveBeenCalledWith('secret', 12)
      expect(createUser).toHaveBeenCalledWith(
        'student@example.com',
        'hashed-password',
        'student',
      )
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        id: 'user-1',
        email: 'student@example.com',
        role: 'student',
      })
    })

    it('returns 500 when registration fails unexpectedly', async () => {
      vi.mocked(findUserByEmail).mockRejectedValueOnce(new Error('db failed'))
      const res = createResponse()

      await register(
        {
          body: {
            email: 'student@example.com',
            password: 'secret',
            role: 'student',
          },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('logs registration failures in development', async () => {
      process.env.NODE_ENV = 'development'
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      vi.mocked(findUserByEmail).mockRejectedValueOnce(new Error('db failed'))
      const res = createResponse()

      await register(
        {
          body: {
            email: 'student@example.com',
            password: 'secret',
            role: 'student',
          },
        } as never,
        res as never,
        createNext(),
      )

      expect(consoleError).toHaveBeenCalledWith(
        'register error:',
        expect.any(Error),
      )
      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  describe('login', () => {
    it('returns 401 when credentials are missing', async () => {
      const res = createResponse()

      await login({ body: {} } as never, res as never, createNext())

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' })
    })

    it('returns 401 when the user does not exist', async () => {
      vi.mocked(findUserByEmail).mockResolvedValueOnce(null)
      const res = createResponse()

      await login(
        { body: { email: 'student@example.com', password: 'secret' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('returns 401 when the password does not match', async () => {
      vi.mocked(findUserByEmail).mockResolvedValueOnce({
        password_hash: 'hash',
      } as never)
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never)
      const res = createResponse()

      await login(
        { body: { email: 'student@example.com', password: 'secret' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('returns 500 when the JWT secret is missing', async () => {
      delete process.env.JWT_SECRET
      vi.mocked(findUserByEmail).mockResolvedValueOnce({
        id: 'user-1',
        role: 'student',
        password_hash: 'hash',
        privacy_ack_version: 2,
      } as never)
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never)
      const res = createResponse()

      await login(
        { body: { email: 'student@example.com', password: 'secret' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
      expect(jwt.sign).not.toHaveBeenCalled()
    })

    it('signs the token, sets the cookie, and returns the token on success', async () => {
      vi.mocked(findUserByEmail).mockResolvedValueOnce({
        id: 'user-1',
        role: 'student',
        password_hash: 'hash',
        privacy_ack_version: 2,
      } as never)
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never)
      vi.mocked(jwt.sign).mockReturnValueOnce('jwt-token' as never)
      const res = createResponse()

      await login(
        { body: { email: 'student@example.com', password: 'secret' } } as never,
        res as never,
        createNext(),
      )

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          sub: 'user-1',
          role: 'student',
          privacyAckVersion: 2,
        },
        'jwt-secret',
        { expiresIn: '1h' },
      )
      expect(res.cookie).toHaveBeenCalledWith(
        'authToken',
        'jwt-token',
        expect.objectContaining({
          httpOnly: false,
          secure: false,
          sameSite: 'lax',
          maxAge: 60 * 60 * 1000,
          path: '/',
        }),
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ token: 'jwt-token' })
    })

    it('sets a secure cookie in production', async () => {
      process.env.NODE_ENV = 'production'
      vi.mocked(findUserByEmail).mockResolvedValueOnce({
        id: 'user-1',
        role: 'student',
        password_hash: 'hash',
        privacy_ack_version: 2,
      } as never)
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never)
      vi.mocked(jwt.sign).mockReturnValueOnce('jwt-token' as never)
      const res = createResponse()

      await login(
        { body: { email: 'student@example.com', password: 'secret' } } as never,
        res as never,
        createNext(),
      )

      expect(res.cookie).toHaveBeenCalledWith(
        'authToken',
        'jwt-token',
        expect.objectContaining({
          secure: true,
        }),
      )
    })

    it('logs login failures in development', async () => {
      process.env.NODE_ENV = 'development'
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      vi.mocked(findUserByEmail).mockRejectedValueOnce(new Error('db failed'))
      const res = createResponse()

      await login(
        { body: { email: 'student@example.com', password: 'secret' } } as never,
        res as never,
        createNext(),
      )

      expect(consoleError).toHaveBeenCalledWith(
        'login error:',
        expect.any(Error),
      )
      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  describe('acknowledgePrivacyNotice', () => {
    it('returns 500 when there is no authenticated user id', async () => {
      const res = createResponse()

      await acknowledgePrivacyNotice(
        { body: { version: 2 } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('returns 400 when the version is invalid', async () => {
      const res = createResponse()

      await acknowledgePrivacyNotice(
        {
          body: { version: 1 },
          user: { id: 'user-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid privacy notice version',
      })
    })

    it('updates the privacy acknowledgement and logs access on success', async () => {
      vi.mocked(logAccess).mockResolvedValue({} as never)
      const res = createResponse()

      await acknowledgePrivacyNotice(
        {
          body: { version: 2 },
          user: { id: 'user-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(updatePrivacyAckVersion).toHaveBeenCalledWith('user-1', 2)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ success: true })
      expect(logAccess).toHaveBeenCalledWith('user-1', 'privacy_notice:ack', null)
    })

    it('returns 500 when acknowledgement fails', async () => {
      vi.mocked(updatePrivacyAckVersion).mockRejectedValueOnce(new Error('db failed'))
      const res = createResponse()

      await acknowledgePrivacyNotice(
        {
          body: { version: 2 },
          user: { id: 'user-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('logs acknowledgement failures in development', async () => {
      process.env.NODE_ENV = 'development'
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      vi.mocked(updatePrivacyAckVersion).mockRejectedValueOnce(
        new Error('db failed'),
      )
      const res = createResponse()

      await acknowledgePrivacyNotice(
        {
          body: { version: 2 },
          user: { id: 'user-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(consoleError).toHaveBeenCalledWith(
        'acknowledgePrivacyNotice error:',
        expect.any(Error),
      )
      expect(res.status).toHaveBeenCalledWith(500)
    })
  })
})
