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
    <div className="card">
      <h2>Sharing by course</h2>
      {preferences.length === 0 ? (
        <p>You have no course enrolments with sharing preferences.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.25rem', borderBottom: '1px solid #ddd' }}>
                Course
              </th>
              <th style={{ textAlign: 'left', padding: '0.25rem', borderBottom: '1px solid #ddd' }}>
                Status
              </th>
              <th style={{ textAlign: 'left', padding: '0.25rem', borderBottom: '1px solid #ddd' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {preferences.map((pref) => (
              <tr key={pref.courseId}>
                <td style={{ padding: '0.25rem', borderBottom: '1px solid #eee' }}>
                  {pref.courseId}
                </td>
                <td style={{ padding: '0.25rem', borderBottom: '1px solid #eee' }}>
                  {pref.isShared ? 'Shared' : 'Private'}
                </td>
                <td style={{ padding: '0.25rem', borderBottom: '1px solid #eee' }}>
                  {pref.isShared ? (
                    <RevokeButton
                      courseId={pref.courseId}
                      onRevoke={() => onRevoke(pref.courseId)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onReinstate(pref.courseId)}
                    >
                      Reinstate Access
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
