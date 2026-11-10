import { http, isForbidden, publicHttp } from './client'
import type {
  Booking,
  Building,
  CalendarBooking,
  Department,
  EventFormat,
  OnlineBooking,
  Profile,
  Registration,
  Room,
  RoomFilters,
  RoomPage,
  Tokens,
} from './types'
export const authApi = {
  login: async (data: { email: string; password: string }) =>
    (await publicHttp.post<Tokens>('/auth/login', data)).data,
  register: async (data: Registration) =>
    (await publicHttp.post<Tokens>('/auth/register', data)).data,
  logout: async (refresh_token: string) => {
    await publicHttp.post('/auth/logout', { refresh_token })
  },
}
export const api = {
  profile: async (signal?: AbortSignal) =>
    (await http.get<Profile>('/user/profile', { signal })).data,
  rooms: async (params: RoomFilters, signal?: AbortSignal) =>
    (await http.get<RoomPage>('/rooms', { params, signal, paramsSerializer: { indexes: null } }))
      .data,
  room: async (id: number, signal?: AbortSignal) =>
    (await http.get<Room>(`/rooms/${id}`, { signal })).data,
  buildings: async (signal?: AbortSignal) =>
    (await http.get<Building[]>('/buildings', { signal })).data,
  formats: async (signal?: AbortSignal) =>
    (await http.get<EventFormat[]>('/event-formats', { signal })).data,
  departments: async (signal?: AbortSignal) =>
    (await http.get<Department[]>('/departments', { signal })).data,
  calendar: async (id: number, start_at: string, end_at: string, signal?: AbortSignal) =>
    (
      await http.get<CalendarBooking[]>(`/rooms/${id}/bookings`, {
        params: { start_at, end_at },
        signal,
      })
    ).data,
  booking: async (id: number, signal?: AbortSignal) =>
    (await http.get<Booking>(`/bookings/${id}`, { signal })).data,
  createBooking: async (data: OnlineBooking) => (await http.post<Booking>('/bookings', data)).data,
  action: async (id: number, action: 'approve' | 'reject' | 'cancel', reason?: string) =>
    (
      await http.post<Booking>(
        `/bookings/${id}/${action}`,
        action === 'reject' ? { reject_reason: reason } : undefined,
      )
    ).data,
  canModerate: async (id: number, signal?: AbortSignal) => {
    try {
      await http.get(`/rooms/${id}/moderators`, { signal })
      return true
    } catch (error) {
      if (isForbidden(error)) return false
      throw error
    }
  },
}
