import { X } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'

export default function Modal({ open, title, children, onClose, size = 'max-w-2xl' }) {
  const { t } = useI18n()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-sm">
      <div className={`max-h-[92vh] w-full ${size} overflow-hidden rounded-xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-lg font-bold text-stone-950">{title}</h2>
          <button
            type="button"
            aria-label={t('common.closeModal')}
            className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-64px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
