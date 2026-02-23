import { Link, useParams } from 'react-router-dom'

import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { useInstructorAssignments } from '../hooks/useAssignments'

export default function InstructorAssignments() {
  const { courseId } = useParams<{ courseId: string }>()
  const { data, isLoading, error } = useInstructorAssignments(courseId ?? '')

  if (!courseId) {
    return (
      <div className="container-app py-12">
        <p className="error-message">No course specified</p>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading assignmentsâ€¦" />
  }

  if (error) {
    return (
      <div className="container-app py-12">
        <p className="error-message">{error.message}</p>
      </div>
    )
  }

  const assignments = data?.assignments ?? []

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Assignments
        </h1>
        <p className="text-slate-600 mt-1">
          Manage guidance for assignments in this course.
        </p>
      </div>

      <div className="mb-6">
        <Link
          to={`/dashboard/instructor/${courseId}`}
          className="text-primary-600 font-medium hover:underline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
        >
          Back to course dashboard
        </Link>
      </div>

      {assignments.length === 0 ? (
        <p className="text-slate-600">No assignments found for this course.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
                  Assignment
                </th>
                <th className="text-left py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
                  Due date
                </th>
                <th className="text-left py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
                  Guidance
                </th>
                <th className="text-left py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => {
                const guidanceStatus = assignment.guidance
                  ? assignment.guidance.lockedAt
                    ? 'Locked'
                    : 'Ready'
                  : 'Missing'
                return (
                  <tr key={assignment.id} className="border-b border-slate-100">
                    <td className="py-3 px-3 text-slate-700">{assignment.title}</td>
                    <td className="py-3 px-3 text-slate-700">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-slate-700">{guidanceStatus}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-3">
                        <Link
                          to={`/assignments/${assignment.id}/guidance`}
                          className="text-primary-600 font-medium hover:underline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
                        >
                          View guidance
                        </Link>
                        <Link
                          to={`/assignments/${assignment.id}/guidance/manage`}
                          className="btn-secondary"
                        >
                          Manage guidance
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
