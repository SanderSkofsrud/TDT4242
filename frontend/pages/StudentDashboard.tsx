import { Link } from 'react-router-dom'

import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { PrivacyBadge } from '../components/common/PrivacyBadge'
import { UsageChart } from '../components/dashboard/UsageChart'
import { CategoryBreakdown } from '../components/dashboard/CategoryBreakdown'
import { useStudentDashboard } from '../hooks/useDashboard'

export default function StudentDashboard() {
  const { data, isLoading, error } = useStudentDashboard()

  if (isLoading) {
    return (
      <>
        <LoadingSpinner message="Loading dashboard…" />
        <PrivacyBadge />
      </>
    )
  }

  if (error) {
    return (
      <div className="container">
        <p className="error">{error.message}</p>
        <PrivacyBadge />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container">
        <p>No data available.</p>
        <PrivacyBadge />
      </div>
    )
  }

  const { declarations, summary } = data

  return (
    <div className="container">
      <h1>My dashboard</h1>

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2>Usage overview</h2>
        <UsageChart byCategory={summary.byCategory} />
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <CategoryBreakdown
          byCategory={summary.byCategory}
          byFrequency={summary.byFrequency}
        />
      </section>

      <section className="card">
        <h2>My declarations</h2>
        {declarations.length === 0 ? (
          <p>You have not submitted any declarations yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {declarations.map((d) => (
              <li
                key={d.id}
                style={{
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <Link to={`/declarations/${d.id}/feedback`}>
                  Assignment {d.assignmentId} — {d.categories.join(', ')} — {d.frequency} —{' '}
                  {new Date(d.submittedAt).toLocaleDateString()}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PrivacyBadge />
    </div>
  )
}
