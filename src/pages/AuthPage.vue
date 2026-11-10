<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'
import { authApi } from '@/shared/api/endpoints'
import { errorText } from '@/shared/api/client'
import { useAuthStore } from '@/features/auth/store'
const router = useRouter()
const auth = useAuthStore()
const mode = ref<'login' | 'register'>('login')
const error = ref('')
const validationSchema = computed(() =>
  toTypedSchema(
    z
      .object({
        email: z.string().trim().email('Введите корректную почту'),
        password: z.string().min(1, 'Введите пароль'),
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        phone_number: z.string().optional(),
      })
      .superRefine((v, ctx) => {
        if (mode.value !== 'register') return
        for (const field of ['first_name', 'last_name'] as const)
          if (!v[field]?.trim() || v[field]!.trim().length > 20)
            ctx.addIssue({ code: 'custom', path: [field], message: 'Введите от 1 до 20 символов' })
        if (!v.phone_number || !/^[+()\d\s-]{5,20}$/.test(v.phone_number))
          ctx.addIssue({
            code: 'custom',
            path: ['phone_number'],
            message: 'Введите телефон: от 5 до 20 символов',
          })
        if (v.password.length < 8 || new TextEncoder().encode(v.password).length > 72)
          ctx.addIssue({
            code: 'custom',
            path: ['password'],
            message: 'От 8 символов, не больше 72 байт',
          })
      }),
  ),
)
const { defineField, errors, handleSubmit, isSubmitting, resetForm } = useForm({ validationSchema })
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const [firstName, firstAttrs] = defineField('first_name')
const [lastName, lastAttrs] = defineField('last_name')
const [phone, phoneAttrs] = defineField('phone_number')
function changeMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  resetForm()
  error.value = ''
}
const submit = handleSubmit(async (values) => {
  error.value = ''
  try {
    const data =
      mode.value === 'register'
        ? await authApi.register({
            email: values.email.trim().toLowerCase(),
            password: values.password,
            first_name: values.first_name?.trim(),
            last_name: values.last_name?.trim(),
            phone_number: values.phone_number || '',
          })
        : await authApi.login({
            email: values.email.trim().toLowerCase(),
            password: values.password,
          })
    await auth.accept(data)
    await router.replace('/rooms')
  } catch (cause) {
    error.value = errorText(cause)
  }
})
</script>
<template>
  <main class="auth-page">
    <section class="auth-story">
      <a class="brand" href="/">з<span>а</span>лбук<i class="brand-dot" /></a>
      <div class="auth-story-body">
        <span class="eyebrow">ПРОСТРАНСТВО ДЛЯ ВАШИХ ИДЕЙ</span>
        <h1>Хорошие идеи <br />начинаются <br />со встречи.</h1>
        <p>Найдите подходящий зал, выберите время<br />и соберите тех, кто разделяет вашу идею.</p>
        <div class="abstract-room" aria-hidden="true">
          <div class="abstract-window" />
          <div class="abstract-table" />
          <div class="abstract-chair one" />
          <div class="abstract-chair two" />
          <div class="abstract-chair three" />
          <span>МЕСТО ДЛЯ НОВОГО</span>
        </div>
      </div>
      <p class="auth-foot">Внеучебные пространства университета</p>
    </section>
    <section class="auth-form-side">
      <div class="auth-form-wrap">
        <span class="eyebrow">ДОБРО ПОЖАЛОВАТЬ</span>
        <h2>{{ mode === 'login' ? 'Рады видеть вас' : 'Давайте знакомиться' }}</h2>
        <p class="muted">
          {{
            mode === 'login'
              ? 'Войдите, чтобы найти пространство для встречи.'
              : 'Создайте аккаунт для бронирования залов.'
          }}
        </p>
        <form class="form-stack" @submit.prevent="submit" novalidate>
          <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
          <div v-if="mode === 'register'" class="form-pair">
            <div class="field">
              <label for="first">Имя</label
              ><InputText
                id="first"
                v-model="firstName"
                v-bind="firstAttrs"
                autocomplete="given-name"
                :invalid="!!errors.first_name"
              /><small class="field-error">{{ errors.first_name }}</small>
            </div>
            <div class="field">
              <label for="last">Фамилия</label
              ><InputText
                id="last"
                v-model="lastName"
                v-bind="lastAttrs"
                autocomplete="family-name"
                :invalid="!!errors.last_name"
              /><small class="field-error">{{ errors.last_name }}</small>
            </div>
          </div>
          <div class="field">
            <label for="email">Электронная почта</label
            ><InputText
              id="email"
              v-model="email"
              v-bind="emailAttrs"
              type="email"
              autocomplete="email"
              placeholder="you@university.ru"
              :invalid="!!errors.email"
            /><small class="field-error">{{ errors.email }}</small>
          </div>
          <div v-if="mode === 'register'" class="field">
            <label for="phone">Телефон</label
            ><InputText
              id="phone"
              v-model="phone"
              v-bind="phoneAttrs"
              type="tel"
              autocomplete="tel"
              placeholder="+7 999 000-00-00"
              :invalid="!!errors.phone_number"
            /><small class="field-error">{{ errors.phone_number }}</small>
          </div>
          <div class="field">
            <label for="password">Пароль</label
            ><Password
              input-id="password"
              v-model="password"
              v-bind="passwordAttrs"
              :feedback="false"
              toggle-mask
              fluid
              :input-props="{
                autocomplete: mode === 'login' ? 'current-password' : 'new-password',
              }"
              :invalid="!!errors.password"
            /><small class="field-error">{{ errors.password }}</small>
          </div>
          <Button
            type="submit"
            :label="mode === 'login' ? 'Войти' : 'Создать аккаунт'"
            icon="pi pi-arrow-right"
            icon-pos="right"
            :loading="isSubmitting"
            fluid
          />
          <p class="auth-switch">
            {{ mode === 'login' ? 'Ещё нет аккаунта?' : 'Уже зарегистрированы?' }}
            <button type="button" class="text-link" @click="changeMode" :disabled="isSubmitting">
              {{ mode === 'login' ? 'Зарегистрироваться' : 'Войти' }}
            </button>
          </p>
        </form>
      </div>
      <p class="auth-caption">Одна встреча может стать началом чего-то большого.</p>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
  background: white;
}
.auth-story {
  background: #f0edf8;
  display: flex;
  flex-direction: column;
  padding: 45px 11% 30px;
  position: relative;
  overflow: hidden;
}
.auth-story > .brand {
  font-size: 32px;
}
.auth-story-body {
  padding-top: 70px;
  flex: 1;
}
.auth-story-body > .eyebrow {
  font-size: 9px;
  color: #a697ba;
}
.auth-story h1 {
  font-size: clamp(35px, 3.7vw, 60px);
  line-height: 1.18;
  letter-spacing: -2.5px;
  margin: 21px 0 25px;
  color: #4c405f;
}
.auth-story-body > p {
  font-size: 12px;
  color: #a092b0;
  line-height: 1.9;
}
.auth-foot {
  font-size: 9px;
  color: #b0a5bf;
  margin-top: 30px;
}
.abstract-room {
  height: 230px;
  position: relative;
  margin-top: 40px;
  border-bottom: 1px solid #c6b9d4;
  max-width: 380px;
  isolation: isolate;
}
.abstract-room:after {
  content: '';
  position: absolute;
  bottom: 18px;
  right: -45px;
  width: 130px;
  height: 130px;
  background: #e3deee;
  border-radius: 50%;
  z-index: -1;
}
.abstract-window {
  position: absolute;
  top: 0;
  left: 13%;
  width: 110px;
  height: 145px;
  border: 7px solid #d7cce6;
  border-radius: 70px 70px 0 0;
  background:
    linear-gradient(90deg, transparent 47%, #d7cce6 47%, #d7cce6 53%, transparent 53%),
    linear-gradient(0deg, transparent 40%, #d7cce6 40%, #d7cce6 46%, transparent 46%);
}
.abstract-table {
  position: absolute;
  left: 25%;
  bottom: 36px;
  width: 190px;
  height: 34px;
  background: #b29dc9;
  border-radius: 50%;
  transform: rotate(-7deg);
  box-shadow: 0 8px 0 #a58cbe;
}
.abstract-table:before,
.abstract-table:after {
  content: '';
  position: absolute;
  top: 28px;
  width: 6px;
  height: 55px;
  background: #ac95c3;
  transform: rotate(7deg);
}
.abstract-table:before {
  left: 30px;
}
.abstract-table:after {
  right: 30px;
}
.abstract-chair {
  position: absolute;
  width: 43px;
  height: 53px;
  background: #d0bfdc;
  border-radius: 20px 20px 4px 4px;
  border-bottom: 7px solid #b49ac5;
  bottom: 17px;
  left: 15%;
  transform: rotate(-8deg);
}
.abstract-chair.two {
  left: 75%;
  bottom: 30px;
  transform: rotate(9deg);
  background: #c7b6d5;
}
.abstract-chair.three {
  left: 48%;
  bottom: 0;
  transform: rotate(-8deg);
  background: #d9cde5;
}
.abstract-room > span {
  position: absolute;
  right: -15px;
  top: 45px;
  writing-mode: vertical-rl;
  font-size: 7px;
  letter-spacing: 2px;
  color: #baadca;
}
.auth-form-side {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 50px;
  position: relative;
}
.auth-form-wrap {
  width: 100%;
  max-width: 360px;
}
.auth-form-wrap > .eyebrow {
  font-size: 9px;
  margin-bottom: 15px;
}
.auth-form-wrap h2 {
  font-size: 28px;
  letter-spacing: -1px;
}
.auth-form-wrap > .muted {
  font-size: 11px;
  margin-top: 10px;
  margin-bottom: 30px;
}
.auth-form-wrap .form-stack {
  gap: 21px;
}
.auth-form-wrap .field label {
  font-size: 11px;
}
.auth-switch {
  text-align: center;
  font-size: 11px;
  color: #a39aaa;
}
.auth-switch .text-link {
  margin-left: 5px;
}
.auth-caption {
  position: absolute;
  bottom: 28px;
  font-size: 9px;
  color: #bcb4c7;
  text-align: center;
}
@media (max-width: 960px) {
  .auth-form-side {
    padding: 40px;
  }
  .auth-story {
    padding-left: 10%;
    padding-right: 10%;
  }
  .auth-story h1 {
    font-size: 40px;
  }
  .abstract-room {
    transform: scale(0.85);
    transform-origin: left bottom;
  }
}
@media (max-width: 680px) {
  .auth-page {
    display: flex;
    flex-direction: column;
  }
  .auth-story {
    padding: 25px 28px;
    background: #f0edf8;
  }
  .auth-story > .brand {
    font-size: 25px;
  }
  .auth-story-body {
    padding-top: 30px;
  }
  .auth-story-body > .eyebrow {
    font-size: 8px;
  }
  .auth-story h1 {
    font-size: 34px;
    letter-spacing: -1.4px;
    margin: 12px 0;
  }
  .auth-story h1 br {
    display: none;
  }
  .auth-story-body > p {
    font-size: 10px;
    margin-top: 14px;
  }
  .auth-story-body > p br {
    display: none;
  }
  .abstract-room,
  .auth-foot {
    display: none;
  }
  .auth-form-side {
    padding: 35px 26px 65px;
  }
  .auth-form-wrap h2 {
    font-size: 25px;
  }
  .auth-caption {
    bottom: 20px;
    font-size: 8px;
  }
}
</style>
