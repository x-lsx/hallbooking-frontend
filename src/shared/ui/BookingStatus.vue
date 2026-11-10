<script setup lang="ts">
import Tag from 'primevue/tag'
import type { Booking } from '@/shared/api/types'
defineProps<{ status: Booking['status'] }>()
const labels = {
  pending: 'На рассмотрении',
  approved: 'Подтверждена',
  rejected: 'Отклонена',
  canselled: 'Отменена',
} as const
const severity = {
  pending: 'warn',
  approved: 'success',
  rejected: 'danger',
  canselled: 'secondary',
} as const
</script>
<template><Tag :value="labels[status]" :severity="severity[status]" /></template>
