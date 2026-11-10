<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import { api } from '@/shared/api/endpoints'
import { errorText } from '@/shared/api/client'
import { useCanModerate, useProfile } from '@/features/data'
import { formatMoment } from '@/shared/lib/dates'
import Feedback from '@/shared/ui/Feedback.vue'
import BookingStatus from '@/shared/ui/BookingStatus.vue'
const props = defineProps<{ id: number | null }>()
const emit = defineEmits<{ close: []; changed: [] }>()
const {
  data: booking,
  isPending,
  error,
  refetch,
} = useQuery({
  queryKey: computed(() => ['booking', props.id]),
  queryFn: ({ signal }) => api.booking(props.id!, signal),
  enabled: computed(() => props.id !== null),
})
const { data: profile } = useProfile()
const roomId = computed(() => booking.value?.room_id || 0)
const { data: canModerate, error: permissionError } = useCanModerate(roomId)
const client = useQueryClient()
const reason = ref('')
const confirmation = ref<'reject' | 'cancel' | null>(null)
const actionError = ref('')
watch(
  () => props.id,
  () => {
    reason.value = ''
    confirmation.value = null
    actionError.value = ''
  },
)
const mutable = computed(
  () =>
    booking.value &&
    ['pending', 'approved'].includes(booking.value.status) &&
    Date.parse(booking.value.end_at) > Date.now(),
)
const canCancel = computed(
  () => mutable.value && (canModerate.value || booking.value?.created_by_id === profile.value?.id),
)
const action = useMutation({
  mutationFn: ({
    id,
    type,
    reason,
  }: {
    id: number
    type: 'approve' | 'reject' | 'cancel'
    reason?: string
  }) => api.action(id, type, reason),
  onSuccess: async (data) => {
    client.setQueryData(['booking', data.id], data)
    confirmation.value = null
    await client.invalidateQueries({ queryKey: ['calendar'] })
    await client.invalidateQueries({ queryKey: ['journal'] })
    emit('changed')
  },
})
async function execute(type: 'approve' | 'reject' | 'cancel') {
  if (!booking.value) return
  actionError.value = ''
  if (type === 'reject' && (!reason.value.trim() || reason.value.trim().length > 512)) {
    actionError.value = 'Укажите причину от 1 до 512 символов'
    return
  }
  try {
    await action.mutateAsync({ id: booking.value.id, type, reason: reason.value.trim() })
  } catch (cause) {
    actionError.value = errorText(cause)
  }
}
</script>
<template>
  <Dialog
    :visible="id !== null"
    modal
    header="Заявка"
    :style="{ width: '540px' }"
    :breakpoints="{ '600px': '94vw' }"
    @update:visible="!$event && emit('close')"
    ><Feedback :loading="isPending" :error="error" @retry="refetch()" />
    <div v-if="booking && !error" class="booking-detail">
      <div class="detail-heading">
        <span class="eyebrow">№ {{ booking.id }}</span
        ><BookingStatus :status="booking.status" />
      </div>
      <h2>{{ booking.title }}</h2>
      <dl class="detail-list">
        <div>
          <dt>Начало</dt>
          <dd>{{ formatMoment(booking.start_at) }}</dd>
        </div>
        <div>
          <dt>Окончание</dt>
          <dd>{{ formatMoment(booking.end_at) }}</dd>
        </div>
        <div>
          <dt>Участники</dt>
          <dd>{{ booking.attendees_count }} чел.</dd>
        </div>
        <div>
          <dt>Заявитель</dt>
          <dd>
            {{
              [
                booking.requester_last_name,
                booking.requester_first_name,
                booking.requester_middle_name,
              ]
                .filter(Boolean)
                .join(' ')
            }}
          </dd>
        </div>
        <div>
          <dt>Телефон</dt>
          <dd>{{ booking.requester_phone }}</dd>
        </div>
        <div>
          <dt>Видимость</dt>
          <dd>{{ booking.is_public ? 'Открытое мероприятие' : 'Закрытое мероприятие' }}</dd>
        </div>
      </dl>
      <Message v-if="booking.reject_reason" severity="warn" :closable="false"
        >Причина отклонения: {{ booking.reject_reason }}</Message
      ><Message v-if="permissionError" severity="warn" :closable="false"
        >Не удалось проверить права модератора. Обновите страницу.</Message
      ><Message v-if="actionError" severity="error" :closable="false">{{ actionError }}</Message>
      <div v-if="confirmation === 'reject'" class="form-stack">
        <label for="reject-reason">Почему заявка отклонена?</label
        ><Textarea id="reject-reason" v-model="reason" :maxlength="512" rows="3" fluid />
        <div class="button-row">
          <Button
            label="Отклонить заявку"
            severity="danger"
            :loading="action.isPending.value"
            @click="execute('reject')"
          /><Button
            label="Назад"
            severity="secondary"
            variant="text"
            :disabled="action.isPending.value"
            @click="confirmation = null"
          />
        </div>
      </div>
      <div v-else-if="confirmation === 'cancel'" class="form-stack">
        <p>Отменить эту заявку? Забронированное время освободится.</p>
        <div class="button-row">
          <Button
            label="Да, отменить"
            severity="danger"
            :loading="action.isPending.value"
            @click="execute('cancel')"
          /><Button
            label="Назад"
            severity="secondary"
            variant="text"
            :disabled="action.isPending.value"
            @click="confirmation = null"
          />
        </div>
      </div>
      <div v-else class="button-row">
        <Button
          v-if="canModerate && booking.status === 'pending'"
          label="Одобрить"
          icon="pi pi-check"
          :loading="action.isPending.value"
          @click="execute('approve')"
        /><Button
          v-if="canModerate && booking.status === 'pending'"
          label="Отклонить"
          severity="danger"
          variant="outlined"
          :disabled="action.isPending.value"
          @click="confirmation = 'reject'"
        /><Button
          v-if="canCancel"
          label="Отменить заявку"
          severity="secondary"
          variant="text"
          :disabled="action.isPending.value"
          @click="confirmation = 'cancel'"
        />
      </div></div
  ></Dialog>
</template>
