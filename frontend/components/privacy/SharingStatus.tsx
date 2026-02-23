import type { SharingPreference } from '../../types/models'
import { RevokeButton } from './RevokeButton'

interface SharingStatusProps {
  preferences: SharingPreference[]
  onRevoke: (courseId: string) => void
  onReinstate: (courseId: string) => void
}

export function SharingStatus({
  preferences,
  onRevoke,
  onReinstate,
}: SharingStatusProps) {
  return (
    <div className="card-elevated">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Sharing by course</h2>
      {preferences.length === 0 ? (
        <p className="text-slate-600">You have no course enrolments with sharing preferences.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
                  Course
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
              {preferences.map((pref) => (
                <tr key={pref.courseId} className="border-b border-slate-100">
                  <td className="py-3 px-3 text-slate-700">
                    {pref.courseCode} — {pref.courseName}
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    {pref.isShared ? 'Shared' : 'Private'}
                  </td>
                  <td className="py-3 px-3">
                    {pref.isShared ? (
                      <RevokeButton
                        courseId={pref.courseId}
                        onRevoke={() => onRevoke(pref.courseId)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => onReinstate(pref.courseId)}
                        className="btn-secondary"
                      >
                        Share Access
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
