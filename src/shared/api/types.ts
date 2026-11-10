import type { components } from './schema'
type Schemas = components['schemas']
export type Room = Schemas['RoomResponse']
export type RoomPage = Schemas['PaginatedResponse_RoomResponse_']
export type Building = Schemas['BuildingResponse']
export type Department = Schemas['DepartmentResponse']
export type EventFormat = Schemas['EventFormatResponse']
export type Profile = Schemas['UserResponse']
export type Booking = Schemas['BookingResponse']
export type CalendarBooking = Schemas['BookingCalendarResponse']
export type OnlineBooking = Schemas['BookingOnlineCreate']
export type Registration = Schemas['UserCreate']
export type Tokens = Schemas['TokenResponse']
export interface RoomFilters {
  building_id?: number
  capacity_min?: number
  type?: string
  formats_ids?: number[]
  page: number
  size: number
}
