import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { register as registerService } from '../services/userService'
import type { User } from '../types/models'

const ROLE_OPTIONS: { value: Exclude<User['role'], 'admin'>; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'head_of_faculty', label: 'Head of Faculty' },
]

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Exclude<User['role'], 'admin'>>('student')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await registerService(email, password, role)
      await login(email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status
      if (status === 409) {
        setError('An account with this email already exists. Please log in instead.')
      } else {
        setError((err as Error).message || 'Registration failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-8">
          Register
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="register-email" className="label-field">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="register-password" className="label-field">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="register-role" className="label-field">
              Role
            </label>
            <select
              id="register-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Exclude<User['role'], 'admin'>)}
              className="input-field"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            Register
          </button>
        </form>
        <p className="mt-6 text-slate-600">
          <Link
            to="/login"
            className="text-primary-600 font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
