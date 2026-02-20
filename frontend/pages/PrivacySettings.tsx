import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { PrivacyBadge } from '../components/common/PrivacyBadge'
import { SharingStatus } from '../components/privacy/SharingStatus'
import { useSharingStatus, useRevokeSharing, useReinstateSharing } from '../hooks/useSharing'

export default function PrivacySettings() {
  const { preferences, isLoading, error, refetch } = useSharingStatus()
  const { revoke, isRevoking } = useRevokeSharing()
  const { reinstate, isReinstating } = useReinstateSharing()

  const busy = isRevoking || isReinstating

  const handleRevoke = async (courseId: string) => {
    await revoke(courseId)
    refetch()
  }
  const handleReinstate = async (courseId: string) => {
    await reinstate(courseId)
    refetch()
  }

  if (isLoading) {
    return (
      <>
        <LoadingSpinner message="Loading sharing settings…" />
        <PrivacyBadge />
      </>
    )
  }

  return (
    <div className="container">
      <h1>Privacy and sharing</h1>
      {error && <p className="error">{error.message}</p>}
      <SharingStatus
        preferences={preferences}
        onRevoke={handleRevoke}
        onReinstate={handleReinstate}
      />
      {busy && <p>Saving…</p>}
      <PrivacyBadge />
    </div>
  )
}
