import {
  Boxes,
  Bell,
  ClipboardList,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  Menu,
  Layers3,
  Tags,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import LanguageToggle from './LanguageToggle'
import { useI18n } from '../i18n/useI18n'
import { supabase } from '../lib/supabaseClient'

const brandImage = new URL('../../di5vb3oem0eypg1hds_result_0.png', import.meta.url).href

const links = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/categories', labelKey: 'nav.categories', icon: Grid2X2 },
  { to: '/products', labelKey: 'nav.products', icon: Boxes },
  { to: '/orders', labelKey: 'nav.orders', icon: ClipboardList },
  { to: '/product-types', labelKey: 'nav.productTypes', icon: Tags },
  { to: '/sections', labelKey: 'nav.sections', icon: Layers3 },
]

const mobileLinks = [
  { to: '/products', labelKey: 'nav.products', icon: Boxes },
  { to: '/categories', labelKey: 'nav.categories', icon: Grid2X2 },
  { to: '/orders', labelKey: 'nav.orders', icon: ClipboardList },
  { to: '/product-types', labelKey: 'nav.productTypes', icon: Tags },
  { to: '/sections', labelKey: 'nav.sections', icon: Layers3 },
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
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-stone-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:hidden">
        <button
          type="button"
          aria-label={t('common.openNavigation')}
          className="rounded-lg border border-stone-200 bg-white p-2 text-stone-800 shadow-sm"
          onClick={() => setOpen(true)}
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <img src={brandImage} alt="" className="h-9 w-9 rounded-lg object-cover" />
          <span className="text-sm font-black text-stone-950">{t('app.name')}</span>
        </div>
        <button
          type="button"
          aria-label={t('common.notifications')}
          className="relative rounded-lg border border-stone-200 bg-white p-2 text-stone-800 shadow-sm"
        >
          <Bell size={20} />
          <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-600" />
        </button>
      </div>

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
          <div className="flex items-center gap-3">
            <img src={brandImage} alt="" className="h-12 w-12 rounded-xl object-cover shadow-sm" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-800">
                {t('app.brand')}
              </p>
              <h1 className="mt-1 text-xl font-black text-stone-950">{t('app.name')}</h1>
            </div>
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
          <button type="button" className="btn-secondary w-full justify-between" aria-label={t('common.notifications')}>
            <span className="inline-flex items-center gap-2">
              <Bell size={16} />
              {t('common.notifications')}
            </span>
            <img src={brandImage} alt="" className="h-7 w-7 rounded-full object-cover" />
          </button>
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

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-stone-200 bg-white/95 px-2 pb-2 pt-2 shadow-[0_-8px_24px_rgba(28,25,23,0.08)] backdrop-blur md:hidden">
        {mobileLinks.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-bold transition ${
                isActive ? 'bg-stone-950 text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-950'
              }`
            }
          >
            <Icon size={19} />
            <span className="max-w-full truncate">{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
