import { useEffect, useState } from 'react'
import Table from '../components/Table'
import { useI18n } from '../i18n/useI18n'
import { supabase } from '../lib/supabaseClient'

export default function Users() {
  const { t } = useI18n()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadUsers = async () => {
      setError('')
      const { data, error: loadError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .order('full_name', { ascending: true })
      if (loadError) setError(loadError.message)
      setUsers(data || [])
      setLoading(false)
    }
    Promise.resolve().then(loadUsers)
  }, [])

  const columns = [
    { key: 'full_name', header: t('users.fullName') },
    { key: 'phone', header: t('users.phone') },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 pt-12 md:pt-0">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-800">{t('users.eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-black text-stone-950">{t('users.title')}</h1>
        <p className="mt-2 text-sm text-stone-500">{t('users.subtitle')}</p>
      </header>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading ? <div className="panel p-10 text-center text-stone-500">{t('users.loading')}</div> : (
        <>
          <div className="hidden md:block">
            <Table columns={columns} data={users} emptyText={t('users.empty')} />
          </div>
          <section className="grid gap-3 md:hidden">
            {users.length === 0 ? <div className="panel p-10 text-center text-stone-500">{t('users.empty')}</div> : users.map((user) => (
              <article key={user.id} className="panel p-4">
                <h2 className="font-bold text-stone-950">{user.full_name || '-'}</h2>
                <p className="mt-2 text-sm text-stone-600">{user.phone || '-'}</p>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
