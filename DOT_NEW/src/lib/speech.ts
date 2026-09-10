import type { Language } from '../types'

/**
 * Read-aloud support.
 *
 * A large share of the farmers this app is for read slowly or not at all. Every
 * screen exposes a "Listen" button that speaks a short summary of what is on it.
 * Uses the browser's built-in speech synthesis, so it needs no network and no
 * dependency; if the device has no voice for the chosen language we say so
 * rather than silently doing nothing.
 */

export const speechSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window

let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return []
  const voices = window.speechSynthesis.getVoices()
  if (voices.length) cachedVoices = voices
  return cachedVoices
}

if (speechSupported()) {
  loadVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    loadVoices()
  })
}

function pickVoice(language: Language): SpeechSynthesisVoice | undefined {
  const voices = loadVoices()
  const wanted = language === 'ta' ? 'ta' : 'en'
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith(language === 'ta' ? 'ta-in' : 'en-in')) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(wanted))
  )
}

/** True when the device actually has a voice that can read this language. */
export const hasVoiceFor = (language: Language): boolean => Boolean(pickVoice(language))

export function stopSpeaking(): void {
  if (!speechSupported()) return
  window.speechSynthesis.cancel()
}

export interface SpeakOptions {
  onEnd?: () => void
}

export function speak(text: string, language: Language, options: SpeakOptions = {}): boolean {
  if (!speechSupported() || !text.trim()) return false

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  const voice = pickVoice(language)
  if (voice) utterance.voice = voice
  utterance.lang = voice?.lang ?? (language === 'ta' ? 'ta-IN' : 'en-IN')
  // Slightly slower than default: these are numbers and place names being read
  // out to someone who may be walking to a bus stop while listening.
  utterance.rate = 0.92
  utterance.pitch = 1
  utterance.onend = () => options.onEnd?.()
  utterance.onerror = () => options.onEnd?.()

  window.speechSynthesis.speak(utterance)
  return true
}

/** Join screen fragments into one natural sentence stream for the reader. */
export const composeSpeech = (...parts: Array<string | number | false | null | undefined>): string =>
  parts
    .filter((part): part is string | number => part !== false && part !== null && part !== undefined)
    .map((part) => String(part).trim())
    .filter(Boolean)
    .join('. ')
