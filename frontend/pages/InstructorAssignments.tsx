import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { useInstructorAssignments } from '../hooks/useAssignments'
import { createInstructorAssignment } from '../services/assignmentService'

export default function InstructorAssignments() {
  const { courseId } = useParams<{ courseId: string }>()
  const [searchParams] = useSearchParams()
  const { data, isLoading, error, refetch } = useInstructorAssignments(courseId ?? '')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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
  const showSaved = searchParams.get('saved') === '1'

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

      {showSaved && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          Guidance saved successfully.
        </div>
      )}

      <section className="card-elevated mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Add new assignment</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setSubmitError(null)
            if (!courseId || !title.trim() || !dueDate) return
            setIsSubmitting(true)
            try {
              await createInstructorAssignment(courseId, { title: title.trim(), dueDate })
              setTitle('')
              setDueDate('')
              await refetch()
            } catch (err) {
              setSubmitError((err as Error).message ?? 'Failed to create assignment')
            } finally {
              setIsSubmitting(false)
            }
          }}
          className="flex flex-wrap items-end gap-4"
        >
          <div className="min-w-[200px]">
            <label htmlFor="new-assignment-title" className="label-field">
              Title
            </label>
            <input
              id="new-assignment-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={255}
              placeholder="e.g. Assignment 1: Essay"
              className="input-field mt-1"
            />
          </div>
          <div>
            <label htmlFor="new-assignment-due" className="label-field">
              Due date
            </label>
            <input
              id="new-assignment-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="input-field mt-1"
            />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Adding…' : 'Add assignment'}
          </button>
        </form>
        {submitError && <p className="error-message mt-2">{submitError}</p>}
      </section>

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
                          to={`/assignments/${assignment.id}/guidance/manage?courseId=${encodeURIComponent(courseId)}`}
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
