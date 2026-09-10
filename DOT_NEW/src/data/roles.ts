import type { RoleOption } from '../types'

export const ROLE_OPTIONS: RoleOption[] = [
  {
    key: 'farmer',
    labelEn: 'Farmer',
    labelTa: 'விவசாயி',
    icon: '🌾',
    descriptionEn: 'Sell your produce through verified procurement centres.',
    descriptionTa: 'சரிபார்க்கப்பட்ட குவிப்பு மையங்களூடாக உங்கள் பொருட்களை விற்க.',
  },
  {
    key: 'procurement_centre',
    labelEn: 'Procurement Centre',
    labelTa: 'குவிப்பு மையம்',
    icon: '🏬',
    descriptionEn: 'Manage procurement, arrivals and daily operations.',
    descriptionTa: 'குவிப்பு, வருகை மற்றும் தினசரி நடவடிக்கைகளை நிர்வகிக்கவும்.',
  },
  {
    key: 'administration',
    labelEn: 'Administration',
    labelTa: 'நிர்வாகம்',
    icon: '🏛️',
    descriptionEn: 'Monitor procurement, pricing and transparency.',
    descriptionTa: 'குவிப்பு, விலை நிர்ணயம் மற்றும் স்বচ்ছতையை கண்காணிக்கவும்.',
  },
]
