import { Link } from 'react-router-dom'

import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { PrivacyBadge } from '../components/common/PrivacyBadge'
import { UsageChart } from '../components/dashboard/UsageChart'
import { CategoryBreakdown } from '../components/dashboard/CategoryBreakdown'
import { useStudentDashboard } from '../hooks/useDashboard'
import { useStudentAssignments } from '../hooks/useAssignments'
import { useAuth } from '../context/AuthContext'

export default function StudentDashboard() {
  const { logout } = useAuth()
  const { data, isLoading, error } = useStudentDashboard()
  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useStudentAssignments()

  if (isLoading || assignmentsLoading) {
    return (
      <>
        <LoadingSpinner message="Loading dashboard…" />
        <PrivacyBadge />
      </>
    )
  }

  if (error) {
    return (
      <div className="container-app py-12">
        <p className="error-message">{error.message}</p>
        <PrivacyBadge />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container-app py-12">
        <p className="text-slate-600">No data available.</p>
        <PrivacyBadge />
      </div>
    )
  }

  const { declarations, summary } = data
  const assignments = assignmentsData?.assignments ?? []
  const pendingAssignments = assignments.filter((assignment) => !assignment.declaration)

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          My dashboard
        </h1>
        <button
          type="button"
          onClick={logout}
          className="btn-secondary"
        >
          Log out
        </button>
      </div>

      <section className="card-elevated mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Assignments</h2>
        {assignmentsError && (
          <p className="error-message mb-4">{assignmentsError.message}</p>
        )}
        {assignments.length === 0 ? (
          <p className="text-slate-600">No assignments available.</p>
        ) : (
          <>
            {pendingAssignments.length > 0 && (
              <p className="text-slate-600 mb-4">
                You have {pendingAssignments.length} assignment
                {pendingAssignments.length === 1 ? '' : 's'} without an AI usage declaration.
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
                      Assignment
                    </th>
                    <th className="text-left py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
                      Course
                    </th>
                    <th className="text-left py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
                      Due date
                    </th>
                    <th className="text-left py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="text-left py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b border-slate-100">
                      <td className="py-3 px-3 text-slate-700">{assignment.title}</td>
                      <td className="py-3 px-3 text-slate-700">
                        {assignment.course.code} â€” {assignment.course.name}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {assignment.declaration ? 'Declared' : 'Pending'}
                      </td>
                      <td className="py-3 px-3">
                        {assignment.declaration ? (
                          <Link
                            to={`/declarations/${assignment.declaration.id}/feedback`}
                            className="text-primary-600 font-medium hover:underline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
                          >
                            View feedback
                          </Link>
                        ) : (
                          <Link
                            to={`/declarations/submit?assignmentId=${encodeURIComponent(assignment.id)}`}
                            className="btn-primary"
                          >
                            Declare usage
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="card-elevated mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Usage overview</h2>
        <UsageChart byCategory={summary.byCategory} />
      </section>

      <section className="mb-8">
        <CategoryBreakdown
          byCategory={summary.byCategory}
          byFrequency={summary.byFrequency}
        />
      </section>

      <section className="card-elevated">
        <h2 className="text-xl font-bold text-slate-900 mb-4">My declarations</h2>
        {declarations.length === 0 ? (
          <p className="text-slate-600">You have not submitted any declarations yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {declarations.map((d) => (
              <li key={d.id} className="py-3 first:pt-0">
                <Link
                  to={`/declarations/${d.id}/feedback`}
                  className="text-primary-600 font-medium hover:underline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
                >
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
