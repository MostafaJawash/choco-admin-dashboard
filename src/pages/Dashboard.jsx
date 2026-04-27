import { Boxes, ClipboardList, Grid2X2, PackageCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import { supabase } from '../lib/supabaseClient'

const cards = [
  { key: 'categories', labelKey: 'dashboard.cards.categories', icon: Grid2X2 },
  { key: 'products', labelKey: 'dashboard.cards.products', icon: Boxes },
  { key: 'orders', labelKey: 'dashboard.cards.orders', icon: ClipboardList },
  { key: 'delivered', labelKey: 'dashboard.cards.delivered', icon: PackageCheck },
]

export default function Dashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState({ categories: 0, products: 0, orders: 0, delivered: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      const [categories, products, orders, delivered] = await Promise.all([
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
      ])

      setStats({
        categories: categories.count || 0,
        products: products.count || 0,
        orders: orders.count || 0,
        delivered: delivered.count || 0,
      })
      setLoading(false)
    }

    loadStats()
  }, [])

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 pt-12 md:pt-0">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-800">
          {t('dashboard.eyebrow')}
        </p>
        <h1 className="mt-2 text-3xl font-black text-stone-950 md:text-4xl">{t('dashboard.title')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-500">
          {t('dashboard.subtitle')}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, labelKey, icon: Icon }) => (
          <article key={key} className="panel p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-amber-100 p-3 text-amber-900">
                <Icon size={22} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                {t('common.live')}
              </span>
            </div>
            <p className="mt-6 text-sm font-semibold text-stone-500">{t(labelKey)}</p>
            <p className="mt-1 text-3xl font-black text-stone-950">
              {loading ? '...' : stats[key]}
            </p>
          </article>
        ))}
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="text-xl font-bold text-stone-950">{t('dashboard.snapshotTitle')}</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {['new', 'processing', 'delivered'].map((status) => (
            <div key={status} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{t(`orders.statuses.${status}`)}</p>
              <p className="mt-2 text-sm text-stone-600">
                {t('dashboard.snapshotText')}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
