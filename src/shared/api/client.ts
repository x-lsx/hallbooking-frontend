import axios, { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import type { Tokens } from './types'
import { expireSession, sessionRevision, setTokens, tokens } from './session'
const options = { baseURL: import.meta.env.VITE_API_BASE_URL || '/api', timeout: 15000 }
export const publicHttp = axios.create(options)
export const http = axios.create(options)
type AuthConfig = InternalAxiosRequestConfig & { retried?: boolean; sessionRevision?: number }
const refreshes = new Map<number, Promise<string>>()
http.interceptors.request.use((config) => {
  const authenticated = config as AuthConfig
  authenticated.sessionRevision = sessionRevision
  if (tokens.value) config.headers.Authorization = `Bearer ${tokens.value.access_token}`
  return config
})
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as AuthConfig | undefined
    if (error.response?.status !== 401 || !config) return Promise.reject(error)
    // Не повторяем запрос от прежнего пользователя в новой сессии.
    if (config.sessionRevision !== sessionRevision) return Promise.reject(error)
    if (config.retried || !tokens.value) {
      expireSession()
      return Promise.reject(error)
    }
    config.retried = true
    const revision = sessionRevision
    try {
      if (config.headers.Authorization !== `Bearer ${tokens.value.access_token}`)
        return http(config)
      let refresh = refreshes.get(revision)
      if (!refresh) {
        refresh = publicHttp
          .post<Tokens>('/auth/refresh', { refresh_token: tokens.value.refresh_token })
          .then(({ data }) => {
            if (revision !== sessionRevision) throw new Error('Сессия изменена')
            setTokens(data, true)
            return data.access_token
          })
          .finally(() => {
            refreshes.delete(revision)
          })
        refreshes.set(revision, refresh)
      }
      config.headers.Authorization = `Bearer ${await refresh}`
      return http(config)
    } catch (cause) {
      if (revision === sessionRevision) expireSession()
      return Promise.reject(cause)
    }
  },
)
export function errorText(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (!error.response)
      return 'Не удалось связаться с сервером. Проверьте подключение и попробуйте снова.'
    if (error.response.status === 404) return 'Запись не найдена или у вас нет доступа.'
    return `Не удалось выполнить запрос (${error.response.status}). Попробуйте снова.`
  }
  return error instanceof Error ? error.message : 'Не удалось выполнить действие.'
}
export function isForbidden(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 403
}
