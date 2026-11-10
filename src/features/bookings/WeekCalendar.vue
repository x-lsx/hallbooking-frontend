<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarBooking } from '@/shared/api/types'
import { addDays, dayLabel, localParts, minuteTime, toMinutes, today } from '@/shared/lib/dates'
const props = defineProps<{
  week: string
  events: CalendarBooking[]
  openFrom: string
  openUntil: string
}>()
defineEmits<{ select: [date: string, time: string]; event: [id: number] }>()
const days = computed(() => Array.from({ length: 7 }, (_, i) => addDays(props.week, i)))
const opening = computed(() => Math.floor(toMinutes(props.openFrom) / 30) * 30)
const closing = computed(() => Math.ceil(toMinutes(props.openUntil) / 30) * 30)
const slots = computed(() =>
  Array.from(
    { length: Math.max(1, (closing.value - opening.value) / 30) },
    (_, i) => opening.value + i * 30,
  ),
)
function dayEvents(day: string) {
  const laneEnds: number[] = []
  const entries = props.events
    .filter(
      (event) => localParts(event.start_at).date <= day && localParts(event.end_at).date >= day,
    )
    .sort((a, b) => a.start_at.localeCompare(b.start_at))
    .map((event) => {
      const s = localParts(event.start_at)
      const e = localParts(event.end_at)
      const start = Math.max(opening.value, s.date < day ? 0 : toMinutes(s.time))
      const end = Math.min(closing.value, e.date > day ? 1440 : toMinutes(e.time))
      let lane = laneEnds.findIndex((value) => value <= start)
      if (lane < 0) lane = laneEnds.length
      laneEnds[lane] = end
      return { event, start, end, lane, time: `${s.time}–${e.time}` }
    })
    .filter((entry) => entry.end > entry.start)
  const count = Math.max(1, laneEnds.length)
  return entries.map((entry) => ({
    ...entry,
    style: {
      top: `${((entry.start - opening.value) / 30) * 28}px`,
      height: `${((entry.end - entry.start) / 30) * 28}px`,
      left: `calc(${(entry.lane / count) * 100}% + 3px)`,
      width: `calc(${100 / count}% - 6px)`,
    },
  }))
}
</script>
<template>
  <div class="calendar-scroll">
    <div class="week-calendar">
      <div class="calendar-time-heading">Время</div>
      <div
        v-for="day in days"
        :key="day"
        class="calendar-day-heading"
        :class="{ today: day === today() }"
      >
        {{ dayLabel(day) }}<span v-if="day === today()" class="today-dot" />
      </div>
      <div class="calendar-times">
        <div v-for="slot in slots" :key="slot" class="time-mark">
          {{ slot % 60 === 0 ? minuteTime(slot) : '' }}
        </div>
      </div>
      <div
        v-for="day in days"
        :key="day"
        class="calendar-day"
        :style="{ height: `${slots.length * 28}px` }"
      >
        <button
          v-for="slot in slots"
          :key="slot"
          type="button"
          class="calendar-slot"
          :class="{ 'whole-hour': slot % 60 === 0 }"
          :aria-label="`Выбрать ${day}, ${minuteTime(slot)}`"
          @click="$emit('select', day, minuteTime(slot))"
        /><button
          v-for="entry in dayEvents(day)"
          :key="entry.event.id"
          type="button"
          class="calendar-event"
          :class="entry.event.status"
          :style="entry.style"
          :aria-label="`${entry.event.title}, ${entry.time}`"
          @click.stop="$emit('event', entry.event.id)"
        >
          <span>{{ entry.time }}</span
          ><strong>{{ entry.event.title }}</strong
          ><small>{{
            entry.event.status === 'pending' ? 'На рассмотрении' : 'Подтверждено'
          }}</small>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-scroll {
  overflow-x: auto;
}
.week-calendar {
  display: grid;
  grid-template-columns: 46px repeat(7, minmax(83px, 1fr));
  min-width: 640px;
}
.calendar-time-heading {
  font-size: 8px;
  color: #a7a0b3;
  display: grid;
  place-items: center;
  border-top: 1px solid #eeeaf3;
  border-bottom: 1px solid #eeeaf3;
}
.calendar-day-heading {
  font-size: 10px;
  font-weight: 700;
  padding: 15px 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-transform: capitalize;
  border-top: 1px solid #eeeaf3;
  border-bottom: 1px solid #eeeaf3;
  color: #868091;
}
.calendar-day-heading.today {
  color: var(--accent);
  background: #f7f3fd;
}
.today-dot {
  display: inline-block;
  background: var(--accent);
  border-radius: 50%;
  width: 4px;
  height: 4px;
}
.calendar-times {
  padding: 0 5px;
  text-align: center;
}
.time-mark {
  height: 28px;
  font-size: 8px;
  color: #a7a0b2;
  line-height: 1.3;
  padding-top: 5px;
}
.calendar-day {
  position: relative;
  border-left: 1px solid #f0edf5;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 55px,
    #f4f2f7 55px,
    #f4f2f7 56px
  );
}
.calendar-slot {
  width: 100%;
  height: 28px;
  background: transparent;
  border: 0;
  display: block;
  padding: 0;
}
.calendar-slot:hover {
  background: #f0eafc;
}
.calendar-slot:focus-visible {
  outline-offset: -3px;
  position: relative;
  z-index: 2;
}
.calendar-event {
  position: absolute;
  border: 0;
  border-left: 3px solid #ae93d3;
  border-radius: 4px;
  background: #eee7f8;
  padding: 7px 5px;
  text-align: left;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #78628f;
  z-index: 3;
  min-height: 18px;
}
.calendar-event.pending {
  background: #fcf4e2;
  border-color: #dec087;
  color: #9b8257;
}
.calendar-event span {
  font-size: 8px;
  white-space: nowrap;
}
.calendar-event strong {
  font-size: 9px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.calendar-event small {
  font-size: 7px;
  opacity: 0.7;
}
.calendar-event:hover {
  filter: brightness(0.97);
}
</style>
