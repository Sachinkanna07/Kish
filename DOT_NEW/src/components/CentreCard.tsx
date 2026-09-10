import { translate } from '../data/i18n'
import { useLanguage } from '../context/LanguageContext'
import type { ProcurementCentre } from '../types'

interface CentreCardProps {
  centre: ProcurementCentre
}

export function CentreCard({ centre }: CentreCardProps) {
  const { language } = useLanguage()

  const statusColor = {
    open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    busy: 'bg-amber-50 text-amber-700 border-amber-200',
    closed: 'bg-red-50 text-red-700 border-red-200',
  }

  const statusLabel = {
    open: translate('open', language),
    busy: translate('busy', language),
    closed: translate('closed', language),
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{centre.nameEn}</h3>
          <p className="text-xs text-slate-500">{centre.location.addressEn}</p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusColor[centre.status]}`}>
          {statusLabel[centre.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
        <div>
          <p className="text-xs text-slate-500">{translate('distance', language)}</p>
          <p className="text-sm font-semibold text-slate-900">
            {centre.distance} {translate('km', language)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{translate('currentQueue', language)}</p>
          <p className="text-sm font-semibold text-slate-900">
            {centre.currentQueue} {translate('farmers', language)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{translate('estimatedWaiting', language)}</p>
          <p className="text-sm font-semibold text-slate-900">
            {centre.estimatedWaitingTime} {translate('minutes', language)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{translate('availableSlots', language)}</p>
          <p className="text-sm font-semibold text-slate-900">{centre.availableSlots}</p>
        </div>
      </div>
    </div>
  )
}
