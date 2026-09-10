import { LanguageSwitcher } from '../../components/LanguageSwitcher'
import { useLanguage } from '../../context/LanguageContext'
import { translate } from '../../data/i18n'

interface CentreHomeProps {
  onLogout: () => void
}

export function CentreHome({ onLogout }: CentreHomeProps) {
  const { language } = useLanguage()

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-gray-900">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500 via-emerald-600 to-lime-500 text-base font-black tracking-[-0.08em] text-white shadow-md shadow-emerald-500/25">
            K
          </div>
          <span className="text-[1.7rem] font-black tracking-[-0.08em] text-slate-900">KISH</span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {translate('logout', language)}
          </button>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-6 pb-16 pt-10 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Procurement Centre</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Procurement Centre Home</h1>
          <p className="mt-3 text-base text-slate-600">
            Ready for the procurement centre operational dashboard.
          </p>
        </div>
      </section>
    </main>
  )
}
