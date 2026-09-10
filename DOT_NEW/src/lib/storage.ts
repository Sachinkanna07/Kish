/**
 * localStorage wrapper that never throws — private browsing, quota limits and
 * disabled storage all degrade to in-memory for the session.
 */
const memory = new Map<string, string>()

let available: boolean | null = null

function canUseStorage(): boolean {
  if (available !== null) return available
  try {
    const probe = '__dot_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    available = true
  } catch {
    available = false
  }
  return available
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = canUseStorage() ? window.localStorage.getItem(key) : memory.get(key) ?? null
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    const raw = JSON.stringify(value)
    if (canUseStorage()) window.localStorage.setItem(key, raw)
    else memory.set(key, raw)
  } catch {
    /* nothing sensible to do — the prototype keeps working from memory */
  }
}

export function removeKey(key: string): void {
  try {
    if (canUseStorage()) window.localStorage.removeItem(key)
    else memory.delete(key)
  } catch {
    /* ignore */
  }
}

export const STORAGE_KEYS = {
  language: 'dot.language',
  scale: 'dot.textScale',
  voice: 'dot.voice',
  state: 'dot.state.v1',
} as const
