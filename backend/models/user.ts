import { pool } from '../config/database.js'
import type { User } from '../types/models.js'

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query<User>('SELECT * FROM users WHERE email = $1', [email])
  return result.rows[0] ?? null
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await pool.query<User>('SELECT * FROM users WHERE id = $1', [id])
  return result.rows[0] ?? null
}

export async function createUser(
  email: string,
  passwordHash: string,
  role: User['role'],
): Promise<User> {
  const result = await pool.query<User>(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, passwordHash, role],
  )
  return result.rows[0]
}

export async function updatePrivacyAckVersion(
  userId: string,
  version: number,
): Promise<void> {
  await pool.query('UPDATE users SET privacy_ack_version = $1 WHERE id = $2', [
    version,
    userId,
  ])
}

