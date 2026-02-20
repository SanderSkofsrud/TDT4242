import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
    } catch {
      setError('Invalid credentials')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container">
      <h1>Log in</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          Log in
        </button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        <Link to="/register">Register</Link>
      </p>
    </div>
  )
}
