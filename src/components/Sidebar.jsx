import {
  Boxes,
  ClipboardList,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import LanguageToggle from './LanguageToggle'
import { useI18n } from '../i18n/useI18n'
import { supabase } from '../lib/supabaseClient'

const links = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/categories', labelKey: 'nav.categories', icon: Grid2X2 },
  { to: '/products', labelKey: 'nav.products', icon: Boxes },
  { to: '/orders', labelKey: 'nav.orders', icon: ClipboardList },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { isRtl, t } = useI18n()
  const [open, setOpen] = useState(false)

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <button
        type="button"
        aria-label={t('common.openNavigation')}
        className={`fixed top-4 z-40 rounded-lg border border-stone-200 bg-white p-2 text-stone-800 shadow-sm md:hidden ${isRtl ? 'right-4' : 'left-4'}`}
        onClick={() => setOpen(true)}
      >
        <Menu size={20} />
      </button>

      {open && (
        <button
          type="button"
          aria-label={t('common.closeNavigationOverlay')}
          className="fixed inset-0 z-40 bg-stone-950/30 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 z-50 flex w-72 max-w-[86vw] flex-col bg-white px-4 py-5 shadow-xl transition-transform duration-300 md:translate-x-0 md:shadow-none ${isRtl ? 'right-0 border-l border-stone-200' : 'left-0 border-r border-stone-200'} ${
          open ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-800">
              {t('app.brand')}
            </p>
            <h1 className="mt-1 text-xl font-black text-stone-950">{t('app.name')}</h1>
          </div>
          <button
            type="button"
            aria-label={t('common.closeNavigation')}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 md:hidden"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-1">
          {links.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-stone-950 text-white shadow-sm'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950'
                }`
              }
            >
              <Icon size={18} />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <LanguageToggle />
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-sm font-semibold text-stone-900">{t('nav.adminSession')}</p>
          <p className="mt-1 text-xs text-stone-500">{t('nav.workspace')}</p>
          <button type="button" className="btn-secondary mt-4 w-full" onClick={logout}>
            <LogOut size={16} />
            {t('nav.logout')}
          </button>
          </div>
        </div>
      </aside>
    </>
  )
}
