import { translate } from '../../data/i18n'
import { useLanguage } from '../../context/LanguageContext'
import { CentreCard } from '../../components/CentreCard'
import { mockMarketRates, mockProcurementCentres } from '../../data/mockData'
import type { Session } from '@supabase/supabase-js'
import type { MarketRate, ProcurementCentre } from '../../types'

interface FarmerHomeProps {
  session: Session
  onBookProcurement: () => void
}

export function FarmerHome({ session, onBookProcurement }: FarmerHomeProps) {
  const { language } = useLanguage()

  const farmerName = session.user.user_metadata?.full_name || session.user.phone || 'Farmer'

  return (
    <div className="space-y-6">
      {/* Greeting Section */}
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {translate('greeting', language)}
        </p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">
          {translate('hello', language)}, {farmerName.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{translate('homeGreeting', language)}</p>
      </div>

      {/* Primary Action */}
      <button
        type="button"
        onClick={onBookProcurement}
        className="w-full rounded-2xl bg-emerald-600 px-6 py-4 text-center font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 active:scale-98"
      >
        {translate('bookProcurement', language)}
      </button>

      {/* Active Booking */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="mb-3 font-semibold text-slate-900">{translate('activeBooking', language)}</h2>
        <p className="text-sm text-slate-600">{translate('noActiveBooking', language)}</p>
      </div>

      {/* Current Market Rate */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{translate('currentMarketRate', language)}</h2>
          <a href="#" className="text-xs font-semibold text-emerald-600 hover:text-emerald-500">
            {translate('viewAll', language)}
          </a>
        </div>

        <div className="space-y-3">
          {mockMarketRates.map((rate: MarketRate) => (
            <div key={rate.cropId} className="flex items-center justify-between border-t border-slate-100 py-3 first:border-0 first:py-0">
              <div>
                <p className="font-semibold text-slate-900">{language === 'ta' ? rate.cropNameTa : rate.cropNameEn}</p>
                <p className="text-xs text-slate-500">{translate('lastUpdated', language)}: {rate.lastUpdated}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-emerald-600">₹{rate.currentRate}</p>
                <p className="text-xs text-slate-500">{rate.unit}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby Procurement Centres */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{translate('nearbyProcurementCentres', language)}</h2>
          <a href="#" className="text-xs font-semibold text-emerald-600 hover:text-emerald-500">
            {translate('viewAll', language)}
          </a>
        </div>

        <div className="space-y-3">
          {mockProcurementCentres.slice(0, 3).map((centre: ProcurementCentre) => (
            <CentreCard key={centre.id} centre={centre} />
          ))}
        </div>

        <button
          type="button"
          className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          {translate('viewAll', language)}
        </button>
      </div>

      {/* Queue Status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="mb-3 font-semibold text-slate-900">{translate('queueStatus', language)}</h2>
        <p className="text-sm text-slate-600">{translate('marketsOpen', language)}</p>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="mb-3 font-semibold text-slate-900">{translate('notifications', language)}</h2>
        <p className="text-sm text-slate-600">{translate('noNotifications', language)}</p>
      </div>
    </div>
  )
}
