<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Message from 'primevue/message'
import InputText from 'primevue/inputtext'
import { useCanModerate, useRooms } from '@/features/data'
import { api } from '@/shared/api/endpoints'
import BookingDetails from '@/features/bookings/BookingDetails.vue'
import WeekCalendar from '@/features/bookings/WeekCalendar.vue'
import BookingStatus from '@/shared/ui/BookingStatus.vue'
import Feedback from '@/shared/ui/Feedback.vue'
import { addDays, formatDate, monday, today, zonedIso } from '@/shared/lib/dates'
const filters = ref({ page: 1, size: 100 })
const {
  data: rooms,
  isPending: roomsPending,
  error: roomsError,
  refetch: reloadRooms,
} = useRooms(filters)
const roomId = ref(0)
const room = computed(() => rooms.value?.items.find((value) => value.id === roomId.value))
const options = computed(() =>
  (rooms.value?.items || []).map((room) => ({
    id: room.id,
    label: `${room.name || 'Аудитория ' + room.number} · корпус ${room.building.number}`,
  })),
)
const permission = useCanModerate(roomId)
const date = ref(today())
const week = computed(() => monday(date.value))
const selected = ref<number | null>(null)
const calendar = useQuery({
  queryKey: computed(() => ['calendar', roomId.value, week.value]),
  queryFn: ({ signal }) =>
    api.calendar(
      roomId.value,
      zonedIso(week.value, '00:00'),
      zonedIso(addDays(week.value, 7), '00:00'),
      signal,
    ),
  enabled: computed(() => permission.data.value === true),
  refetchInterval: 30000,
})
watch(roomId, () => {
  selected.value = null
})
const pending = computed(
  () => calendar.data.value?.filter((booking) => booking.status === 'pending') || [],
)
</script>
<template>
  <section>
    <div class="page-heading">
      <div>
        <div class="eyebrow">ДЛЯ МЕНЕДЖЕРОВ ЗАЛОВ</div>
        <h1>Модерация<span class="heading-dot">.</span></h1>
        <p class="muted">Рассматривайте заявки и планируйте расписание своих пространств.</p>
      </div>
    </div>
    <div class="section-tabs">
      <RouterLink to="/bookings">Мои заявки</RouterLink
      ><RouterLink to="/moderation" class="active">Модерация залов</RouterLink>
    </div>
    <div class="moderation-filters">
      <div class="field">
        <label for="moder-room">Выберите зал</label
        ><Select
          input-id="moder-room"
          v-model="roomId"
          :options="options"
          option-label="label"
          option-value="id"
          placeholder="Выберите зал, которым управляете"
        />
      </div>
      <div class="field">
        <label for="moder-date">Неделя</label
        ><InputText id="moder-date" v-model="date" type="date" />
      </div>
    </div>
    <Feedback :loading="roomsPending" :error="roomsError" @retry="reloadRooms()" /><Message
      v-if="rooms && rooms.total > rooms.items.length"
      severity="info"
      :closable="false"
      >Доступны первые {{ rooms.items.length }} залов каталога. Полный список назначенных залов
      требует отдельной ручки API.</Message
    >
    <div v-if="!roomId" class="state">
      <i class="pi pi-building" />
      <p>Выберите зал, чтобы открыть очередь заявок.</p>
      <span class="small muted">Права проверяются сервером для каждого зала.</span>
    </div>
    <Feedback
      v-else
      :loading="permission.isPending.value"
      :error="permission.error.value"
      @retry="permission.refetch()"
    /><Message
      v-if="roomId && permission.data.value === false && !permission.isPending.value"
      severity="warn"
      :closable="false"
      >У вас нет прав менеджера этого зала. Выберите другой зал.</Message
    ><template v-if="room && permission.data.value === true && date"
      ><div class="results-bar">
        <h2>
          На рассмотрении <span class="count-pill">{{ pending.length }}</span>
        </h2>
        <span class="small muted">{{ formatDate(week) }} — {{ formatDate(addDays(week, 6)) }}</span>
      </div>
      <Feedback
        :loading="calendar.isPending.value"
        :error="calendar.error.value"
        @retry="calendar.refetch()"
      />
      <div v-if="pending.length" class="pending-cards">
        <button
          v-for="booking in pending"
          :key="booking.id"
          type="button"
          @click="selected = booking.id"
        >
          <BookingStatus :status="booking.status" /><strong>{{ booking.title }}</strong
          ><span>Открыть заявку № {{ booking.id }} <i class="pi pi-arrow-up-right" /></span>
        </button>
      </div>
      <Message
        v-else-if="!calendar.isPending.value && !calendar.error.value"
        severity="success"
        :closable="false"
        >На этой неделе нет заявок, ожидающих решения.</Message
      >
      <section v-if="!calendar.isPending.value && !calendar.error.value" class="calendar-panel">
        <div class="calendar-toolbar">
          <h2>Календарь зала</h2>
          <div class="button-row">
            <Button
              icon="pi pi-chevron-left"
              aria-label="Предыдущая неделя"
              severity="secondary"
              variant="outlined"
              @click="date = addDays(date, -7)"
            /><Button
              icon="pi pi-chevron-right"
              aria-label="Следующая неделя"
              severity="secondary"
              variant="outlined"
              @click="date = addDays(date, 7)"
            />
          </div>
        </div>
        <WeekCalendar
          :week="week"
          :events="calendar.data.value || []"
          :open-from="room.open_from"
          :open-until="room.open_until"
          @event="selected = $event"
        />
        <p class="calendar-hint">
          Нажмите на событие, чтобы одобрить, отклонить или отменить заявку. В календаре доступны
          ожидающие и подтверждённые заявки.
        </p>
      </section></template
    ><BookingDetails :id="selected" @close="selected = null" @changed="calendar.refetch()" />
  </section>
</template>
