import { Edit3, ImagePlus, Layers3, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import FormField from '../components/FormField'
import Modal from '../components/Modal'
import { useI18n } from '../i18n/useI18n'
import { resolveImageUrl, uploadImageFile } from '../lib/imageUpload'
import { supabase } from '../lib/supabaseClient'

const initialForm = { name: '', category_id: '', type_id: '', image_url: '' }

export default function Sections() {
  const { t } = useI18n()
  const [sections, setSections] = useState([])
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

  const loadSections = useCallback(async () => {
    setError('')
    const [sectionResult, productTypeResult, categoryResult] = await Promise.all([
      supabase
        .from('sections')
        .select('id, name, type_id, image_url, product_types(name)')
        .order('name', { ascending: true }),
      supabase
        .from('product_types')
        .select('id, name, category_id')
        .order('name', { ascending: true }),
      supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true }),
    ])
    if (sectionResult.error) setError(sectionResult.error.message)
    if (productTypeResult.error) setError(productTypeResult.error.message || t('sections.typeLoadError'))
    if (categoryResult.error) setError(categoryResult.error.message)

    setSections(sectionResult.data || [])
    setProductTypes(productTypeResult.data || [])
    setCategories(categoryResult.data || [])
    setLoading(false)
  }, [t])

  useEffect(() => {
    Promise.resolve().then(loadSections)
  }, [loadSections])

  const openCreate = () => {
    setEditing(null)
    const firstCategory = categories[0]?.id || ''
    const firstTypeForCat = productTypes.find((pt) => String(pt.category_id) === String(firstCategory))?.id || ''
    setForm({ ...initialForm, category_id: firstCategory, type_id: firstTypeForCat })
    setImageFile(null)
    setModalOpen(true)
  }

  const openEdit = (section) => {
    setEditing(section)
    const typeObj = productTypes.find((pt) => pt.id === section.type_id)
    const categoryId = typeObj?.category_id || ''
    setForm({ name: section.name || '', category_id: categoryId, type_id: section.type_id || '' })
    setImageFile(null)
    setModalOpen(true)
  }

  const saveSection = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    if (!form.type_id) {
      setSaving(false)
      setError(t('sections.typeRequired'))
      return
    }

    try {
      let imageUrl = editing?.image_url || null
      if (imageFile) imageUrl = await uploadImageFile(imageFile, 'sections')
      const payload = { name: form.name.trim(), type_id: form.type_id, image_url: imageUrl || null, category_id: form.category_id }
      const request = editing
        ? supabase.from('sections').update(payload).eq('id', editing.id)
        : supabase.from('sections').insert(payload)

      const { error: saveError } = await request
      if (saveError) throw saveError

      setModalOpen(false)
      setLoading(true)
      loadSections()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteSection = async () => {
    if (!deleteTarget) return
    setSaving(true)
    const { error: deleteError } = await supabase
      .from('sections')
      .delete()
      .eq('id', deleteTarget.id)
    setSaving(false)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setDeleteTarget(null)
    setLoading(true)
    loadSections()
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 flex flex-col gap-4 pt-12 md:flex-row md:items-end md:justify-between md:pt-0">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-800">{t('sections.eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-black text-stone-950">{t('sections.title')}</h1>
          <p className="mt-2 text-sm text-stone-500">{t('sections.subtitle')}</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus size={17} />
          {t('sections.add')}
        </button>
      </header>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="panel p-10 text-center text-stone-500">{t('sections.loading')}</div>
      ) : sections.length === 0 ? (
        <div className="panel p-10 text-center text-stone-500">{t('sections.empty')}</div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <article key={section.id} className="panel overflow-hidden">
              <div className="h-44 bg-stone-100">
                {section.image_url ? (
                  <img src={resolveImageUrl(section.image_url)} alt={section.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-stone-500">
                    <Layers3 size={34} />
                  </div>
                )}
              </div>
              <div className="space-y-4 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-700">
                    <ImagePlus size={18} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="break-words text-base font-bold text-stone-950">{section.name}</h2>
                    <p className="mt-1 text-sm text-stone-500">{section.product_types?.name || t('products.noType')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="btn-secondary min-h-11 px-3" onClick={() => openEdit(section)}>
                    <Edit3 size={15} />
                  </button>
                  <button type="button" className="btn-secondary min-h-11 px-3 text-red-600" onClick={() => setDeleteTarget(section)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <Modal open={modalOpen} title={editing ? t('sections.edit') : t('sections.add')} onClose={() => setModalOpen(false)}>
        <form className="space-y-5" onSubmit={saveSection}>
          <FormField label={t('sections.name')}>
            <input
              className="field"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              placeholder={t('sections.placeholder')}
            />
          </FormField>
          <FormField label={t('sections.category')}>
            <select
              className="field min-h-11"
              value={form.category_id}
              onChange={(event) => {
                const newCat = event.target.value
                const firstType = productTypes.find((pt) => String(pt.category_id) === String(newCat))?.id || ''
                setForm((current) => ({ ...current, category_id: newCat, type_id: firstType }))
              }}
              required
            >
              <option value="">{t('sections.noCategory')}</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </FormField>

          <FormField label={t('sections.productType')}>
            <select
              className="field min-h-11"
              value={form.type_id}
              onChange={(event) => setForm((current) => ({ ...current, type_id: event.target.value }))}
              required
            >
              <option value="">{t('sections.noProductType')}</option>
              {productTypes
                .filter((type) => !form.category_id || String(type.category_id) === String(form.category_id))
                .map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
            </select>
          </FormField>
          <FormField label={t('common.imageUpload')}>
            <input className="field" type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
          </FormField>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? t('common.saving') : t('sections.save')}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('sections.deleteTitle')}
        message={t('sections.deleteMessage', { name: deleteTarget?.name })}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteSection}
        loading={saving}
      />
    </div>
  )
}
