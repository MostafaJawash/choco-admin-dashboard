import { Lock, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LanguageToggle from '../components/LanguageToggle'
import { useI18n } from '../i18n/useI18n'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/dashboard', { replace: true })
    })
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)
    if (signInError) {
      setError(signInError.message)
      return
    }

    navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
  }

  return (
    <main className="grid min-h-screen place-items-center bg-stone-950 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex justify-end">
          <LanguageToggle className="w-auto" />
        </div>
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-800">
            {t('login.eyebrow')}
          </p>
          <h1 className="mt-2 text-3xl font-black text-stone-950">{t('login.title')}</h1>
          <p className="mt-2 text-sm text-stone-500">
            {t('login.subtitle')}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700">{t('common.email')}</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                className="field ps-10"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700">{t('common.password')}</span>
            <span className="relative block">
              <Lock className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                className="field ps-10"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
            </span>
          </label>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>
      </section>
    </main>
  )
}
