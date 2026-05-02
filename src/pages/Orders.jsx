import { Eye, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal'
import Table from '../components/Table'
import { useI18n } from '../i18n/useI18n'
import { supabase } from '../lib/supabaseClient'

const statuses = ['new', 'installing', 'preparing', 'shipping', 'delivered']
const statusStyles = {
  new: 'bg-sky-100 text-sky-900',
  installing: 'bg-violet-100 text-violet-900',
  preparing: 'bg-amber-100 text-amber-900',
  shipping: 'bg-orange-100 text-orange-900',
  delivered: 'bg-emerald-100 text-emerald-800',
}

const legacyStatusMap = {
  processing: 'preparing',
}

const normalizeStatus = (value) => {
  const current = String(value || '').toLowerCase()
  if (statuses.includes(current)) return current
  return legacyStatusMap[current] || 'new'
}

function calculateTotal(order) {
  if (order.total_price) return Number(order.total_price)
  return (order.order_items || []).reduce((total, item) => {
    const unitPrice = Number(item.price || item.products?.price || 0)
    const quantity = Number(item.quantity || 1)
    return total + unitPrice * quantity
  }, 0)
}

function getAmounts(order) {
  const base = Number(order.total_amount ?? order.total_price ?? calculateTotal(order) ?? 0)
  const discount = Number(order.discount_amount || 0)
  const final = Number(order.final_amount ?? (base - discount))
  return { total: base, discount, final }
}

export default function Orders() {
  const { language, t } = useI18n()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')

  const loadOrders = async () => {
    setError('')

    let result = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, price, images))')
      .order('created_at', { ascending: false })

    if (result.error) {
      result = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false })
    }

    if (result.error) setError(result.error.message)
    setOrders(result.data || [])
    setLoading(false)
  }

  useEffect(() => {
    Promise.resolve().then(loadOrders)
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const text = [order.customer_name, order.phone, order.address, order.status]
        .join(' ')
        .toLowerCase()
      const matchesSearch = text.includes(search.toLowerCase())
      const matchesStatus = statusFilter ? normalizeStatus(order.status) === statusFilter : true
      return matchesSearch && matchesStatus
    })
  }, [orders, search, statusFilter])

  const updateStatus = async (orderId, status) => {
    setSavingId(orderId)
    setError('')
    const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', orderId)
    setSavingId('')

    if (updateError) {
      setError(updateError.message)
      return
    }

    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)))
    setSelectedOrder((current) => (current?.id === orderId ? { ...current, status } : current))
  }

  const formatCurrency = (value) => {
    const formatted = new Intl.NumberFormat(language === 'ar' ? 'ar-SY' : 'en-US', {
      maximumFractionDigits: 0,
    }).format(Number(value || 0))

    return `${formatted} ل.س`
  }

  const formatDate = (value) => {
    if (!value) return '-'
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar' : 'en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }

  const columns = [
    {
      key: 'customer_name',
      header: t('common.customer'),
      render: (row) => (
        <div>
          <p className="font-semibold text-stone-950">{row.customer_name}</p>
          <p className="text-xs text-stone-500">{row.phone}</p>
        </div>
      ),
    },
    {
      key: 'address',
      header: t('common.address'),
      render: (row) => <span className="line-clamp-2 max-w-sm">{row.address}</span>,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row) => (
        <select
          className={`rounded-full border-0 px-3 py-1 text-xs font-bold outline-none ${statusStyles[normalizeStatus(row.status)] || statusStyles.new}`}
          value={normalizeStatus(row.status)}
          onChange={(event) => updateStatus(row.id, event.target.value)}
          disabled={savingId === row.id}
        >
          {statuses.map((status) => <option key={status} value={status}>{t(`orders.statuses.${status}`)}</option>)}
        </select>
      ),
    },
    {
      key: 'total',
      header: t('common.total'),
      render: (row) => {
        const { total, discount, final } = getAmounts(row)
        return (
          <div>
            <div className="font-bold text-stone-950">{formatCurrency(total)}</div>
            {(discount > 0 || final !== total) && (
              <div className="mt-1 text-xs text-stone-500">
                {discount > 0 && <span className="me-2">{t('orders.discount') || 'Discount'}: {formatCurrency(discount)}</span>}
                {final !== total && <span>{t('orders.final') || 'Final'}: {formatCurrency(final)}</span>}
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'created_at',
      header: t('orders.createdAt'),
      render: (row) => <span className="text-sm text-stone-600">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: t('common.details'),
      render: (row) => (
        <button type="button" className="btn-secondary px-3" onClick={() => setSelectedOrder(row)}>
          <Eye size={15} />
          {t('common.view')}
        </button>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 pt-12 md:pt-0">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-800">{t('orders.eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-black text-stone-950">{t('orders.title')}</h1>
        <p className="mt-2 text-sm text-stone-500">{t('orders.subtitle')}</p>
      </header>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="panel mb-5 grid gap-3 p-4 md:grid-cols-[1fr_220px]">
        <label className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input className="field ps-10" placeholder={t('orders.searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <select className="field capitalize" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">{t('orders.allStatuses')}</option>
          {statuses.map((status) => <option key={status} value={status}>{t(`orders.statuses.${status}`)}</option>)}
        </select>
      </section>

      {loading ? (
        <div className="panel p-10 text-center text-stone-500">{t('orders.loading')}</div>
      ) : (
        <>
          <div className="hidden md:block">
            <Table columns={columns} data={filteredOrders} emptyText={t('orders.empty')} />
          </div>
          <section className="grid gap-3 md:hidden">
            {filteredOrders.length === 0 ? (
              <div className="panel p-10 text-center text-stone-500">{t('orders.empty')}</div>
            ) : (
              filteredOrders.map((order) => (
                <article key={order.id} className="panel p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-bold text-stone-950">{order.customer_name}</h2>
                      <p className="mt-1 text-sm text-stone-500">{order.phone}</p>
                    </div>
                    <select
                      className={`shrink-0 rounded-full border-0 px-3 py-1 text-xs font-bold outline-none ${statusStyles[normalizeStatus(order.status)] || statusStyles.new}`}
                      value={normalizeStatus(order.status)}
                      onChange={(event) => updateStatus(order.id, event.target.value)}
                      disabled={savingId === order.id}
                    >
                      {statuses.map((status) => <option key={status} value={status}>{t(`orders.statuses.${status}`)}</option>)}
                    </select>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-stone-50 p-3">
                      <p className="text-xs font-bold text-stone-500">{t('common.total')}</p>
                          <p className="mt-1 font-black text-stone-950">{formatCurrency(getAmounts(order).total)}</p>
                    </div>
                        <div className="rounded-lg bg-stone-50 p-3">
                          <p className="text-xs font-bold text-stone-500">{t('orders.final') || 'Final'}</p>
                          <p className="mt-1 font-black text-stone-950">{formatCurrency(getAmounts(order).final)}</p>
                          {getAmounts(order).discount > 0 && (
                            <p className="mt-1 text-xs text-stone-500">{t('orders.discount') || 'Discount'}: {formatCurrency(getAmounts(order).discount)}</p>
                          )}
                        </div>
                  </div>
                  <button type="button" className="btn-secondary mt-4 w-full" onClick={() => setSelectedOrder(order)}>
                    <Eye size={15} />
                    {t('common.view')}
                  </button>
                </article>
              ))
            )}
          </section>
        </>
      )}

      <Modal open={Boolean(selectedOrder)} title={t('orders.detailsTitle')} onClose={() => setSelectedOrder(null)} size="max-w-3xl">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-stone-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('common.customer')}</p>
                <p className="mt-2 font-semibold text-stone-950">{selectedOrder.customer_name}</p>
              </div>
              <div className="rounded-lg bg-stone-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('common.phone')}</p>
                <p className="mt-2 font-semibold text-stone-950">{selectedOrder.phone}</p>
              </div>
              <div className="rounded-lg bg-stone-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('common.status')}</p>
                <select className="field mt-2" value={normalizeStatus(selectedOrder.status)} onChange={(event) => updateStatus(selectedOrder.id, event.target.value)}>
                  {statuses.map((status) => <option key={status} value={status}>{t(`orders.statuses.${status}`)}</option>)}
                </select>
              </div>
            </div>

            <div className="rounded-lg bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('common.address')}</p>
              <p className="mt-2 text-sm text-stone-700">{selectedOrder.address}</p>
            </div>

            <div>
              <h3 className="mb-3 font-bold text-stone-950">{t('orders.orderedProducts')}</h3>
              <div className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
                {(selectedOrder.order_items || []).length === 0 ? (
                  <p className="p-4 text-sm text-stone-500">{t('orders.noItems')}</p>
                ) : (
                  selectedOrder.order_items.map((item) => {
                    const productName = item.products?.name || item.product_name || t('orders.fallbackProduct', { id: item.product_id || '' })
                    const price = Number(item.price || item.products?.price || 0)
                    const quantity = Number(item.quantity || 1)
                    return (
                      <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-stone-950">{productName}</p>
                          <p className="text-sm text-stone-500">{t('orders.quantity')} {quantity} · {formatCurrency(price)}</p>
                        </div>
                        <p className="font-bold text-stone-950">{formatCurrency(price * quantity)}</p>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="rounded-xl bg-stone-950 px-5 py-4 text-white">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="text-center">
                  <p className="text-xs font-semibold">{t('orders.totalPrice')}</p>
                  <p className="mt-1 text-lg font-black">{formatCurrency(getAmounts(selectedOrder).total)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold">{t('orders.discount') || 'Discount'}</p>
                  <p className="mt-1 text-lg font-semibold">{formatCurrency(getAmounts(selectedOrder).discount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold">{t('orders.final') || 'Final'}</p>
                  <p className="mt-1 text-lg font-black">{formatCurrency(getAmounts(selectedOrder).final)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
