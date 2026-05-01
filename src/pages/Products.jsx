import { Edit3, FolderTree, ImagePlus, Layers3, Plus, Search, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import FormField from '../components/FormField'
import Modal from '../components/Modal'
import { useI18n } from '../i18n/useI18n'
import { supabase } from '../lib/supabaseClient'

const PRODUCT_IMAGES_BUCKET = 'product-images'
const IMAGE_MIME_TYPE = /^image\//
const PRODUCT_IMAGES_PUBLIC_PATH = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`
const initialForm = {
  name: '',
  price: '',
  description: '',
  weight: '',
  category_id: '',
  type_id: '',
  images: [],
}

const normalizeProductImages = (images) => {
  if (!images) return []

  if (Array.isArray(images)) {
    return images.map((image) => String(image || '').trim()).filter(Boolean)
  }

  if (typeof images !== 'string') return []

  const trimmedImages = images.trim()
  if (!trimmedImages) return []

  try {
    const parsedImages = JSON.parse(trimmedImages)

    if (Array.isArray(parsedImages)) {
      return parsedImages.map((image) => String(image || '').trim()).filter(Boolean)
    }

    if (typeof parsedImages === 'string') {
      const parsedImage = parsedImages.trim()
      return parsedImage ? [parsedImage] : []
    }
  } catch {
    return [trimmedImages]
  }

  return []
}

export default function Products() {
  const { language, t } = useI18n()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [productTypes, setProductTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [files, setFiles] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const loadData = useCallback(async () => {
    setError('')
    const [productResult, categoryResult, productTypeResult] = await Promise.all([
      supabase.from('products').select('*, categories(name), product_types(name)').order('name', { ascending: true }),
      supabase.from('categories').select('*').order('name', { ascending: true }),
      supabase.from('product_types').select('id, name').order('name', { ascending: true }),
    ])

    if (productResult.error) setError(productResult.error.message)
    if (categoryResult.error) setError(categoryResult.error.message)
    if (productTypeResult.error) setError(productTypeResult.error.message || t('products.typeLoadError'))
    setProducts(productResult.data || [])
    setCategories(categoryResult.data || [])
    setProductTypes(productTypeResult.data || [])
    setLoading(false)
  }, [t])

  useEffect(() => {
    Promise.resolve().then(loadData)
  }, [loadData])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = [product.name, product.description, product.weight]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesCategory = categoryFilter ? product.category_id === categoryFilter : true
      const matchesType = typeFilter ? product.type_id === typeFilter : true
      return matchesSearch && matchesCategory && matchesType
    })
  }, [products, search, categoryFilter, typeFilter])

  const getProductTypeName = useCallback((product) => {
    return product.product_types?.name || productTypes.find((type) => type.id === product.type_id)?.name || product.type || t('products.noType')
  }, [productTypes, t])

  const getCategoryName = useCallback((product) => {
    return product.categories?.name || categories.find((category) => category.id === product.category_id)?.name || t('common.unassigned')
  }, [categories, t])

  const formatPrice = (value) => {
    const formatted = new Intl.NumberFormat(language === 'ar' ? 'ar-SY' : 'en-US', {
      maximumFractionDigits: 0,
    }).format(Number(value || 0))

    return `${formatted} ل.س`
  }

  const categorySummaries = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      count: filteredProducts.filter((product) => product.category_id === category.id).length,
    }))
  }, [categories, filteredProducts])

  const typeSummaries = useMemo(() => {
    return productTypes.map((type) => ({
      ...type,
      count: filteredProducts.filter((product) => product.type_id === type.id).length,
    }))
  }, [filteredProducts, productTypes])

  const groupedProducts = useMemo(() => {
    const categoryMap = new Map()

    filteredProducts.forEach((product) => {
      const categoryKey = product.category_id || 'unassigned'
      const typeKey = product.type_id || 'unassigned'
      const categoryName = getCategoryName(product)
      const typeName = getProductTypeName(product)

      if (!categoryMap.has(categoryKey)) {
        categoryMap.set(categoryKey, {
          id: categoryKey,
          name: categoryName,
          total: 0,
          types: new Map(),
        })
      }

      const categoryGroup = categoryMap.get(categoryKey)
      categoryGroup.total += 1

      if (!categoryGroup.types.has(typeKey)) {
        categoryGroup.types.set(typeKey, {
          id: typeKey,
          name: typeName,
          products: [],
        })
      }

      categoryGroup.types.get(typeKey).products.push(product)
    })

    return Array.from(categoryMap.values()).map((categoryGroup) => ({
      ...categoryGroup,
      types: Array.from(categoryGroup.types.values()),
    }))
  }, [filteredProducts, getCategoryName, getProductTypeName])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...initialForm, category_id: categories[0]?.id || '', type_id: productTypes[0]?.id || '' })
    setFiles([])
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      name: product.name || '',
      price: product.price || '',
      description: product.description || '',
      weight: product.weight || '',
      category_id: product.category_id || '',
      type_id: product.type_id || '',
      images: normalizeProductImages(product.images),
    })
    setFiles([])
    setModalOpen(true)
  }

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const removeImage = (url) => {
    setForm((current) => ({ ...current, images: current.images.filter((image) => image !== url) }))
  }

  const getProductImageUrl = (image) => {
    const value = String(image || '').trim()
    if (!value) return ''

    if (/^https?:\/\//i.test(value)) return value

    const storagePath = value
      .replace(/^\/+/, '')
      .replace(new RegExp(`^${PRODUCT_IMAGES_BUCKET}/`), '')
      .replace(PRODUCT_IMAGES_PUBLIC_PATH.replace(/^\//, ''), '')
      .trim()

    return supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(storagePath).data.publicUrl
  }

  const createImagePath = (file) => {
    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    return `products/${Date.now()}-${crypto.randomUUID()}.${extension}`
  }

  const uploadImages = async () => {
    const uploaded = []

    for (const file of files) {
      if (!IMAGE_MIME_TYPE.test(file.type)) {
        throw new Error(t('products.invalidImage', { name: file.name }))
      }

      const path = createImagePath(file)
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)
      const publicUrl = data.publicUrl?.trim()

      if (!publicUrl) {
        throw new Error(t('products.publicUrlError', { name: file.name }))
      }

      uploaded.push(publicUrl)
    }

    return uploaded
  }

  const saveProduct = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!form.type_id) {
        throw new Error(t('products.typeRequired'))
      }

      const newImages = await uploadImages()
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        weight: form.weight.trim(),
        category_id: form.category_id || null,
        type_id: form.type_id,
        images: [...form.images, ...newImages].map((image) => image.trim()).filter(Boolean),
      }

      const request = editing
        ? supabase.from('products').update(payload).eq('id', editing.id)
        : supabase.from('products').insert(payload)
      const { error: saveError } = await request
      if (saveError) throw saveError

      setModalOpen(false)
      setLoading(true)
      loadData()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteProduct = async () => {
    if (!deleteTarget) return
    setSaving(true)
    const { error: deleteError } = await supabase.from('products').delete().eq('id', deleteTarget.id)
    setSaving(false)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setDeleteTarget(null)
    setLoading(true)
    loadData()
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 flex flex-col gap-4 pt-12 md:flex-row md:items-end md:justify-between md:pt-0">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-800">{t('products.eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-black text-stone-950">{t('products.title')}</h1>
          <p className="mt-2 text-sm text-stone-500">{t('products.subtitle')}</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus size={17} />
          {t('products.add')}
        </button>
      </header>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="panel mb-5 grid gap-3 p-4 md:grid-cols-[1fr_220px_190px]">
        <label className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input className="field ps-10" placeholder={t('products.searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <select className="field" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="">{t('products.allCategories')}</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select className="field" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="">{t('products.allTypes')}</option>
          {productTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
      </section>

      <section className="mb-5 grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-950">
            <FolderTree size={18} className="text-amber-800" />
            {t('products.categoryOverview')}
          </div>
          <div className="flex flex-wrap gap-2">
            {categorySummaries.length === 0 ? (
              <span className="text-sm text-stone-500">{t('categories.empty')}</span>
            ) : (
              categorySummaries.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    categoryFilter === category.id
                      ? 'border-stone-950 bg-stone-950 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                  }`}
                  onClick={() => setCategoryFilter((current) => (current === category.id ? '' : category.id))}
                >
                  {category.name}
                  <span className="ms-2 text-xs opacity-70">{category.count}</span>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="panel p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-950">
            <Layers3 size={18} className="text-amber-800" />
            {t('products.typeOverview')}
          </div>
          <div className="flex flex-wrap gap-2">
            {typeSummaries.length === 0 ? (
              <span className="text-sm text-stone-500">{t('productTypes.empty')}</span>
            ) : (
              typeSummaries.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    typeFilter === type.id
                      ? 'border-amber-900 bg-amber-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                  }`}
                  onClick={() => setTypeFilter((current) => (current === type.id ? '' : type.id))}
                >
                  {type.name}
                  <span className="ms-2 text-xs opacity-70">{type.count}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="panel p-10 text-center text-stone-500">{t('products.loading')}</div>
      ) : filteredProducts.length === 0 ? (
        <div className="panel p-10 text-center text-stone-500">{t('products.empty')}</div>
      ) : (
        <section className="space-y-5">
          {groupedProducts.map((categoryGroup) => (
            <section key={categoryGroup.id} className="panel overflow-hidden">
              <div className="flex flex-col gap-2 border-b border-stone-200 bg-stone-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-stone-950">{categoryGroup.name}</h2>
                  <p className="mt-1 text-sm text-stone-500">{t('products.productsCount', { count: categoryGroup.total })}</p>
                </div>
              </div>
              <div className="space-y-5 p-4">
                {categoryGroup.types.map((typeGroup) => (
                  <div key={typeGroup.id}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-black text-amber-900">{typeGroup.name}</h3>
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
                        {t('products.productsCount', { count: typeGroup.products.length })}
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {typeGroup.products.map((product) => {
                        const images = normalizeProductImages(product.images)
                        return (
                          <article key={product.id} className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
                            <div className="bg-stone-100 p-2">
                              {images.length > 0 ? (
                                <div className="grid gap-2">
                                  {images.map((image, index) => (
                                    <img
                                      key={`${image}-${index}`}
                                      src={getProductImageUrl(image)}
                                      alt={product.name}
                                      className="h-56 w-full rounded object-cover"
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="grid h-56 place-items-center text-stone-400"><ImagePlus size={34} /></div>
                              )}
                            </div>
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h4 className="truncate font-bold text-stone-950">{product.name}</h4>
                                  <p className="mt-1 text-sm text-stone-500">{getCategoryName(product)} · {getProductTypeName(product)}</p>
                                </div>
                                <p className="shrink-0 font-black text-amber-900">{formatPrice(product.price)}</p>
                              </div>
                              <p className="mt-3 line-clamp-2 text-sm text-stone-600">{product.description}</p>
                              <div className="mt-4 flex items-center justify-between gap-3">
                                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">{product.weight || t('products.noWeight')}</span>
                                <div className="flex gap-2">
                                  <button type="button" className="btn-secondary px-3" onClick={() => openEdit(product)}><Edit3 size={15} /></button>
                                  <button type="button" className="btn-secondary px-3 text-red-600" onClick={() => setDeleteTarget(product)}><Trash2 size={15} /></button>
                                </div>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </section>
      )}

      <Modal open={modalOpen} title={editing ? t('products.edit') : t('products.add')} onClose={() => setModalOpen(false)} size="max-w-3xl">
        <form className="grid gap-4" onSubmit={saveProduct}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label={t('common.name')}>
              <input className="field" value={form.name} onChange={(event) => updateForm('name', event.target.value)} required />
            </FormField>
            <FormField label={t('common.price')}>
              <input className="field" type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateForm('price', event.target.value)} required />
            </FormField>
            <FormField label={t('common.weight')}>
              <input className="field" value={form.weight} onChange={(event) => updateForm('weight', event.target.value)} placeholder="500g" />
            </FormField>
            <FormField label={t('common.type')}>
              <select className="field" value={form.type_id} onChange={(event) => updateForm('type_id', event.target.value)} required>
                <option value="">{t('products.noType')}</option>
                {productTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label={t('common.category')}>
            <select className="field" value={form.category_id} onChange={(event) => updateForm('category_id', event.target.value)}>
              <option value="">{t('products.noCategory')}</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </FormField>
          <FormField label={t('common.description')}>
            <textarea className="field min-h-28 resize-y" value={form.description} onChange={(event) => updateForm('description', event.target.value)} />
          </FormField>
          <FormField label={t('common.images')}>
            <input className="field" type="file" accept="image/*" multiple onChange={(event) => setFiles([...event.target.files])} />
          </FormField>
          {form.images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {form.images.map((image) => (
                <div key={image} className="relative overflow-hidden rounded-lg border border-stone-200">
                  <img src={getProductImageUrl(image)} alt="" className="h-24 w-full object-cover" />
                  <button type="button" className="absolute end-1 top-1 rounded-full bg-white p-1 text-red-600 shadow" onClick={() => removeImage(image)}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? t('common.saving') : t('products.save')}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('products.deleteTitle')}
        message={t('products.deleteMessage', { name: deleteTarget?.name })}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteProduct}
        loading={saving}
      />
    </div>
  )
}
