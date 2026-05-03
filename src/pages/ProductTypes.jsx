import { Edit3, ImagePlus, Plus, Tags, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import FormField from '../components/FormField'
import Modal from '../components/Modal'
import { useI18n } from '../i18n/useI18n'
import { resolveImageUrl, uploadImageFile } from '../lib/imageUpload'
import { supabase } from '../lib/supabaseClient'

const initialForm = { name: '' }

export default function ProductTypes() {
  const { t } = useI18n()
  const [productTypes, setProductTypes] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [imageFile, setImageFile] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [error, setError] = useState('')

  const loadProductTypes = async () => {
    setError('')
    const [productTypeResult, categoryResult] = await Promise.all([
      supabase
        .from('product_types')
        .select('id, name, image_url, category_id, categories(name)')
        .order('name', { ascending: true }),
      supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true }),
    ])

    if (productTypeResult.error) setError(productTypeResult.error.message)
    if (categoryResult.error) setError(categoryResult.error.message)
    setProductTypes(productTypeResult.data || [])
    setCategories(categoryResult.data || [])
    setLoading(false)
  }

  useEffect(() => {
    Promise.resolve().then(loadProductTypes)
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', category_id: categories[0]?.id || '' })
    setImageFile(null)
    setModalOpen(true)
  }

  const openEdit = (productType) => {
    setEditing(productType)
    setForm({ name: productType.name || '', category_id: productType.category_id || '' })
    setImageFile(null)
    setModalOpen(true)
  }

  const saveProductType = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!form.category_id) {
        throw new Error(t('productTypes.categoryRequired'))
      }

      let imageUrl = editing?.image_url || null
      if (imageFile) imageUrl = await uploadImageFile(imageFile, 'product-types')
      const payload = { name: form.name.trim(), category_id: form.category_id, image_url: imageUrl || null }
      const request = editing
        ? supabase.from('product_types').update(payload).eq('id', editing.id)
        : supabase.from('product_types').insert(payload)

      const { error: saveError } = await request
      if (saveError) throw saveError

      setModalOpen(false)
      setLoading(true)
      loadProductTypes()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
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
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {productTypes.map((productType) => (
            <article key={productType.id} className="panel overflow-hidden">
              <div className="h-44 bg-stone-100">
                {productType.image_url ? (
                  <img src={resolveImageUrl(productType.image_url)} alt={productType.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-amber-800">
                    <Tags size={34} />
                  </div>
                )}
              </div>
              <div className="space-y-4 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-900">
                    <ImagePlus size={18} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="break-words text-base font-bold text-stone-950">{productType.name}</h2>
                    <p className="mt-1 text-sm text-stone-500">{productType.categories?.name || t('common.unassigned')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="btn-secondary min-h-11 px-3" onClick={() => openEdit(productType)}>
                    <Edit3 size={15} />
                  </button>
                  <button type="button" className="btn-secondary min-h-11 px-3 text-red-600" onClick={() => setDeleteTarget(productType)}>
                    <Trash2 size={15} />
                  </button>
                </div>
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
          <FormField label={t('productTypes.category')}>
            <select
              className="field min-h-11"
              value={form.category_id || ''}
              onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
              required
            >
              <option value="">{t('productTypes.chooseCategory')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('common.imageUpload')}>
            <input className="field" type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
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
