<script setup lang="ts">
import { useProfile } from '@/features/data'
import Feedback from '@/shared/ui/Feedback.vue'
import Tag from 'primevue/tag'
const { data, isPending, error, refetch } = useProfile()
</script>
<template>
  <section>
    <div class="page-heading">
      <div>
        <div class="eyebrow">ЛИЧНЫЙ КАБИНЕТ</div>
        <h1>Профиль<span class="heading-dot">.</span></h1>
        <p class="muted">Ваши контактные данные для организаторов встреч.</p>
      </div>
    </div>
    <Feedback :loading="isPending" :error="error" @retry="refetch()" />
    <article v-if="data && !error" class="profile-card">
      <span class="profile-large-avatar">{{ data.first_name?.[0] || 'Я' }}</span>
      <h2>
        {{
          [data.last_name, data.first_name, data.middle_name].filter(Boolean).join(' ') ||
          'Пользователь'
        }}
      </h2>
      <Tag :value="data.is_superuser ? 'Администратор' : 'Пользователь'" />
      <dl class="detail-list">
        <div>
          <dt>Почта</dt>
          <dd>{{ data.email }}</dd>
        </div>
        <div>
          <dt>Телефон</dt>
          <dd>{{ data.phone_number }}</dd>
        </div>
        <div>
          <dt>Подразделение</dt>
          <dd>{{ data.department?.name || 'Не указано' }}</dd>
        </div>
        <div>
          <dt>Подтверждение почты</dt>
          <dd>{{ data.is_verified ? 'Подтверждена' : 'Ожидает подтверждения' }}</dd>
        </div>
      </dl>
      <p class="small muted">
        Редактирование профиля появится после подключения соответствующего метода API.
      </p>
    </article>
  </section>
</template>
