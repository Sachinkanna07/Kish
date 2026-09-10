export type Language = 'en' | 'ta'

export type RoleKey = 'farmer' | 'procurement_centre' | 'administration'

export type TextScale = 'md' | 'lg' | 'xl'

/** A short label that exists in both languages. */
export interface Bilingual {
  en: string
  ta: string
}

export interface Crop {
  id: string
  name: Bilingual
  /** Unit farmers actually talk in. */
  unit: Bilingual
  /** Government support price, rupees per quintal (100 kg). */
  mspPerQuintal: number
  season: Bilingual
}

export type CentreLoad = 'free' | 'normal' | 'busy' | 'congested' | 'closed'

export interface Centre {
  id: string
  name: Bilingual
  village: Bilingual
  district: Bilingual
  /** Road distance from the farmer's village, kilometres. */
  distanceKm: number
  /** Minutes the centre takes to finish one farmer, on average. */
  minutesPerFarmer: number
  /** Farmers waiting when the app session started. */
  initialQueue: number
  /** Tonnes the centre can still accept today. */
  capacityTonnes: number
  capacityUsedTonnes: number
  opensAt: number
  closesAt: number
  /** Rupees per quintal this centre is paying today, keyed by crop id. */
  rates: Record<string, number>
  facilities: string[]
  phone: string
}

export interface Slot {
  id: string
  centreId: string
  /** ISO date, yyyy-mm-dd. */
  date: string
  startMinutes: number
  endMinutes: number
  capacity: number
  booked: number
}

export type Grade = 'A' | 'B' | 'C'

export type BookingStatus =
  | 'booked'
  | 'arrived'
  | 'weighing'
  | 'completed'
  | 'payment_pending'
  | 'paid'
  | 'cancelled'

export interface Booking {
  id: string
  /** Short number the farmer and the centre both say out loud. */
  tokenNo: number
  centreId: string
  cropId: string
  /** Kilograms. */
  quantityKg: number
  date: string
  slotId: string
  status: BookingStatus
  createdAt: number
  grade?: Grade
  /** Weight the centre actually recorded, kilograms. */
  weighedKg?: number
  /** Net rupees payable after grade adjustment. */
  amount?: number
  ratePerQuintal?: number
  paidAt?: number
  reference?: string
  /** Farmer who owns the booking. Demo centre queues include other farmers. */
  farmerName: string
  farmerPhone: string
}

export type AlertKind = 'queue' | 'booking' | 'payment' | 'centre'

export interface AppAlert {
  id: string
  kind: AlertKind
  title: Bilingual
  body: Bilingual
  createdAt: number
  read: boolean
}

export interface Profile {
  name: string
  phone: string
  village: Bilingual
  district: Bilingual
  /** Free-text farmer registration id printed on the token. */
  farmerId: string
  landAcres: number
}

export interface Session {
  phone: string
  role: RoleKey | null
  /** Centre the logged-in operator manages. Only used for the centre role. */
  centreId: string | null
  verifiedAt: number | null
}

/** Older prototype centre card used by mockData / CentreCard. */
export interface ProcurementCentre {
  id: string
  nameEn: string
  nameTa: string
  location: {
    lat: number
    lng: number
    addressEn: string
    addressTa: string
  }
  distance: number
  currentQueue: number
  estimatedWaitingTime: number
  availableCapacity: number
  availableSlots: number
  status: 'open' | 'busy' | 'closed'
}

export interface MarketRate {
  cropId: string
  cropNameEn: string
  cropNameTa: string
  currentRate: number
  unit: string
  lastUpdated: string
}

export interface RoleOption {
  key: RoleKey
  labelEn: string
  labelTa: string
  icon: string
  descriptionEn: string
  descriptionTa: string
}

export interface BookingDraft {
  cropId?: string
  quantityKg?: number
  centreId?: string
  date?: string
  slotId?: string
}

/** One line of the "why this centre" explanation shown to the farmer. */
export interface ScoreReason {
  key: string
  label: Bilingual
  /** Human-readable value, already formatted. */
  value: string
  /** Whether this factor helps ('good'), hurts ('bad'), or is neutral. */
  tone: 'good' | 'bad' | 'neutral'
}

export interface CentreEvaluation {
  centre: Centre
  load: CentreLoad
  queueNow: number
  waitMinutes: number
  travelMinutes: number
  totalMinutes: number
  ratePerQuintal: number
  /** Gross rupees for the farmer's quantity at this centre's rate. */
  grossAmount: number
  capacityLeftTonnes: number
  hasRoom: boolean
  score: number
  reasons: ScoreReason[]
}
