import { ConfirmDialog } from '../common/ConfirmDialog'

interface ConfirmationModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Submit Declaration"
      message="Once submitted, your declaration cannot be changed. Please confirm your AI usage is accurately represented."
      confirmLabel="Submit Declaration"
      cancelLabel="Go Back and Review"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
