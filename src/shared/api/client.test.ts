import { afterEach, describe, expect, it } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { http, publicHttp } from './client'
import { setTokens, tokens } from './session'
const original = http.defaults.adapter
const originalPublic = publicHttp.defaults.adapter
const token = {
  access_token: 'old',
  refresh_token: 'refresh',
  token_type: 'bearer',
  expires_in: 900,
  refresh_expires_in: 6000,
}
function response(config: InternalAxiosRequestConfig, data: unknown) {
  return { data, status: 200, statusText: 'OK', headers: new AxiosHeaders(), config }
}
afterEach(() => {
  http.defaults.adapter = original
  publicHttp.defaults.adapter = originalPublic
  setTokens(null)
})
describe('Сессия API', () => {
  it('обновляет токен один раз для параллельных 401', async () => {
    setTokens(token)
    let refreshCount = 0
    publicHttp.defaults.adapter = (async (config) => {
      refreshCount++
      await new Promise((resolve) => setTimeout(resolve, 20))
      return response(config, { ...token, access_token: 'new' })
    }) satisfies AxiosAdapter
    http.defaults.adapter = (async (config) => {
      if (config.headers.Authorization !== 'Bearer new')
        throw new AxiosError('expired', 'ERR_BAD_REQUEST', config, undefined, {
          ...response(config, {}),
          status: 401,
        })
      return response(config, { ok: true })
    }) satisfies AxiosAdapter
    const result = await Promise.all([http.get('/one'), http.get('/two')])
    expect(result).toHaveLength(2)
    expect(refreshCount).toBe(1)
    expect(tokens.value?.access_token).toBe('new')
  })
  it('очищает сессию при отказе refresh', async () => {
    setTokens(token)
    publicHttp.defaults.adapter = async () => {
      throw new Error('revoked')
    }
    http.defaults.adapter = async (config) => {
      throw new AxiosError('expired', 'ERR_BAD_REQUEST', config, undefined, {
        ...response(config, {}),
        status: 401,
      })
    }
    await expect(http.get('/private')).rejects.toThrow('revoked')
    expect(tokens.value).toBeNull()
  })
  it('не восстанавливает старую сессию и не сбрасывает новый вход при позднем refresh', async () => {
    setTokens(token)
    let release = () => {}
    let signalStarted = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const started = new Promise<void>((resolve) => {
      signalStarted = resolve
    })
    publicHttp.defaults.adapter = async (config) => {
      signalStarted()
      await gate
      return response(config, { ...token, access_token: 'old-session-refreshed' })
    }
    http.defaults.adapter = async (config) => {
      throw new AxiosError('expired', 'ERR_BAD_REQUEST', config, undefined, {
        ...response(config, {}),
        status: 401,
      })
    }
    const pending = expect(http.get('/private')).rejects.toThrow('Сессия изменена')
    await started
    setTokens({ ...token, access_token: 'different-user' })
    release()
    await pending
    expect(tokens.value?.access_token).toBe('different-user')
  })
})
