import { useState } from 'react'

import { ConfirmDialog } from '../common/ConfirmDialog'

interface RevokeButtonProps {
  courseId: string
  onRevoke: () => void
}

export function RevokeButton({ onRevoke }: RevokeButtonProps) {
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    onRevoke()
    setOpen(false)
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Revoke Access
      </button>
      <ConfirmDialog
        isOpen={open}
        title="Revoke access"
        message="Revoking access means your instructor will no longer be able to see your declarations for this course. You can reinstate access at any time."
        confirmLabel="Revoke Access"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
