import { describe, expect, it } from 'vitest'
import { addDays, localParts, monday, minuteTime, toMinutes, zonedIso } from './dates'
describe('Время корпуса', () => {
  it('отправляет время Екатеринбурга в UTC независимо от пояса браузера', () => {
    expect(zonedIso('2030-11-10', '10:15', 'Asia/Yekaterinburg')).toBe('2030-11-10T05:15:00.000Z')
  })
  it('сохраняет выбранное местное время при обратном преобразовании', () => {
    expect(localParts(zonedIso('2030-01-01', '00:00'), 'Asia/Yekaterinburg')).toMatchObject({
      date: '2030-01-01',
      time: '00:00',
    })
  })
  it('учитывает летний и зимний пояс', () => {
    expect(zonedIso('2030-07-01', '12:00', 'Europe/Berlin')).toBe('2030-07-01T10:00:00.000Z')
    expect(zonedIso('2030-01-01', '12:00', 'Europe/Berlin')).toBe('2030-01-01T11:00:00.000Z')
  })
  it('отклоняет несуществующее местное время перехода на летний пояс', () => {
    expect(() => zonedIso('2030-03-31', '02:30', 'Europe/Berlin')).toThrow()
  })
  it('отклоняет некорректное время', () => {
    expect(() => zonedIso('bad', '10:00')).toThrow()
  })
  it('показывает понедельник для воскресенья и понедельника', () => {
    expect(monday('2026-11-15')).toBe('2026-11-09')
    expect(monday('2026-11-09')).toBe('2026-11-09')
  })
  it('перелистывает недели через границу года', () => {
    expect(addDays('2030-12-30', 7)).toBe('2031-01-06')
    expect(addDays('2031-01-06', -7)).toBe('2030-12-30')
  })
  it('преобразует минуты в часы и обратно', () => {
    expect(toMinutes('08:15:00')).toBe(495)
    expect(minuteTime(495)).toBe('08:15')
    expect(minuteTime(0)).toBe('00:00')
  })
})
