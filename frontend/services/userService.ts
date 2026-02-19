import api from './api'
import type { User } from '../types/models'

export async function register(
  email: string,
  password: string,
  role: User['role'],
): Promise<{ id: string; email: string; role: User['role'] }> {
  const response = await api.post('/api/auth/register', {
    email,
    password,
    role,
  })
  return response.data
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string }> {
  const response = await api.post('/api/auth/login', {
    email,
    password,
  })
  return response.data
}

export async function acknowledgePrivacyNotice(
  version: number,
): Promise<{ success: true }> {
  const response = await api.post('/api/auth/privacy-ack', { version })
  return response.data
}

