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
    } catch (err) {
      setError((err as Error).message || 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container">
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="register-role">Role</label>
          <select
            id="register-role"
            value={role}
            onChange={(e) => setRole(e.target.value as Exclude<User['role'], 'admin'>)}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          Register
        </button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}
