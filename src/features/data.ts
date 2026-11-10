import { computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/shared/api/endpoints'
import { tokens } from '@/shared/api/session'
import type { RoomFilters } from '@/shared/api/types'
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: ({ signal }) => api.profile(signal),
    enabled: computed(() => Boolean(tokens.value)),
  })
}
export function useRooms(filters: Ref<RoomFilters>) {
  return useQuery({
    queryKey: computed(() => ['rooms', filters.value]),
    queryFn: ({ signal }) => api.rooms(filters.value, signal),
  })
}
export function useRoom(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['room', id.value]),
    queryFn: ({ signal }) => api.room(id.value, signal),
    enabled: computed(() => id.value > 0),
  })
}
export function useCanModerate(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['permission', id.value]),
    queryFn: ({ signal }) => api.canModerate(id.value, signal),
    enabled: computed(() => id.value > 0),
    retry: false,
    staleTime: 15000,
  })
}
export function useBuildings() {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: ({ signal }) => api.buildings(signal),
    staleTime: 300000,
  })
}
export function useFormats() {
  return useQuery({
    queryKey: ['formats'],
    queryFn: ({ signal }) => api.formats(signal),
    staleTime: 300000,
  })
}
export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: ({ signal }) => api.departments(signal),
    staleTime: 300000,
  })
}
