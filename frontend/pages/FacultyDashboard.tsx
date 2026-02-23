import { useSearchParams } from 'react-router-dom'

import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { SuppressedNotice } from '../components/dashboard/SuppressedNotice'
import { useFacultyDashboard } from '../hooks/useDashboard'
import type { FacultyAggregateRow } from '../types/models'

function groupByCourse(
  data: FacultyAggregateRow[],
): Map<string, { rows: FacultyAggregateRow[]; courseCode: string; courseName: string }> {
  const map = new Map<
    string,
    { rows: FacultyAggregateRow[]; courseCode: string; courseName: string }
  >()
  for (const row of data) {
    const existing = map.get(row.courseId)
    if (existing) {
      existing.rows.push(row)
    } else {
      map.set(row.courseId, {
        rows: [row],
        courseCode: row.courseCode,
        courseName: row.courseName,
      })
    }
  }
  return map
}

function CourseSection({
  courseId,
  courseCode,
  courseName,
  rows,
}: {
  courseId: string
  courseCode: string
  courseName: string
  rows: FacultyAggregateRow[]
}) {
  const byCategory: Record<string, number> = {}
  const byFrequency: Record<string, number> = {}
  for (const row of rows) {
    byCategory[row.category] = (byCategory[row.category] ?? 0) + row.declarationCount
    byFrequency[row.frequency] = (byFrequency[row.frequency] ?? 0) + row.declarationCount
  }
  const categoryEntries = Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b))
  const frequencyEntries = Object.entries(byFrequency).sort(([a], [b]) => a.localeCompare(b))

  return (
    <section className="card-elevated mb-8" key={courseId}>
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        {courseCode} - {courseName}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Category counts</h3>
          <ul className="space-y-1 text-slate-700">
            {categoryEntries.map(([cat, count]) => (
              <li key={cat} className="flex justify-between gap-4">
                <span className="capitalize">{cat.replace('_', ' ')}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Frequency distribution</h3>
          <ul className="space-y-1 text-slate-700">
            {frequencyEntries.map(([freq, count]) => (
              <li key={freq} className="flex justify-between gap-4">
                <span className="capitalize">{freq}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default function FacultyDashboard() {
  const [searchParams] = useSearchParams()
  const facultyId = searchParams.get('facultyId') ?? ''
  const { data, isLoading, error } = useFacultyDashboard(facultyId)

  if (!facultyId) {
    return (
      <div className="container-app py-12">
        <p className="error-message">No faculty specified. Use the link from your dashboard.</p>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading faculty dashboard..." />
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
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
          Faculty dashboard
        </h1>
        <p className="text-slate-600">No aggregate data for this faculty yet.</p>
      </div>
    )
  }

  const byCourse = groupByCourse(data.data)

  return (
    <div className="container-app py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        Faculty dashboard
      </h1>
      <p className="text-slate-600 mb-8">
        Aggregate AI usage patterns across all courses in your faculty. No individual student
        declarations or identifiers are shown - only counts with privacy suppression (k at least 5).
      </p>
      <div className="space-y-2 mb-8">
        {byCourse.size === 0 ? (
          <div className="card-elevated">
            <p className="text-slate-600">
              No course-level rows can be shown at the current privacy threshold. Only suppressed
              aggregate counts are available.
            </p>
          </div>
        ) : (
          Array.from(byCourse.entries()).map(([courseId, { rows, courseCode, courseName }]) => (
            <CourseSection
              key={courseId}
              courseId={courseId}
              courseCode={courseCode}
              courseName={courseName}
              rows={rows}
            />
          ))
        )}
      </div>
    </div>
  )
}
