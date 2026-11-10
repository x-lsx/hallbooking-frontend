import { shallowRef } from 'vue'
import type { Tokens } from './types'
const key = 'zalbook.session'
function restore(): Tokens | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) || 'null')
    if (
      value &&
      typeof value === 'object' &&
      'access_token' in value &&
      typeof value.access_token === 'string' &&
      'refresh_token' in value &&
      typeof value.refresh_token === 'string'
    )
      return value as Tokens
  } catch {
    /* Недоступное хранилище не блокирует вход. */
  }
  return null
}
export const tokens = shallowRef<Tokens | null>(restore())
export let sessionRevision = 0
export function setTokens(value: Tokens | null, rotation = false) {
  if (!rotation) sessionRevision++
  tokens.value = value
  try {
    if (value) sessionStorage.setItem(key, JSON.stringify(value))
    else sessionStorage.removeItem(key)
  } catch {
    /* Работаем до закрытия вкладки. */
  }
}
export function expireSession() {
  setTokens(null)
  window.dispatchEvent(new Event('session-expired'))
}
