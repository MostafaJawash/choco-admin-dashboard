import { Edit3, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import Table from '../components/Table'
import { useI18n } from '../i18n/useI18n'
import { supabase } from '../lib/supabaseClient'

const initialForm = { name: '' }

export default function Categories() {
  const { t } = useI18n()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [error, setError] = useState('')

  const loadCategories = async () => {
    const { data, error: loadError } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (loadError) setError(loadError.message)
    setCategories(data || [])
    setLoading(false)
  }

  useEffect(() => {
    Promise.resolve().then(loadCategories)
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(initialForm)
    setModalOpen(true)
  }

  const openEdit = (category) => {
    setEditing(category)
    setForm({ name: category.name || '' })
    setModalOpen(true)
  }

  const saveCategory = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = { name: form.name.trim() }
    const request = editing
      ? supabase.from('categories').update(payload).eq('id', editing.id)
      : supabase.from('categories').insert(payload)

    const { error: saveError } = await request
    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    setModalOpen(false)
    setLoading(true)
    loadCategories()
  }

  const deleteCategory = async () => {
    if (!deleteTarget) return
    setSaving(true)
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', deleteTarget.id)
    setSaving(false)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setDeleteTarget(null)
    setLoading(true)
    loadCategories()
  }

  const columns = [
    {
      key: 'name',
      header: t('categories.occasion'),
      render: (row) => <span className="font-semibold text-stone-950">{row.name}</span>,
    },
    {
      key: 'id',
      header: t('common.id'),
      render: (row) => <span className="font-mono text-xs text-stone-500">{row.id}</span>,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary px-3" onClick={() => openEdit(row)}>
            <Edit3 size={15} />
          </button>
          <button type="button" className="btn-secondary px-3 text-red-600" onClick={() => setDeleteTarget(row)}>
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 flex flex-col gap-4 pt-12 md:flex-row md:items-end md:justify-between md:pt-0">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-800">{t('categories.eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-black text-stone-950">{t('categories.title')}</h1>
          <p className="mt-2 text-sm text-stone-500">{t('categories.subtitle')}</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus size={17} />
          {t('categories.add')}
        </button>
      </header>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="panel p-10 text-center text-stone-500">{t('categories.loading')}</div>
      ) : (
        <Table columns={columns} data={categories} emptyText={t('categories.empty')} />
      )}

      <Modal open={modalOpen} title={editing ? t('categories.edit') : t('categories.add')} onClose={() => setModalOpen(false)}>
        <form className="space-y-5" onSubmit={saveCategory}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700">{t('categories.name')}</span>
            <input
              className="field"
              value={form.name}
              onChange={(event) => setForm({ name: event.target.value })}
              required
              placeholder={t('categories.placeholder')}
            />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? t('common.saving') : t('categories.save')}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('categories.deleteTitle')}
        message={t('categories.deleteMessage', { name: deleteTarget?.name })}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteCategory}
        loading={saving}
      />
    </div>
  )
}
