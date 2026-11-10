import { createRouter, createWebHistory } from 'vue-router'
import { tokens } from '@/shared/api/session'
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('@/pages/AuthPage.vue'), meta: { public: true } },
    {
      path: '/',
      component: () => import('@/app/AppShell.vue'),
      children: [
        { path: '', redirect: '/rooms' },
        { path: 'rooms', component: () => import('@/pages/RoomsPage.vue') },
        { path: 'rooms/:id(\\d+)/book', component: () => import('@/pages/RoomBookingPage.vue') },
        { path: 'bookings', component: () => import('@/pages/BookingsPage.vue') },
        { path: 'moderation', component: () => import('@/pages/ModerationPage.vue') },
        { path: 'profile', component: () => import('@/pages/ProfilePage.vue') },
        { path: ':pathMatch(.*)*', component: () => import('@/pages/NotFoundPage.vue') },
      ],
    },
  ],
})
router.beforeEach((to) => {
  if (!to.meta.public && !tokens.value) return '/login'
  if (to.path === '/login' && tokens.value) return '/rooms'
})
