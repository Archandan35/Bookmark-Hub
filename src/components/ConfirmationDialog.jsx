import { AlertTriangle } from 'lucide-react'
import { Dialog } from './Dialog'
import { Button } from './Button'

export function ConfirmationDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger' }) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={variant} onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="confirm-dialog">
        <div className={`confirm-dialog-icon confirm-dialog-icon-${variant}`}>
          <AlertTriangle size={24} />
        </div>
        <p className="confirm-dialog-message">{message}</p>
      </div>
    </Dialog>
  )
}
