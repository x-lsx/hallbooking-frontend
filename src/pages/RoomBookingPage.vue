<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import Feedback from '@/shared/ui/Feedback.vue'
import WeekCalendar from '@/features/bookings/WeekCalendar.vue'
import BookingDetails from '@/features/bookings/BookingDetails.vue'
import { useDepartments, useFormats, useProfile, useRoom } from '@/features/data'
import { bookingSchema, validateRoomSlot } from '@/features/bookings/validation'
import { useJournal } from '@/features/bookings/journal'
import { api } from '@/shared/api/endpoints'
import { errorText } from '@/shared/api/client'
import {
  addDays,
  buildingZone,
  formatDate,
  minuteTime,
  monday,
  today,
  toMinutes,
  zonedIso,
} from '@/shared/lib/dates'
const route = useRoute()
const roomId = computed(() => Number(route.params.id))
const {
  data: room,
  error: roomError,
  isPending: roomLoading,
  refetch: reloadRoom,
} = useRoom(roomId)
const { data: profile } = useProfile()
const { data: departments, error: depError, refetch: reloadDeps } = useDepartments()
const { data: formats, error: formatsError, refetch: reloadFormats } = useFormats()
const allowedFormats = computed(() =>
  room.value?.event_formats.length ? room.value.event_formats : formats.value || [],
)
const week = ref(monday(today()))
const calendar = useQuery({
  queryKey: computed(() => ['calendar', roomId.value, week.value]),
  queryFn: ({ signal }) =>
    api.calendar(
      roomId.value,
      zonedIso(week.value, '00:00'),
      zonedIso(addDays(week.value, 7), '00:00'),
      signal,
    ),
  enabled: computed(() => Boolean(room.value)),
  refetchInterval: 60000,
})
const client = useQueryClient()
const selected = ref<number | null>(null)
const result = ref<{ id: number; title: string } | null>(null)
const submitError = ref('')
const journal = useJournal(() => profile.value?.id)
const { defineField, errors, handleSubmit, isSubmitting, setFieldValue, resetForm } = useForm({
  validationSchema: toTypedSchema(bookingSchema),
  initialValues: {
    title: '',
    attendees_count: 1,
    date: today(),
    start: '10:00',
    end: '11:00',
    is_public: true,
  },
})
const [title, titleAttrs] = defineField('title')
const [eventFormat] = defineField('event_format_id')
const [department] = defineField('department_id')
const [count] = defineField('attendees_count')
const [date] = defineField('date')
const [start] = defineField('start')
const [end] = defineField('end')
const [isPublic] = defineField('is_public')
watch(
  () => profile.value?.department?.id,
  (id) => {
    if (id) setFieldValue('department_id', id)
  },
  { immediate: true },
)
watch(roomId, () => {
  resetForm()
  week.value = monday(today())
  result.value = null
  submitError.value = ''
})
function pickSlot(day: string, time: string) {
  if (result.value) result.value = null
  setFieldValue('date', day)
  setFieldValue('start', time)
  setFieldValue('end', minuteTime(Math.min(toMinutes(time) + 45, 1439)))
}
const create = useMutation({ mutationFn: api.createBooking })
const submit = handleSubmit(async (values) => {
  if (!room.value) return
  submitError.value = ''
  result.value = null
  try {
    validateRoomSlot(values, room.value)
    const booking = await create.mutateAsync({
      title: values.title,
      room_id: roomId.value,
      event_format_id: values.event_format_id,
      department_id: values.department_id,
      attendees_count: values.attendees_count,
      start_at: zonedIso(values.date, values.start),
      end_at: zonedIso(values.date, values.end),
      is_public: values.is_public,
    })
    journal.remember(booking.id)
    result.value = { id: booking.id, title: booking.title }
    await client.invalidateQueries({ queryKey: ['calendar', roomId.value] })
    await client.invalidateQueries({ queryKey: ['journal'] })
  } catch (cause) {
    submitError.value = errorText(cause)
  }
})
</script>
<template>
  <section>
    <RouterLink to="/rooms" class="back-link"><i class="pi pi-arrow-left" /> Все залы</RouterLink>
    <div class="page-heading compact">
      <div>
        <div class="eyebrow">ЗАПЛАНИРУЙТЕ ВСТРЕЧУ</div>
        <h1>Подать заявку<span class="heading-dot">.</span></h1>
        <p class="muted">Выберите свободное время и расскажите о мероприятии.</p>
      </div>
    </div>
    <Feedback :loading="roomLoading" :error="roomError" @retry="reloadRoom()" /><template
      v-if="room && !roomError"
      ><div class="room-summary">
        <div class="summary-room-number">{{ room.number }}</div>
        <div>
          <h2>{{ room.name || `Аудитория ${room.number}` }}</h2>
          <p class="muted">
            Корпус {{ room.building.number }}
            <span v-if="room.building.address">· {{ room.building.address }}</span>
          </p>
        </div>
        <div class="summary-fact">
          <i class="pi pi-users" />
          <div>
            <strong>{{ room.capacity }} мест</strong><span>вместимость</span>
          </div>
        </div>
        <div class="summary-fact">
          <i class="pi pi-clock" />
          <div>
            <strong>{{ room.open_from.slice(0, 5) }}–{{ room.open_until.slice(0, 5) }}</strong
            ><span>часы работы</span>
          </div>
        </div>
      </div>
      <div class="booking-layout">
        <section class="calendar-panel">
          <div class="calendar-toolbar">
            <div>
              <h2>Расписание зала</h2>
              <span class="small muted"
                >{{ formatDate(week) }} — {{ formatDate(addDays(week, 6)) }}</span
              >
            </div>
            <div class="button-row">
              <Button
                icon="pi pi-chevron-left"
                severity="secondary"
                variant="outlined"
                size="small"
                aria-label="Предыдущая неделя"
                @click="week = addDays(week, -7)"
              /><Button
                label="Сегодня"
                severity="secondary"
                variant="outlined"
                size="small"
                @click="week = monday(today())"
              /><Button
                icon="pi pi-chevron-right"
                severity="secondary"
                variant="outlined"
                size="small"
                aria-label="Следующая неделя"
                @click="week = addDays(week, 7)"
              />
            </div>
          </div>
          <div class="calendar-legend">
            <span><i class="legend-dot approved" /> Подтверждено</span
            ><span><i class="legend-dot pending" /> На рассмотрении</span
            ><span class="muted">{{ buildingZone }}</span>
          </div>
          <Feedback
            :loading="calendar.isPending.value"
            :error="calendar.error.value"
            @retry="calendar.refetch()"
          /><WeekCalendar
            v-if="!calendar.isPending.value && !calendar.error.value"
            :week="week"
            :events="calendar.data.value || []"
            :open-from="room.open_from"
            :open-until="room.open_until"
            @select="pickSlot"
            @event="selected = $event"
          />
          <p class="calendar-hint">
            <i class="pi pi-info-circle" /> Нажмите на свободный интервал, чтобы выбрать время.
            Заявка ожидает подтверждения менеджером.
          </p>
        </section>
        <aside class="booking-form-panel">
          <div v-if="result" class="success-panel" role="status">
            <span class="success-icon"><i class="pi pi-check" /></span
            ><span class="eyebrow">ЗАЯВКА № {{ result.id }}</span>
            <h2>Первый шаг сделан!</h2>
            <p>
              Заявка «{{ result.title }}» отправлена менеджеру зала. После одобрения время будет
              забронировано.
            </p>
            <Button label="Посмотреть заявку" fluid @click="selected = result.id" /><RouterLink
              to="/bookings"
              class="text-link"
              >К моим заявкам <i class="pi pi-arrow-right" /></RouterLink
            ><Button
              label="Ещё одна заявка"
              severity="secondary"
              variant="text"
              fluid
              @click="result = null"
            />
          </div>
          <form v-else class="form-stack" @submit.prevent="submit" novalidate>
            <div>
              <span class="eyebrow">ВАШЕ МЕРОПРИЯТИЕ</span>
              <h2>Оставим место<br />для вашей идеи</h2>
            </div>
            <Message v-if="submitError" severity="error" :closable="false">{{
              submitError
            }}</Message
            ><Feedback v-if="depError" :error="depError" @retry="reloadDeps()" /><Feedback
              v-if="formatsError"
              :error="formatsError"
              @retry="reloadFormats()"
            />
            <div class="field">
              <label for="title">Название *</label
              ><InputText
                id="title"
                v-model="title"
                v-bind="titleAttrs"
                placeholder="Например, встреча киноклуба"
                :maxlength="128"
                :invalid="!!errors.title"
              /><small class="field-error">{{ errors.title }}</small>
            </div>
            <div class="field">
              <label for="event-format">Формат *</label
              ><Select
                input-id="event-format"
                v-model="eventFormat"
                :options="allowedFormats"
                option-label="name"
                option-value="id"
                placeholder="Выберите формат"
                :invalid="!!errors.event_format_id"
              /><small class="field-error">{{ errors.event_format_id }}</small>
            </div>
            <div class="field">
              <label for="department">Подразделение *</label
              ><Select
                input-id="department"
                v-model="department"
                :options="departments || []"
                option-label="name"
                option-value="id"
                placeholder="Выберите подразделение"
                :invalid="!!errors.department_id"
              /><small class="field-error">{{ errors.department_id }}</small>
            </div>
            <div class="field">
              <label for="date">Дата *</label
              ><InputText
                id="date"
                v-model="date"
                type="date"
                :min="today()"
                :invalid="!!errors.date"
                @change="date && (week = monday(date))"
              /><small class="field-error">{{ errors.date }}</small>
            </div>
            <div class="form-pair">
              <div class="field">
                <label for="start">Начало *</label
                ><InputText
                  id="start"
                  v-model="start"
                  type="time"
                  step="900"
                  :min="room.open_from.slice(0, 5)"
                  :max="room.open_until.slice(0, 5)"
                  :invalid="!!errors.start"
                /><small class="field-error">{{ errors.start }}</small>
              </div>
              <div class="field">
                <label for="end">Окончание *</label
                ><InputText
                  id="end"
                  v-model="end"
                  type="time"
                  step="900"
                  :min="room.open_from.slice(0, 5)"
                  :max="room.open_until.slice(0, 5)"
                  :invalid="!!errors.end"
                /><small class="field-error">{{ errors.end }}</small>
              </div>
            </div>
            <div class="field">
              <label for="count">Количество участников *</label
              ><InputNumber
                input-id="count"
                v-model="count"
                :min="1"
                :max="room.capacity"
                :use-grouping="false"
                fluid
                :invalid="!!errors.attendees_count"
              /><small class="field-error">{{ errors.attendees_count }}</small>
            </div>
            <div class="checkbox-field">
              <Checkbox input-id="public" v-model="isPublic" binary /><label for="public"
                >Показывать название в календаре</label
              >
            </div>
            <p class="small muted">
              Минимум 45 минут, шаг — 15 минут. Все часы указаны по времени корпуса.
            </p>
            <Button
              type="submit"
              label="Подать заявку"
              icon="pi pi-arrow-right"
              icon-pos="right"
              :loading="isSubmitting"
              :disabled="!room.is_active || !!depError || !!formatsError"
              fluid
            />
          </form>
        </aside></div></template
    ><BookingDetails :id="selected" @close="selected = null" />
  </section>
</template>
