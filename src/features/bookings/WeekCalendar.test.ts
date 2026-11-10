import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WeekCalendar from './WeekCalendar.vue'
const props = {
  week: '2030-11-11',
  events: [
    {
      id: 7,
      title: 'Лекция',
      start_at: '2030-11-11T05:00:00Z',
      end_at: '2030-11-11T06:00:00Z',
      status: 'approved' as const,
    },
  ],
  openFrom: '08:00:00',
  openUntil: '20:00:00',
}
describe('Недельный календарь', () => {
  it('показывает событие и открывает его по ID', async () => {
    const wrapper = mount(WeekCalendar, { props })
    expect(wrapper.text()).toContain('Лекция')
    await wrapper.get('.calendar-event').trigger('click')
    expect(wrapper.emitted('event')).toEqual([[7]])
  })
  it('передаёт выбранные дату и местное время', async () => {
    const wrapper = mount(WeekCalendar, { props })
    await wrapper.get('.calendar-slot').trigger('click')
    expect(wrapper.emitted('select')).toEqual([['2030-11-11', '08:00']])
  })
  it('не накладывает пересекающиеся ожидающие заявки друг на друга', () => {
    const wrapper = mount(WeekCalendar, {
      props: {
        ...props,
        events: [...props.events, { ...props.events[0]!, id: 8, status: 'pending' }],
      },
    })
    const buttons = wrapper.findAll('.calendar-event')
    expect(buttons).toHaveLength(2)
    expect(buttons[0]!.attributes('style')).not.toBe(buttons[1]!.attributes('style'))
  })
})
