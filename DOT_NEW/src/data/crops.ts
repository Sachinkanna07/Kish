import type { Crop } from '../types'

/**
 * Prototype crop catalogue for the Thoothukudi / Kovilpatti belt.
 * Historical/sample rates are for demonstration only, not current MSP advice.
 */
export const crops: Crop[] = [
  {
    id: 'wheat',
    name: { en: 'Wheat', ta: 'கோதுமை' },
    unit: { en: 'kg', ta: 'கிலோ' },
    mspPerQuintal: 2400,
    season: { en: 'Sample crop', ta: 'மாதிரி பயிர்' },
  },
  {
    id: 'paddy',
    name: { en: 'Paddy', ta: 'நெல்' },
    unit: { en: 'kg', ta: 'கிலோ' },
    mspPerQuintal: 2369,
    season: { en: 'Kharif · Sep–Jan', ta: 'கார் · செப்–ஜன' },
  },
  {
    id: 'cotton',
    name: { en: 'Cotton', ta: 'பருத்தி' },
    unit: { en: 'kg', ta: 'கிலோ' },
    mspPerQuintal: 7710,
    season: { en: 'Oct–Mar', ta: 'அக்–மார்' },
  },
  {
    id: 'maize',
    name: { en: 'Maize', ta: 'மக்காச்சோளம்' },
    unit: { en: 'kg', ta: 'கிலோ' },
    mspPerQuintal: 2400,
    season: { en: 'Year round', ta: 'ஆண்டு முழுவதும்' },
  },
  {
    id: 'groundnut',
    name: { en: 'Groundnut', ta: 'நிலக்கடலை' },
    unit: { en: 'kg', ta: 'கிலோ' },
    mspPerQuintal: 7263,
    season: { en: 'Jun–Oct', ta: 'ஜூன்–அக்' },
  },
  {
    id: 'blackgram',
    name: { en: 'Black gram', ta: 'உளுந்து' },
    unit: { en: 'kg', ta: 'கிலோ' },
    mspPerQuintal: 7800,
    season: { en: 'Sep–Feb', ta: 'செப்–பிப்' },
  },
  {
    id: 'chilli',
    name: { en: 'Dry chilli', ta: 'காய்ந்த மிளகாய்' },
    unit: { en: 'kg', ta: 'கிலோ' },
    mspPerQuintal: 9200,
    season: { en: 'Dec–Apr', ta: 'டிச–ஏப்' },
  },
]

export const cropById = (id: string | undefined): Crop | undefined =>
  crops.find((crop) => crop.id === id)
