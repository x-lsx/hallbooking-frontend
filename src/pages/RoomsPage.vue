<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import Feedback from '@/shared/ui/Feedback.vue'
import { useBuildings, useFormats, useRooms } from '@/features/data'
import type { RoomFilters } from '@/shared/api/types'
const route = useRoute()
const router = useRouter()
function positive(value: unknown): number | undefined {
  const n = Number(value)
  return Number.isSafeInteger(n) && n > 0 ? n : undefined
}
const filters = computed<RoomFilters>(() => ({
  page: positive(route.query.page) || 1,
  size: [6, 12, 24].includes(Number(route.query.size)) ? Number(route.query.size) : 6,
  building_id: positive(route.query.building),
  capacity_min: positive(route.query.capacity),
  type: typeof route.query.type === 'string' && route.query.type ? route.query.type : undefined,
  formats_ids: (Array.isArray(route.query.formats) ? route.query.formats : [route.query.formats])
    .map(positive)
    .filter((v): v is number => v !== undefined),
}))
const draft = reactive<{ building?: number; capacity?: number; type: string; formats: number[] }>({
  type: '',
  formats: [],
})
watch(
  filters,
  (value) => {
    draft.building = value.building_id
    draft.capacity = value.capacity_min
    draft.type = value.type || ''
    draft.formats = value.formats_ids || []
  },
  { immediate: true },
)
const { data, isPending, error, refetch } = useRooms(filters)
const { data: buildings, error: buildingsError, refetch: reloadBuildings } = useBuildings()
const { data: formats, error: formatsError, refetch: reloadFormats } = useFormats()
function apply() {
  router.push({
    query: {
      building: draft.building,
      capacity: draft.capacity,
      type: draft.type.trim() || undefined,
      formats: draft.formats.map(String),
      size: filters.value.size,
    },
  })
}
function reset() {
  router.push({ query: {} })
}
function changePage(event: { page: number; rows: number }) {
  router.push({ query: { ...route.query, page: event.page + 1, size: event.rows } })
}
</script>
<template>
  <section>
    <div class="page-heading">
      <div>
        <div class="eyebrow">НАЙДИТЕ СВОЁ МЕСТО</div>
        <h1>Залы <span class="heading-dot">.</span></h1>
        <p class="muted">Для лекций, встреч и идей, которым нужно пространство.</p>
      </div>
      <span class="heading-icon" aria-hidden="true"><i class="pi pi-th-large" /></span>
    </div>
    <form class="filter-panel" @submit.prevent="apply">
      <div class="filter-label"><i class="pi pi-sliders-h" /> Подобрать зал</div>
      <div class="filter-fields">
        <div class="field">
          <label for="building">Корпус</label
          ><Select
            input-id="building"
            v-model="draft.building"
            :options="buildings || []"
            option-label="number"
            option-value="id"
            placeholder="Все корпуса"
            show-clear
          />
        </div>
        <div class="field">
          <label for="capacity">Вместимость</label
          ><InputNumber
            input-id="capacity"
            v-model="draft.capacity"
            placeholder="От скольких мест"
            :min="1"
            :max="100000"
            :use-grouping="false"
            fluid
          />
        </div>
        <div class="field">
          <label for="formats">Формат мероприятия</label
          ><MultiSelect
            input-id="formats"
            v-model="draft.formats"
            :options="formats || []"
            option-label="name"
            option-value="id"
            placeholder="Любой формат"
            :max-selected-labels="1"
          />
        </div>
        <div class="field">
          <label for="type">Тип зала</label
          ><InputText id="type" v-model="draft.type" placeholder="Любой тип" />
        </div>
        <Button label="Найти" type="submit" icon="pi pi-search" /><Button
          icon="pi pi-filter-slash"
          severity="secondary"
          variant="outlined"
          aria-label="Сбросить фильтры"
          @click="reset"
        />
      </div>
      <Feedback v-if="buildingsError" :error="buildingsError" @retry="reloadBuildings()" /><Feedback
        v-if="formatsError"
        :error="formatsError"
        @retry="reloadFormats()"
      />
    </form>
    <div class="results-bar">
      <span
        >Доступные пространства <strong>{{ data?.total ?? '—' }}</strong></span
      ><span class="muted small">Выберите зал, а затем удобное время</span>
    </div>
    <Feedback
      :loading="isPending"
      :error="error"
      :empty="data?.items.length === 0"
      empty-text="Подходящих залов пока нет. Попробуйте изменить фильтры."
      @retry="refetch()"
    />
    <div v-if="data && !error" class="rooms-grid">
      <article v-for="(room, index) in data.items" :key="room.id" class="room-card">
        <div class="room-cover" :class="`tone-${index % 3}`">
          <div class="room-cover-grid" aria-hidden="true" />
          <span class="room-building">КОРПУС {{ room.building.number }}</span
          ><span class="room-number">{{ room.number }}</span
          ><span class="room-type">{{ room.type }}</span>
          <div class="room-cover-symbol" aria-hidden="true">
            {{ index % 3 === 0 ? '◒' : index % 3 === 1 ? '✳' : '◩' }}
          </div>
        </div>
        <div class="room-card-content">
          <div class="room-title-row">
            <h2>{{ room.name || `Аудитория ${room.number}` }}</h2>
            <span class="capacity-badge"><i class="pi pi-users" /> {{ room.capacity }}</span>
          </div>
          <p class="room-organization">
            {{ room.organization || room.building.name || `Корпус ${room.building.number}` }}
          </p>
          <div class="format-chips">
            <span v-for="format in room.event_formats" :key="format.id">{{ format.name }}</span
            ><span v-if="!room.event_formats.length">Любой формат</span>
          </div>
          <div class="room-hours">
            <i class="pi pi-clock" /> {{ room.open_from.slice(0, 5) }} —
            {{ room.open_until.slice(0, 5) }}<span>ежедневно</span>
          </div>
          <RouterLink :to="`/rooms/${room.id}/book`" class="room-book-link"
            >Подать заявку <i class="pi pi-arrow-up-right"
          /></RouterLink>
        </div>
      </article>
    </div>
    <Paginator
      v-if="data && data.total > 0"
      :first="(filters.page - 1) * filters.size"
      :rows="filters.size"
      :total-records="data.total"
      :rows-per-page-options="[6, 12, 24]"
      @page="changePage"
    />
  </section>
