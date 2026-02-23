import { useSearchParams } from 'react-router-dom'

import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { AggregateTable } from '../components/dashboard/AggregateTable'
import { SuppressedNotice } from '../components/dashboard/SuppressedNotice'
import { useFacultyDashboard } from '../hooks/useDashboard'
import { useAuth } from '../context/AuthContext'

export default function FacultyDashboard() {
  const { logout } = useAuth()
  const [searchParams] = useSearchParams()
  const facultyId = searchParams.get('facultyId') ?? ''
  const { data, isLoading, error } = useFacultyDashboard(facultyId)

  if (!facultyId) {
    return (
      <div className="container-app py-12">
        <p className="error-message">No faculty specified</p>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard…" />
  }

  if (error) {
    return (
      <div className="container-app py-12">
        <p className="error-message">{error.message}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container-app py-12">
        <p className="text-slate-600">No data available.</p>
      </div>
    )
  }

  if (data.suppressed) {
    return (
      <div className="container-app py-12 sm:py-16">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
          Faculty dashboard
        </h1>
        <SuppressedNotice />
      </div>
    )
  }

  if (!data.data || data.data.length === 0) {
    return (
      <div className="container-app py-12 sm:py-16">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Faculty dashboard
          </h1>
          <button
            type="button"
            onClick={logout}
            className="btn-secondary"
          >
            Log out
          </button>
        </div>
        <p className="text-slate-600">No aggregate data for this faculty yet.</p>
      </div>
    )
  }

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Faculty dashboard
        </h1>
        <button
          type="button"
          onClick={logout}
          className="btn-secondary"
        >
          Log out
        </button>
      </div>
      <AggregateTable data={data.data} />
    </div>
  )
}
