import { useLanguage } from '../context/LanguageContext'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase transition ${
          language === 'en'
            ? 'bg-emerald-600 text-white'
            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('ta')}
        className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase transition ${
          language === 'ta'
            ? 'bg-emerald-600 text-white'
            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        TA
      </button>
    </div>
  )
}