</template>

<style scoped>
.rooms-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}
.room-card {
  border: 1px solid var(--line);
  border-radius: 13px;
  background: white;
  overflow: hidden;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.room-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px #26263909;
}
.room-cover {
  position: relative;
  height: 167px;
  background: #e8e3f4;
  padding: 20px;
  overflow: hidden;
  isolation: isolate;
}
.room-cover.tone-1 {
  background: #e4eeeb;
}
.room-cover.tone-2 {
  background: #f4e9df;
}
.room-building {
  font-size: 9px;
  letter-spacing: 1.2px;
  color: #7c6f95;
  font-weight: 800;
}
.room-number {
  font-size: 65px;
  line-height: 1;
  font-weight: 500;
  letter-spacing: -4px;
  color: #76648f;
  display: block;
  margin-top: 9px;
}
.room-type {
  position: absolute;
  bottom: 18px;
  left: 20px;
  font-size: 9px;
  font-weight: 600;
  color: #7d6f91;
  background: #ffffff85;
  padding: 4px 8px;
  border-radius: 4px;
}
.room-card-content {
  padding: 21px;
}
.room-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.room-title-row h2 {
  font-size: 16px;
  letter-spacing: -0.5px;
}
.capacity-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #858395;
  font-size: 10px;
  white-space: nowrap;
}
.capacity-badge i {
  font-size: 12px;
}
.room-organization {
  font-size: 10px;
  color: #a09daf;
  margin-top: 6px;
  min-height: 17px;
}
.format-chips {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  align-content: flex-start;
  margin: 18px 0 20px;
  min-height: 44px;
}
.format-chips > span {
  background: #f5f4f9;
  border: 1px solid #edeaf3;
  border-radius: 4px;
  padding: 4px 7px;
  font-size: 9px;
  color: #888294;
  line-height: 1.3;
}
.room-hours {
  font-size: 11px;
  font-weight: 600;
  color: #727082;
  display: flex;
  align-items: center;
  gap: 7px;
  padding-bottom: 18px;
  border-bottom: 1px solid #efedf4;
}
.room-hours i {
  font-size: 12px;
  color: #a49aae;
}
.room-hours span {
  margin-left: auto;
  font-size: 9px;
  color: #b2adbc;
  font-weight: 400;
}
@media (min-width: 1500px) {
  .room-cover {
    height: 190px;
  }
  .room-number {
    font-size: 78px;
  }
  .room-card-content {
    padding: 25px;
  }
  .room-title-row h2 {
    font-size: 18px;
  }
}
@media (max-width: 1200px) {
  .rooms-grid {
    gap: 16px;
  }
  .room-title-row {
    flex-wrap: wrap;
  }
  .room-cover {
    height: 150px;
  }
  .room-number {
    font-size: 58px;
  }
  .room-card-content {
    padding: 17px;
  }
  .room-title-row h2 {
    font-size: 14px;
  }
}
@media (max-width: 960px) {
  .rooms-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 680px) {
  .rooms-grid {
    gap: 13px;
  }
  .room-cover {
    height: 125px;
    padding: 14px;
  }
  .room-number {
    font-size: 48px;
    margin-top: 12px;
  }
  .room-building {
    font-size: 7px;
  }
  .room-type {
    font-size: 7px;
    left: 14px;
    bottom: 10px;
    max-width: 85%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .room-card-content {
    padding: 15px 12px;
  }
  .room-title-row h2 {
    font-size: 12px;
  }
  .capacity-badge {
    font-size: 8px;
  }
  .room-organization {
    font-size: 8px;
  }
  .format-chips {
    margin: 13px 0;
    min-height: 44px;
  }
  .format-chips > span {
    font-size: 7px;
    padding: 3px 5px;
  }
  .room-hours {
    font-size: 8px;
    gap: 4px;
    padding-bottom: 13px;
  }
  .room-hours span {
    display: none;
  }
  .room-hours i {
    font-size: 9px;
  }
}
</style>
