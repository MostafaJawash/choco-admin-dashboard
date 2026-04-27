import Modal from './Modal'
import { useI18n } from '../i18n/useI18n'

export default function ConfirmDialog({ open, title, message, onCancel, onConfirm, loading }) {
  const { t } = useI18n()

  return (
    <Modal open={open} title={title} onClose={onCancel} size="max-w-md">
      <p className="text-sm leading-6 text-stone-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? t('common.deleting') : t('common.delete')}
        </button>
      </div>
    </Modal>
  )
}
