import { defineStore } from 'pinia'
import { computed } from 'vue'
import { tokens, setTokens } from '@/shared/api/session'
import { authApi } from '@/shared/api/endpoints'
import type { Tokens } from '@/shared/api/types'
import { queryClient } from '@/app/query'
export const useAuthStore = defineStore('auth', () => {
  const authenticated = computed(() => Boolean(tokens.value))
  async function accept(value: Tokens) {
    await queryClient.cancelQueries()
    queryClient.clear()
    setTokens(value)
  }
  async function logout() {
    const previous = tokens.value
    setTokens(null)
    await queryClient.cancelQueries()
    queryClient.clear()
    if (previous) await authApi.logout(previous.refresh_token)
  }
  return { authenticated, accept, logout }
})
