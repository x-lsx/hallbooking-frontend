import { describe, expect, it } from 'vitest'
import { bookingSchema, validateRoomSlot } from './validation'
const data = {
  title: 'Лекция',
  event_format_id: 1,
  department_id: 2,
  attendees_count: 20,
  date: '2030-11-10',
  start: '10:00',
  end: '10:45',
  is_public: true,
}
const room = { capacity: 20, open_from: '08:00:00', open_until: '20:00:00' }
describe('Заявка', () => {
  it('принимает ровно 45 минут и полную вместимость', () => {
    expect(bookingSchema.safeParse(data).success).toBe(true)
    expect(() => validateRoomSlot(data, room, 0)).not.toThrow()
  })
  it.each([
    { title: '  ' },
    { attendees_count: 0 },
    { attendees_count: 1.5 },
    { end: '10:30' },
    { end: '09:00' },
    { start: '10:01' },
    { end: '10:46' },
    { department_id: 0 },
    { event_format_id: 0 },
    { date: '' },
    { start: '25:00' },
  ])('отклоняет некорректные поля %o', (change) => {
    expect(bookingSchema.safeParse({ ...data, ...change }).success).toBe(false)
  })
  it('отклоняет превышение вместимости', () => {
    expect(() => validateRoomSlot({ ...data, attendees_count: 21 }, room, 0)).toThrow('мест')
  })
  it('отклоняет время вне часов работы', () => {
    expect(() => validateRoomSlot({ ...data, start: '07:45' }, room, 0)).toThrow('часов')
    expect(() => validateRoomSlot({ ...data, end: '20:15' }, room, 0)).toThrow('часов')
  })
  it('разрешает точные границы рабочего дня', () => {
    expect(() => validateRoomSlot({ ...data, start: '08:00', end: '20:00' }, room, 0)).not.toThrow()
  })
  it('отклоняет начало в прошлом и прямо сейчас', () => {
    const instant = Date.parse('2030-11-10T05:00:00Z')
    expect(() => validateRoomSlot(data, room, instant)).toThrow('прошедшее')
    expect(() => validateRoomSlot(data, room, instant + 1)).toThrow('прошедшее')
  })
})
