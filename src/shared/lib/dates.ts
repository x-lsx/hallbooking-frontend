export const buildingZone = import.meta.env.VITE_BUILDING_TIMEZONE || 'Asia/Yekaterinburg'
export function localParts(instant: string | Date, zone = buildingZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(instant))
  const field = (name: string) => parts.find((p) => p.type === name)?.value || '00'
  return {
    date: `${field('year')}-${field('month')}-${field('day')}`,
    time: `${field('hour')}:${field('minute')}`,
    second: field('second'),
  }
}
export function today(zone = buildingZone) {
  return localParts(new Date(), zone).date
}
export function addDays(date: string, count: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + count)
  return value.toISOString().slice(0, 10)
}
export function monday(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay()
  return addDays(date, -((day + 6) % 7))
}
export function toMinutes(time: string) {
  const [h = 0, m = 0] = time.split(':').map(Number)
  return h * 60 + m
}
export function minuteTime(minutes: number) {
  return `${Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`
}
export function zonedIso(date: string, time: string, zone = buildingZone) {
  const expected = Date.parse(`${date}T${time}:00Z`)
  if (!Number.isFinite(expected)) throw new Error('Укажите корректные дату и время')
  let candidate = expected
  for (let i = 0; i < 4; i++) {
    const p = localParts(new Date(candidate), zone)
    const represented = Date.parse(`${p.date}T${p.time}:${p.second}Z`)
    const delta = expected - represented
    if (delta === 0) return new Date(candidate).toISOString()
    candidate += delta
  }
  throw new Error('Это местное время отсутствует в часовом поясе корпуса')
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`))
}
export function formatMoment(instant: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: buildingZone,
  }).format(new Date(instant))
}
export function dayLabel(date: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`))
}
