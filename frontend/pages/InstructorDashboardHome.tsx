import { Link } from 'react-router-dom'

import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { useInstructorCourses } from '../hooks/useDashboard'
import { useAuth } from '../context/AuthContext'

export default function InstructorDashboardHome() {
  const { logout } = useAuth()
  const { data, isLoading, error } = useInstructorCourses()

  if (isLoading) {
    return <LoadingSpinner message="Loading your courses…" />
  }

  if (error) {
    return (
      <div className="container-app py-12">
        <p className="error-message">{error.message}</p>
      </div>
    )
  }

  const courses = data?.courses ?? []

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Dashboard
        </h1>
        <button
          type="button"
          onClick={logout}
          className="btn-secondary"
        >
          Log out
        </button>
      </div>
      <p className="text-slate-600 mb-8">
        Select a course to view aggregate AI usage data.
      </p>
      {courses.length === 0 ? (
        <p className="text-slate-600">You are not assigned as instructor to any courses yet.</p>
      ) : (
        <ul className="space-y-3">
          {courses.map((course) => (
            <li key={course.id}>
              <Link
                to={`/dashboard/instructor/${course.id}`}
                className="card-elevated block transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <span className="font-semibold text-slate-900">{course.name}</span>
                <span className="text-slate-500 ml-2">({course.code})</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
