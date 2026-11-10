<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useProfile } from '@/features/data'
import { useAuthStore } from '@/features/auth/store'
import { errorText } from '@/shared/api/client'
const { data: profile } = useProfile()
const auth = useAuthStore()
const router = useRouter()
const logoutError = ref('')
const initials = computed(
  () => `${profile.value?.first_name?.[0] || ''}${profile.value?.last_name?.[0] || ''}` || 'Я',
)
async function logout() {
  try {
    await auth.logout()
  } catch (error) {
    logoutError.value = errorText(error)
  } finally {
    await router.replace('/login')
  }
}
</script>
<template>
  <div class="app-shell">
    <aside class="sidebar">
      <RouterLink to="/rooms" class="brand">з<span>а</span>лбук<i class="brand-dot" /></RouterLink>
      <div class="nav-caption">МОЙ УНИВЕРСИТЕТ</div>
      <nav aria-label="Основная навигация">
        <RouterLink to="/rooms" class="nav-item"
          ><i class="pi pi-th-large" /><span>Залы</span
          ><i class="pi pi-arrow-up-right nav-arrow" /></RouterLink
        ><RouterLink to="/bookings" class="nav-item"
          ><i class="pi pi-calendar" /><span>Заявки</span></RouterLink
        >
      </nav>
      <div class="sidebar-note">
        <span class="note-spark">✳</span><strong>Встречайтесь.<br />Создавайте новое.</strong>
        <p>Место для ваших идей<br />уже есть.</p>
      </div>
      <div class="sidebar-bottom"><span class="connection-dot" /> Внеучебные пространства</div>
    </aside>
    <div class="main-shell">
      <header class="topbar">
        <span class="topbar-caption">БРОНИРОВАНИЕ ПРОСТРАНСТВ</span>
        <div class="topbar-right">
          <RouterLink to="/profile" class="profile-link"
            ><span class="avatar">{{ initials }}</span
            ><span>{{ profile?.first_name || 'Мой профиль' }}</span
            ><i class="pi pi-chevron-down" /></RouterLink
          ><Button
            icon="pi pi-sign-out"
            variant="text"
            severity="secondary"
            aria-label="Выйти"
            @click="logout"
          />
        </div>
      </header>
      <main id="main" class="page-content"><RouterView /></main>
      <footer class="page-footer">
        <span>Залбук · пространство для ваших идей</span
        ><span>Университет начинается со встреч</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: white;
  border-right: 1px solid var(--line);
  padding: 38px 24px 24px;
  display: flex;
  flex-direction: column;
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 10;
}
.sidebar > .brand {
  margin: 0 15px 55px;
}
.nav-caption {
  font-size: 9px;
  letter-spacing: 1.4px;
  color: #a1a1b0;
  font-weight: 700;
  margin: 0 15px 17px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 15px 16px;
  border-radius: 9px;
  color: #898898;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 6px;
}
.nav-item > i {
  font-size: 16px;
}
.nav-item.router-link-active {
  background: var(--lavender);
  color: var(--accent);
}
.nav-item .nav-arrow {
  margin-left: auto;
  font-size: 12px;
}
.note-spark {
  font-size: 34px;
  color: #9684c1;
  display: block;
  margin-bottom: 15px;
}
.connection-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #9dc7a1;
}
.main-shell {
  margin-left: 220px;
  width: calc(100% - 220px);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.topbar {
  height: 85px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 44px;
  background: #fff;
}
.topbar-caption {
  font-size: 9px;
  letter-spacing: 1.8px;
  color: #a5a4b2;
  font-weight: 600;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.profile-link {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  font-weight: 700;
}
.profile-link > .pi {
  font-size: 9px;
  color: #a1a1ae;
}
.avatar {
  width: 33px;
  height: 33px;
  display: grid;
  place-items: center;
  background: #eee9fb;
  color: #8a6bb9;
  border-radius: 50%;
  font-size: 11px;
}
.page-content {
  padding: 38px 44px 40px;
  flex: 1;
  max-width: 1720px;
  width: 100%;
  margin: 0 auto;
}
.page-footer {
  padding: 22px 44px;
  display: flex;
  justify-content: space-between;
  color: #b4b1c0;
  font-size: 9px;
  border-top: 1px solid #ecebf1;
}
@media (min-width: 1500px) {
  .page-content {
    padding-top: 50px;
  }
}
@media (max-width: 1200px) {
  .sidebar {
    width: 185px;
    padding: 32px 16px 20px;
  }
  .main-shell {
    margin-left: 185px;
    width: calc(100% - 185px);
  }
  .page-content {
    padding: 30px;
  }
  .topbar {
    padding: 0 30px;
  }
}
@media (max-width: 680px) {
  .sidebar {
    position: sticky;
    top: 0;
    width: 100%;
    height: auto;
    padding: 15px 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }
  .sidebar > .brand {
    font-size: 24px;
    margin: 0;
  }
  .sidebar nav {
    display: flex;
    gap: 7px;
  }
  .nav-item {
    padding: 9px 12px;
    font-size: 11px;
    margin: 0;
    gap: 7px;
  }
  .nav-item > i {
    font-size: 12px;
  }
  .nav-item .nav-arrow {
    display: none;
  }
  .app-shell {
    display: block;
  }
  .main-shell {
    margin: 0;
    width: 100%;
  }
  .topbar {
    height: 58px;
    padding: 0 20px;
  }
  .topbar-caption {
    font-size: 7px;
    letter-spacing: 1px;
  }
  .topbar-right {
    gap: 6px;
  }
  .profile-link {
    font-size: 10px;
  }
  .avatar {
    width: 27px;
    height: 27px;
  }
  .profile-link > .pi {
    display: none;
  }
  .page-content {
    padding: 26px 18px;
  }
  .page-footer {
    padding: 20px;
    font-size: 8px;
  }
  .page-footer > span:last-child {
    display: none;
  }
}
</style>
