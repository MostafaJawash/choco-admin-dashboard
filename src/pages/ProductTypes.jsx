import { Edit3, Plus, Tags, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import FormField from '../components/FormField'
import Modal from '../components/Modal'
import { useI18n } from '../i18n/useI18n'
import { supabase } from '../lib/supabaseClient'

const initialForm = { name: '' }

export default function ProductTypes() {
  const { t } = useI18n()
  const [productTypes, setProductTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [error, setError] = useState('')

  const loadProductTypes = async () => {
    setError('')
    const { data, error: loadError } = await supabase
      .from('product_types')
      .select('id, name')
      .order('name', { ascending: true })

    if (loadError) setError(loadError.message)
    setProductTypes(data || [])
    setLoading(false)
  }

  useEffect(() => {
    Promise.resolve().then(loadProductTypes)
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(initialForm)
    setModalOpen(true)
  }

  const openEdit = (productType) => {
    setEditing(productType)
    setForm({ name: productType.name || '' })
    setModalOpen(true)
  }

  const saveProductType = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = { name: form.name.trim() }
    const request = editing
      ? supabase.from('product_types').update(payload).eq('id', editing.id)
      : supabase.from('product_types').insert(payload)

    const { error: saveError } = await request
    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    setModalOpen(false)
    setLoading(true)
    loadProductTypes()
  }

  const deleteProductType = async () => {
    if (!deleteTarget) return
    setSaving(true)
    const { error: deleteError } = await supabase
      .from('product_types')
      .delete()
      .eq('id', deleteTarget.id)
    setSaving(false)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setDeleteTarget(null)
    setLoading(true)
    loadProductTypes()
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 flex flex-col gap-4 pt-12 md:flex-row md:items-end md:justify-between md:pt-0">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-800">{t('productTypes.eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-black text-stone-950">{t('productTypes.title')}</h1>
          <p className="mt-2 text-sm text-stone-500">{t('productTypes.subtitle')}</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus size={17} />
          {t('productTypes.add')}
        </button>
      </header>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="panel p-10 text-center text-stone-500">{t('productTypes.loading')}</div>
      ) : productTypes.length === 0 ? (
        <div className="panel p-10 text-center text-stone-500">{t('productTypes.empty')}</div>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {productTypes.map((productType) => (
            <article key={productType.id} className="panel flex items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-900">
                  <Tags size={18} />
                </div>
                <h2 className="truncate font-bold text-stone-950">{productType.name}</h2>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" className="btn-secondary px-3" onClick={() => openEdit(productType)}>
                  <Edit3 size={15} />
                </button>
                <button type="button" className="btn-secondary px-3 text-red-600" onClick={() => setDeleteTarget(productType)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <Modal open={modalOpen} title={editing ? t('productTypes.edit') : t('productTypes.add')} onClose={() => setModalOpen(false)}>
        <form className="space-y-5" onSubmit={saveProductType}>
          <FormField label={t('productTypes.name')}>
            <input
              className="field"
              value={form.name}
              onChange={(event) => setForm({ name: event.target.value })}
              required
              placeholder={t('productTypes.placeholder')}
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? t('common.saving') : t('productTypes.save')}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('productTypes.deleteTitle')}
        message={t('productTypes.deleteMessage', { name: deleteTarget?.name })}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteProductType}
        loading={saving}
      />
    </div>
  )
}
