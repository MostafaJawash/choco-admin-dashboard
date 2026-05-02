import { Edit3, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import FormField from '../components/FormField'
import Modal from '../components/Modal'
import Table from '../components/Table'
import { useI18n } from '../i18n/useI18n'
import { supabase } from '../lib/supabaseClient'

const initialForm = { code: '', discount_percentage: '', is_active: true, expiration_date: '' }

export default function Coupons() {
  const { t } = useI18n()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [error, setError] = useState('')

  const loadCoupons = async () => {
    setError('')
    const { data, error: loadError } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    if (loadError) setError(loadError.message)
    setCoupons(data || [])
    setLoading(false)
  }

  useEffect(() => {
    Promise.resolve().then(loadCoupons)
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(initialForm)
    setModalOpen(true)
  }

  const openEdit = (coupon) => {
    setEditing(coupon)
    setForm({
      code: coupon.code || '',
      discount_percentage: coupon.discount_percentage || '',
      is_active: Boolean(coupon.is_active),
      expiration_date: coupon.expiration_date ? String(coupon.expiration_date).slice(0, 10) : '',
    })
    setModalOpen(true)
  }

  const isExpired = (coupon) => coupon.expiration_date && new Date(coupon.expiration_date) < new Date()

  const saveCoupon = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      code: form.code.trim(),
      discount_percentage: Number(form.discount_percentage),
      is_active: Boolean(form.is_active),
      expiration_date: form.expiration_date || null,
    }

    const request = editing
      ? supabase.from('coupons').update(payload).eq('code', editing.code)
      : supabase.from('coupons').insert(payload)
    const { error: saveError } = await request
    setSaving(false)
    if (saveError) return setError(saveError.message)
    setModalOpen(false)
    setLoading(true)
    loadCoupons()
  }

  const deleteCoupon = async () => {
    if (!deleteTarget) return
    setSaving(true)
    const { error: deleteError } = await supabase.from('coupons').delete().eq('code', deleteTarget.code)
    setSaving(false)
    if (deleteError) return setError(deleteError.message)
    setDeleteTarget(null)
    setLoading(true)
    loadCoupons()
  }

  const rows = useMemo(() => coupons.map((coupon) => ({
    ...coupon,
    status: !coupon.is_active ? 'inactive' : isExpired(coupon) ? 'expired' : 'active',
  })), [coupons])

  const columns = [
    { key: 'code', header: t('coupons.code') },
    {
      key: 'discount_percentage',
      header: t('coupons.discount'),
      render: (row) => `${row.discount_percentage}%`,
    },
    {
      key: 'expiration_date',
      header: t('coupons.expiration'),
      render: (row) => row.expiration_date || '-',
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row) => (
        <span className={`status-pill ${row.status === 'active' ? 'bg-emerald-100 text-emerald-900' : row.status === 'expired' ? 'bg-amber-100 text-amber-900' : 'bg-stone-200 text-stone-700'}`}>
          {t(`coupons.statuses.${row.status}`)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (row) => (
        <div className="flex gap-2">
          <button type="button" className="btn-secondary px-3" onClick={() => openEdit(row)}><Edit3 size={15} /></button>
          <button type="button" className="btn-secondary px-3 text-red-600" onClick={() => setDeleteTarget(row)}><Trash2 size={15} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 flex flex-col gap-4 pt-12 md:flex-row md:items-end md:justify-between md:pt-0">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-800">{t('coupons.eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-black text-stone-950">{t('coupons.title')}</h1>
          <p className="mt-2 text-sm text-stone-500">{t('coupons.subtitle')}</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}><Plus size={17} />{t('coupons.add')}</button>
      </header>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading ? <div className="panel p-10 text-center text-stone-500">{t('coupons.loading')}</div> : (
        <>
          <div className="hidden md:block"><Table columns={columns} data={rows} emptyText={t('coupons.empty')} /></div>
          <section className="grid gap-3 md:hidden">
            {rows.length === 0 ? <div className="panel p-10 text-center text-stone-500">{t('coupons.empty')}</div> : rows.map((coupon) => (
              <article key={coupon.code} className="panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-black text-stone-950">{coupon.code}</h2>
                  <span className={`status-pill ${coupon.status === 'active' ? 'bg-emerald-100 text-emerald-900' : coupon.status === 'expired' ? 'bg-amber-100 text-amber-900' : 'bg-stone-200 text-stone-700'}`}>{t(`coupons.statuses.${coupon.status}`)}</span>
                </div>
                <p className="mt-3 text-sm text-stone-600">{t('coupons.discount')}: {coupon.discount_percentage}%</p>
                <p className="mt-1 text-sm text-stone-600">{t('coupons.expiration')}: {coupon.expiration_date || '-'}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" className="btn-secondary min-h-11 px-3" onClick={() => openEdit(coupon)}><Edit3 size={15} /></button>
                  <button type="button" className="btn-secondary min-h-11 px-3 text-red-600" onClick={() => setDeleteTarget(coupon)}><Trash2 size={15} /></button>
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      <Modal open={modalOpen} title={editing ? t('coupons.edit') : t('coupons.add')} onClose={() => setModalOpen(false)}>
        <form className="space-y-5" onSubmit={saveCoupon}>
          <FormField label={t('coupons.code')}>
            <input className="field" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} required />
          </FormField>
          <FormField label={t('coupons.discount')}>
            <input className="field" type="number" min="0" max="100" value={form.discount_percentage} onChange={(event) => setForm((current) => ({ ...current, discount_percentage: event.target.value }))} required />
          </FormField>
          <FormField label={t('coupons.expiration')}>
            <input className="field" type="date" value={form.expiration_date} onChange={(event) => setForm((current) => ({ ...current, expiration_date: event.target.value }))} />
          </FormField>
          <label className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 text-sm font-semibold text-stone-700">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
            {t('coupons.isActive')}
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? t('common.saving') : t('common.save')}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('coupons.deleteTitle')}
        message={t('coupons.deleteMessage', { code: deleteTarget?.code })}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteCoupon}
        loading={saving}
      />
    </div>
  )
}
