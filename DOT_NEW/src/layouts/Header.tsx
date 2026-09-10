import type { ReactNode } from 'react'
import { translate } from '../data/i18n'
import { useLanguage } from '../context/LanguageContext'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#f7f8f3] text-gray-900">
      {children}
    </main>
  )
}

interface DotHeaderProps {
  showLogout?: boolean
  onLogout?: () => void
}

export function DotHeader({ showLogout = true, onLogout }: DotHeaderProps) {
  const { language } = useLanguage()

  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-slate-200 bg-white px-6 py-4 lg:px-8">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-500 to-emerald-600 text-sm font-black text-white">
          D
        </div>
        <span className="text-lg font-black tracking-[-0.03em] text-slate-900">DOT</span>
      </div>

      {showLogout && onLogout && (
        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          {translate('logout', language)}
        </button>
      )}
    </nav>
  )
}

interface PageHeaderProps {
  badge?: string
  title: string
  subtitle?: string
}

export function PageHeader({ badge, title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {badge && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {badge}
        </p>
      )}
      <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-base text-slate-600">{subtitle}</p>}
    </div>
  )
}
