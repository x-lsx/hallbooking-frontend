<script setup lang="ts">
import Message from 'primevue/message'
import Button from 'primevue/button'
import { errorText } from '@/shared/api/client'
defineProps<{ error?: unknown; loading?: boolean; empty?: boolean; emptyText?: string }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <div v-if="loading" class="state" role="status">
    <i class="pi pi-spin pi-spinner" /> Загружаем…
  </div>
  <Message v-else-if="error" severity="error" :closable="false"
    ><div class="feedback-row">
      <span>{{ errorText(error) }}</span
      ><Button
        label="Повторить"
        size="small"
        severity="danger"
        variant="text"
        @click="$emit('retry')"
      /></div
  ></Message>
  <div v-else-if="empty" class="state">
    <i class="pi pi-inbox" />
    <p>{{ emptyText || 'Пока здесь ничего нет' }}</p>
  </div>
</template>
