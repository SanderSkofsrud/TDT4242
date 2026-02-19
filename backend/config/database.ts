import { Pool } from 'pg'

const {
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_DB,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
} = process.env

export const pool = new Pool({
  host: POSTGRES_HOST || 'localhost',
  port: POSTGRES_PORT ? Number(POSTGRES_PORT) : 5432,
  database: POSTGRES_DB,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
})

