import { useSearchParams } from 'react-router-dom'

import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { AggregateTable } from '../components/dashboard/AggregateTable'
import { SuppressedNotice } from '../components/dashboard/SuppressedNotice'
import { useFacultyDashboard } from '../hooks/useDashboard'

export default function FacultyDashboard() {
  const [searchParams] = useSearchParams()
  const facultyId = searchParams.get('facultyId') ?? ''
  const { data, isLoading, error } = useFacultyDashboard(facultyId)

  if (!facultyId) {
    return (
      <div className="container">
        <p className="error">No faculty specified</p>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard…" />
  }

  if (error) {
    return (
      <div className="container">
        <p className="error">{error.message}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container">
        <p>No data available.</p>
      </div>
    )
  }

  if (data.suppressed) {
    return (
      <div className="container">
        <h1>Faculty dashboard</h1>
        <SuppressedNotice />
      </div>
    )
  }

  if (!data.data || data.data.length === 0) {
    return (
      <div className="container">
        <h1>Faculty dashboard</h1>
        <p>No aggregate data for this faculty yet.</p>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Faculty dashboard</h1>
      <AggregateTable data={data.data} />
    </div>
  )
}
