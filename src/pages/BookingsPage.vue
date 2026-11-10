<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQueries } from '@tanstack/vue-query'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import { useProfile } from '@/features/data'
import { useJournal } from '@/features/bookings/journal'
import BookingDetails from '@/features/bookings/BookingDetails.vue'
import BookingStatus from '@/shared/ui/BookingStatus.vue'
import Feedback from '@/shared/ui/Feedback.vue'
import { api } from '@/shared/api/endpoints'
import { formatMoment } from '@/shared/lib/dates'
const {
  data: profile,
  isPending: profilePending,
  error: profileError,
  refetch: reloadProfile,
} = useProfile()
const journal = useJournal(() => profile.value?.id)
const records = useQueries({
  queries: computed(() =>
    journal.ids().map((id) => ({
      queryKey: ['journal', profile.value?.id, id],
      queryFn: ({ signal }: { signal: AbortSignal }) => api.booking(id, signal),
      enabled: Boolean(profile.value),
    })),
  ),
})
const selected = ref<number | null>(null)
const lookup = ref<number | null>(null)
const status = ref('all')
const rows = computed(() =>
  records.value
    .flatMap((record) => (record.data ? [record.data] : []))
    .filter((row) => status.value === 'all' || row.status === status.value)
    .sort((a, b) => b.id - a.id),
)
const loading = computed(() => records.value.some((record) => record.isPending))
const failed = computed(() => records.value.some((record) => record.isError))
function reload() {
  records.value.forEach((record) => {
    void record.refetch()
  })
}
const tabs = [
  { value: 'all', label: 'Все' },
  { value: 'pending', label: 'На рассмотрении' },
  { value: 'approved', label: 'Подтверждённые' },
  { value: 'rejected', label: 'Отклонённые' },
  { value: 'canselled', label: 'Отменённые' },
]
</script>
<template>
  <section>
    <div class="page-heading">
      <div>
        <div class="eyebrow">ВАШИ ПЛАНЫ</div>
        <h1>Заявки<span class="heading-dot">.</span></h1>
        <p class="muted">Следите за встречами и управляйте своими бронированиями.</p>
      </div>
      <RouterLink to="/rooms" class="room-book-link compact-link"
        >Новая заявка <i class="pi pi-plus"
      /></RouterLink>
    </div>
    <div class="section-tabs">
      <RouterLink to="/bookings" class="active">Мои заявки</RouterLink
      ><RouterLink to="/moderation">Модерация залов <i class="pi pi-arrow-up-right" /></RouterLink>
    </div>
    <Message severity="info" :closable="false"
      >Здесь показаны заявки, отправленные из этого браузера. Полная история на других устройствах
      появится после добавления списка собственных заявок в API.</Message
    >
    <div class="bookings-toolbar">
      <div class="status-tabs" aria-label="Фильтр по статусу">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          :class="{ active: status === tab.value }"
          @click="status = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
      <form class="lookup-form" @submit.prevent="lookup && (selected = lookup)">
        <InputNumber
          v-model="lookup"
          input-id="booking-id"
          aria-label="Номер заявки"
          placeholder="Номер заявки"
          :min="1"
          :use-grouping="false"
        /><Button
          type="submit"
          icon="pi pi-search"
          severity="secondary"
          variant="outlined"
          aria-label="Открыть заявку по номеру"
          :disabled="!lookup"
        />
      </form>
    </div>
    <Feedback
      :loading="profilePending || loading"
      :error="profileError"
      :empty="!loading && !profilePending && !rows.length && !failed"
      empty-text="Здесь пока нет заявок. Самое время запланировать встречу."
      @retry="reloadProfile()"
    /><Message v-if="failed" severity="warn" :closable="false"
      >Часть заявок не удалось загрузить.
      <Button label="Повторить" size="small" severity="secondary" variant="text" @click="reload"
    /></Message>
    <div v-if="rows.length" class="booking-list">
      <button
        v-for="booking in rows"
        :key="booking.id"
        type="button"
        class="booking-list-item"
        @click="selected = booking.id"
      >
        <span class="booking-list-icon"><i class="pi pi-calendar" /></span
        ><span class="booking-list-main"
          ><small>ЗАЯВКА № {{ booking.id }}</small
          ><strong>{{ booking.title }}</strong
          ><span
            >{{ formatMoment(booking.start_at) }} · {{ booking.attendees_count }} участников</span
          ></span
        ><BookingStatus :status="booking.status" /><i class="pi pi-arrow-up-right" />
      </button>
    </div>
    <BookingDetails :id="selected" @close="selected = null" @changed="reload" />
  </section>
</template>
