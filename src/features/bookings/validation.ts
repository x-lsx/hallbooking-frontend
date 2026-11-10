import { z } from 'zod'
import { toMinutes, zonedIso } from '@/shared/lib/dates'
export const bookingSchema = z
  .object({
    title: z.string().trim().min(1, 'Введите название').max(128, 'Не больше 128 символов'),
    event_format_id: z
      .number({ required_error: 'Выберите формат' })
      .int()
      .positive('Выберите формат'),
    department_id: z
      .number({ required_error: 'Выберите подразделение' })
      .int()
      .positive('Выберите подразделение'),
    attendees_count: z
      .number({ required_error: 'Укажите количество участников' })
      .int('Введите целое число')
      .positive('Минимум один участник'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Выберите дату'),
    start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Выберите начало'),
    end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Выберите окончание'),
    is_public: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (toMinutes(v.end) - toMinutes(v.start) < 45)
      ctx.addIssue({
        code: 'custom',
        path: ['end'],
        message: 'Продолжительность — минимум 45 минут',
      })
    for (const field of ['start', 'end'] as const)
      if (toMinutes(v[field]) % 15 !== 0)
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: 'Время должно быть кратно 15 минутам',
        })
  })
export function validateRoomSlot(
  value: z.infer<typeof bookingSchema>,
  room: { capacity: number; open_from: string; open_until: string },
  now = Date.now(),
) {
  if (value.attendees_count > room.capacity)
    throw new Error(`В зале не больше ${room.capacity} мест`)
  if (value.start < room.open_from.slice(0, 5) || value.end > room.open_until.slice(0, 5))
    throw new Error('Выберите время в пределах часов работы зала')
  if (Date.parse(zonedIso(value.date, value.start)) <= now)
    throw new Error('Нельзя подать заявку на прошедшее время')
}
