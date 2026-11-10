import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'
import 'primeicons/primeicons.css'
import '@/app/styles.css'
import App from '@/App.vue'
import { router } from '@/app/router'
import { queryClient } from '@/app/query'
const theme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{violet.50}',
      100: '{violet.100}',
      200: '{violet.200}',
      300: '{violet.300}',
      400: '{violet.400}',
      500: '{violet.500}',
      600: '{violet.600}',
      700: '{violet.700}',
      800: '{violet.800}',
      900: '{violet.900}',
      950: '{violet.950}',
    },
  },
})
const app = createApp(App)
app
  .use(createPinia())
  .use(router)
  .use(VueQueryPlugin, { queryClient })
  .use(PrimeVue, {
    theme: { preset: theme, options: { darkModeSelector: '.dark-mode-disabled' } },
    locale: {
      emptyMessage: 'Ничего не найдено',
      emptyFilterMessage: 'Ничего не найдено',
      choose: 'Выбрать',
      cancel: 'Отмена',
      accept: 'Да',
      reject: 'Нет',
      searchMessage: 'Результатов: {0}',
      selectionMessage: 'Выбрано: {0}',
      emptySelectionMessage: 'Ничего не выбрано',
      dayNamesMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
      firstDayOfWeek: 1,
    },
  })
window.addEventListener('session-expired', () => {
  void queryClient.cancelQueries().then(() => {
    queryClient.clear()
    void router.replace('/login')
  })
})
app.mount('#app')
