<template>
  <div class="app-shell" :class="{ 'sidebar-open': sidebarOpen }">

    <!-- ░░ Mobile overlay ░░ -->
    <Transition name="overlay">
      <div
        v-if="sidebarOpen && isMobile"
        class="sidebar-overlay"
        aria-hidden="true"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
         SIDEBAR
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ -->
    <Transition name="sidebar">
      <aside
        v-show="!isMobile || sidebarOpen"
        class="sidebar"
        :aria-hidden="isMobile && !sidebarOpen"
        role="navigation"
        aria-label="Hauptnavigation"
      >
        <!-- Logo -->
        <div class="sidebar-logo">
          <div class="logo-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
              <path d="M14 3L21 7.5V16.5L14 21L7 16.5V7.5L14 3Z"
                stroke="white" stroke-width="2" stroke-linejoin="round"/>
              <circle cx="14" cy="12" r="2.5" fill="white"/>
            </svg>
          </div>
          <div class="logo-text-wrap">
            <span class="logo-text">Passly DPP</span>
            <span class="logo-sub">Enterprise</span>
          </div>
          <!-- Close on mobile -->
          <button
            v-if="isMobile"
            class="sidebar-close"
            aria-label="Navigation schließen"
            @click="sidebarOpen = false"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Nav -->
        <nav class="sidebar-nav" role="menubar">
          <div class="nav-section-label">{{ t('nav.overview') }}</div>

          <NuxtLink
            to="/dashboard"
            class="nav-item"
            active-class="active"
            exact
            role="menuitem"
            @click="closeSidebarOnMobile"
          >
            <LayoutDashboard :size="16" class="nav-icon" aria-hidden="true"/>
            <span>{{ t('nav.dashboard') }}</span>
          </NuxtLink>

          <div class="nav-section-label">{{ t('nav.products') }}</div>

          <NuxtLink
            to="/dashboard/products"
            class="nav-item"
            active-class="active"
            role="menuitem"
            @click="closeSidebarOnMobile"
          >
            <BadgeInfo :size="16" class="nav-icon" aria-hidden="true"/>
            <span>{{ t('nav.passports') }}</span>
            <span v-if="productStats.byStatus.crit > 0" class="nav-badge crit">
              {{ productStats.byStatus.crit }}
            </span>
          </NuxtLink>

          <NuxtLink
            to="/dashboard/supply-chain"
            class="nav-item"
            active-class="active"
            role="menuitem"
            @click="closeSidebarOnMobile"
          >
            <Truck :size="16" class="nav-icon" aria-hidden="true"/>
            <span>{{ t('nav.supplyChain') }}</span>
          </NuxtLink>

          <div class="nav-section-label">{{ t('nav.compliance') }}</div>

          <NuxtLink
            to="/dashboard/compliance"
            class="nav-item"
            active-class="active"
            role="menuitem"
            @click="closeSidebarOnMobile"
          >
            <ShieldCheck :size="16" class="nav-icon" aria-hidden="true"/>
            <span>{{ t('nav.regulations') }}</span>
          </NuxtLink>

          <NuxtLink
            to="/dashboard/reports"
            class="nav-item"
            active-class="active"
            role="menuitem"
            @click="closeSidebarOnMobile"
          >
            <FileText :size="16" class="nav-icon" aria-hidden="true"/>
            <span>{{ t('nav.reports') }}</span>
          </NuxtLink>

          <div class="nav-section-label">{{ t('nav.system') }}</div>

          <NuxtLink
            to="/dashboard/settings"
            class="nav-item"
            active-class="active"
            role="menuitem"
            @click="closeSidebarOnMobile"
          >
          <Settings :size="16" class="nav-icon" aria-hidden="true"/>
            <span>{{ t('nav.settings') }}</span>
          </NuxtLink>
        </nav>

        <!-- User chip -->
        <div class="sidebar-footer">
          <div class="user-chip">
            <div class="avatar" aria-hidden="true">{{ auth.user?.avatarInitials }}</div>
            <div class="user-info">
              <span class="user-name">{{ auth.user?.name }}</span>
              <span class="user-role">{{ auth.user?.company }}</span>
            </div>
            <button
              class="logout-btn"
              :title="t('nav.logout')"
              :aria-label="t('nav.logout')"
              @click="auth.logout()"
            >
              <LogOut :size="16" aria-hidden="true"/>
            </button>
          </div>
        </div>
      </aside>
    </Transition>

    <!-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
         MAIN AREA
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ -->
    <div class="main-area">

      <!-- ── Topbar ── -->
      <header class="topbar" role="banner">

        <!-- Left: hamburger + breadcrumb -->
        <div class="topbar-left">
          <button
            class="hamburger hide-desktop"
            :aria-label="sidebarOpen ? t('nav.closeMenu') : t('nav.openMenu')"
            :aria-expanded="sidebarOpen"
            aria-controls="sidebar"
            @click="sidebarOpen = !sidebarOpen"
          >
            <span class="ham-line" :class="{ open: sidebarOpen }" />
            <span class="ham-line" :class="{ open: sidebarOpen }" />
            <span class="ham-line" :class="{ open: sidebarOpen }" />
          </button>
          <AppBreadcrumb class="hide-mobile" />
        </div>

        <!-- Right: EU badge, theme, lang, notifications -->
        <div class="topbar-right">
          <!-- EU badge — hidden on small screens -->
          <span class="eu-badge hide-mobile" aria-label="EU ESPR-konform">
            <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 2L17 5V10c0 3.866-3.134 7-7 8-3.866-1-7-4.134-7-8V5l7-3Z"
                stroke="currentColor" stroke-width="1.5"/>
              <path d="M7 10l2 2 4-4"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            EU ESPR
          </span>

          <!-- Theme toggle -->
          <ThemeToggle />

          <!-- Language selector -->
          <LanguageSwitcher />

          <!-- Notifications -->
          <div class="notif-wrap" ref="notifRef">
            <button
              class="icon-btn notif-btn"
              :aria-label="`${t('nav.notifications')} ${notifs.unreadCount > 0 ? `(${notifs.unreadCount})` : ''}`"
              :aria-expanded="showNotif"
              @click="showNotif = !showNotif"
            >
              <Bell :size="16" aria-hidden="true"/>
              <span v-if="notifs.unreadCount > 0" class="notif-badge" aria-hidden="true">
                {{ notifs.unreadCount > 9 ? '9+' : notifs.unreadCount }}
              </span>
            </button>

            <Transition name="panel">
              <div v-if="showNotif" class="notif-panel" role="dialog" :aria-label="t('nav.notifications')">
                <div class="notif-header">
                  <span class="notif-title">{{ t('nav.notifications') }}</span>
                  <button class="notif-mark-all" @click="notifs.markAllRead()">
                    {{ t('notifications.markAllRead') }}
                  </button>
                </div>
                <div class="notif-list" role="list">
                  <div
                    v-for="n in notifs.all.slice(0, 6)"
                    :key="n.id"
                    class="notif-item"
                    :class="{ unread: !n.readAt }"
                    role="listitem"
                    @click="notifs.markRead(n.id)"
                  >
                    <div class="notif-dot" :class="`ndot-${n.severity}`" aria-hidden="true" />
                    <div class="notif-body">
                      <p class="notif-item-title">{{ n.title }}</p>
                      <p class="notif-item-body">{{ n.body }}</p>
                      <time class="notif-time">{{ formatNotifTime(n.createdAt) }}</time>
                    </div>
                    <NuxtLink
                      v-if="n.actionRoute"
                      :to="n.actionRoute"
                      class="notif-action"
                      @click.stop="showNotif = false"
                      aria-label="Details ansehen"
                    >→</NuxtLink>
                  </div>
                  <p v-if="notifs.all.length === 0" class="notif-empty">
                    {{ t('notifications.empty') }}
                  </p>
                </div>
                <NuxtLink
                  to="/dashboard/settings/notifications"
                  class="notif-footer"
                  @click="showNotif = false"
                >
                  {{ t('notifications.viewAll') }} →
                </NuxtLink>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- ── Page content ── -->
      <main class="page-content" id="main-content" tabindex="-1">
        <slot />
      </main>

      <!-- ── Mobile bottom nav ── -->
      <nav class="mobile-bottom-nav show-mobile safe-bottom" aria-label="Mobile Navigation">
        <NuxtLink to="/dashboard" class="mbn-item" active-class="active" exact>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
            <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
            <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
            <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <span>{{ t('nav.dashboard') }}</span>
        </NuxtLink>
        <NuxtLink to="/dashboard/products" class="mbn-item" active-class="active">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 2L17 6V14L10 18L3 14V6L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
          <span>{{ t('nav.passports') }}</span>
        </NuxtLink>
        <NuxtLink to="/dashboard/compliance" class="mbn-item" active-class="active">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 2L17 5V10c0 3.866-3.134 7-7 8C3.134 17 0 13.866 0 10V5l10-3Z" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <span>{{ t('nav.compliance') }}</span>
        </NuxtLink>
        <NuxtLink to="/dashboard/settings" class="mbn-item" active-class="active">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 1v2M10 17v2M1 10h2M17 10h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>{{ t('nav.settings') }}</span>
        </NuxtLink>
      </nav>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { Bell, LogOut, LayoutDashboard, BadgeInfo, Settings, Truck, ShieldCheck, FileText } from '@lucide/vue';

const { t }    = useI18n()
const auth     = useAuthStore()
const notifs   = useNotificationsStore()
const store    = useProductsStore()

// ── Responsive state ──────────────────────────
const { width }   = useWindowSize()
const isMobile    = computed(() => width.value < 768)
const sidebarOpen = ref(false)

// Close sidebar when switching to desktop
watch(isMobile, (mobile) => {
  if (!mobile) sidebarOpen.value = false
})

// Close sidebar on route change (mobile)
const route = useRoute()
watch(() => route.path, () => {
  if (isMobile.value) sidebarOpen.value = false
})

function closeSidebarOnMobile() {
  if (isMobile.value) sidebarOpen.value = false
}

// ── KPI stats from store ──────────────────────
const productStats = computed(() => store.stats)

// ── Notifications panel ───────────────────────
const showNotif = ref(false)
const notifRef  = ref<HTMLElement | null>(null)

function onClickOutside(e: MouseEvent) {
  if (notifRef.value && !notifRef.value.contains(e.target as Node)) {
    showNotif.value = false
  }
}

onMounted(()  => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

function formatNotifTime(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return t('time.justNow')
  if (mins  < 60) return t('time.minutesAgo', { n: mins })
  if (hours < 24) return t('time.hoursAgo', { n: hours })
  return t('time.daysAgo', { n: days })
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════
   SHELL
═══════════════════════════════════════════════ */
.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr;
  min-height: 100vh;
  background: var(--color-bg);
}

/* ═══════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════ */
.sidebar {
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: var(--sidebar-w);
  z-index: var(--z-sidebar);
  overflow-y: auto;
  overflow-x: hidden;
}

/* ── Logo ── */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 1.1rem 1rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.logo-mark {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: var(--color-brand);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.logo-text-wrap { flex: 1; min-width: 0; }
.logo-text { display: block; font-size: 13px; font-weight: 600; color: var(--color-text-1); }
.logo-sub  { display: block; font-size: 10px; color: var(--color-text-3); margin-top: 1px; }

.sidebar-close {
  background: none; border: none; cursor: pointer;
  color: var(--color-text-3); display: flex; align-items: center;
  padding: 4px; border-radius: 6px; flex-shrink: 0;
}
.sidebar-close:hover { background: var(--color-surface-2); color: var(--color-text-1); }

/* ── Nav ── */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.nav-section-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.75rem 0.5rem 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-text-2);
  text-decoration: none;
  transition: background var(--t-fast), color var(--t-fast);
}

.nav-item:hover   { background: var(--color-surface-2); color: var(--color-text-1); }
.nav-item.active  { background: var(--color-brand-light); color: var(--color-brand-dark); font-weight: 500; }

.nav-icon { width: 16px; height: 16px; flex-shrink: 0; }

.nav-badge {
  margin-left: auto;
  font-size: 10px; font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}
.nav-badge.crit { background: var(--color-crit-bg); color: var(--color-crit); }
.nav-badge.warn { background: var(--color-warn-bg); color: var(--color-warn); }

/* ── Footer ── */
.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px;
  border-radius: var(--radius-md);
  background: var(--color-surface-2);
}

.avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: var(--color-brand);
  color: white;
  font-size: 11px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.user-info  { flex: 1; min-width: 0; }
.user-name  { display: block; font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role  { display: block; font-size: 11px; color: var(--color-text-3); }

.logout-btn {
  background: none; border: none; cursor: pointer;
  color: var(--color-text-3); padding: 3px;
  display: flex; align-items: center; border-radius: 5px;
}
.logout-btn:hover { color: var(--color-crit); background: var(--color-crit-bg); }

/* ── Sidebar overlay (mobile) ── */
.sidebar-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  z-index: calc(var(--z-sidebar) - 1);
}

/* ═══════════════════════════════════════════════
   MAIN AREA
═══════════════════════════════════════════════ */
.main-area {
  grid-column: 2;
  /* margin-left: var(--sidebar-w); */
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ═══════════════════════════════════════════════
   TOPBAR
═══════════════════════════════════════════════ */
.topbar {
  position: sticky; top: 0;
  z-index: var(--z-topbar);
  height: var(--topbar-h);
  background: color-mix(in srgb, var(--color-bg) 85%, transparent);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--page-px);
  gap: 12px;
}

.topbar-left  { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.topbar-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

/* ── Hamburger ── */
.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 36px; height: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
  padding: 8px;
  flex-shrink: 0;
}
.hamburger:hover { background: var(--color-surface-2); }

.ham-line {
  display: block;
  height: 1.5px;
  background: var(--color-text-2);
  border-radius: 1px;
  transition: transform var(--t-base), opacity var(--t-base), width var(--t-base);
  transform-origin: center;
}

.ham-line:nth-child(1).open { transform: translateY(6.5px) rotate(45deg); }
.ham-line:nth-child(2).open { opacity: 0; transform: scaleX(0); }
.ham-line:nth-child(3).open { transform: translateY(-6.5px) rotate(-45deg); }

/* ── EU badge ── */
.eu-badge {
  font-size: 11px;
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 20px;
  background: var(--color-ok-bg); color: var(--color-brand-dark);
  border: 1px solid color-mix(in srgb, var(--color-brand) 25%, transparent);
  white-space: nowrap;
}

/* ── Icon button ── */
.icon-btn {
  position: relative;
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--color-text-2);
}
.icon-btn:hover { background: var(--color-surface-2); color: var(--color-text-1); }

/* ═══════════════════════════════════════════════
   NOTIFICATION PANEL
═══════════════════════════════════════════════ */
.notif-wrap { position: relative; }

.notif-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 16px; height: 16px;
  background: var(--color-crit); color: #fff;
  font-size: 9px; font-weight: 700;
  border-radius: 8px; padding: 0 3px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--color-bg);
  pointer-events: none;
}

.notif-panel {
  position: absolute; top: calc(100% + 8px); right: 0;
  width: 340px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.notif-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px 10px;
  border-bottom: 1px solid var(--color-border);
}
.notif-title    { font-size: 13px; font-weight: 600; }
.notif-mark-all { font-size: 11px; color: var(--color-brand); background: none; border: none; cursor: pointer; }
.notif-mark-all:hover { color: var(--color-brand-dark); }

.notif-list     { max-height: 320px; overflow-y: auto; }

.notif-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 14px; border-bottom: 1px solid var(--color-border);
  cursor: pointer; transition: background var(--t-fast);
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover      { background: var(--color-surface-2); }
.notif-item.unread     { background: color-mix(in srgb, var(--color-brand) 5%, transparent); }

.notif-dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.ndot-crit { background: var(--color-crit); }
.ndot-warn { background: var(--color-warn); }
.ndot-ok   { background: var(--color-ok); }
.ndot-info { background: var(--color-info); }

.notif-body       { flex: 1; min-width: 0; }
.notif-item-title { font-size: 12px; font-weight: 500; line-height: 1.4; margin: 0; }
.notif-item-body  { font-size: 11px; color: var(--color-text-2); margin: 2px 0 0; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.notif-time       { display: block; font-size: 10px; color: var(--color-text-3); margin-top: 4px; }
.notif-action     { font-size: 13px; color: var(--color-brand); text-decoration: none; flex-shrink: 0; align-self: center; }
.notif-empty      { padding: 2rem; text-align: center; font-size: 13px; color: var(--color-text-3); margin: 0; }

.notif-footer {
  display: block; text-align: center;
  padding: 10px; font-size: 12px; color: var(--color-brand);
  text-decoration: none; border-top: 1px solid var(--color-border);
  background: var(--color-surface-2);
}
.notif-footer:hover { color: var(--color-brand-dark); }

/* ═══════════════════════════════════════════════
   PAGE CONTENT
═══════════════════════════════════════════════ */
.page-content {
  flex: 1;
  padding: 1.75rem var(--page-px);
  /* Space for mobile bottom nav */
  padding-bottom: calc(1.75rem + 60px);
}

/* ═══════════════════════════════════════════════
   MOBILE BOTTOM NAV
═══════════════════════════════════════════════ */
.mobile-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: var(--z-topbar);
  height: 60px;
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-top: 1px solid var(--color-border);
  display: none;
  align-items: center;
  justify-content: space-around;
  padding: 0 8px;
}

.mbn-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 12px;
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--color-text-3);
  font-size: 10px;
  font-weight: 500;
  flex: 1;
  transition: color var(--t-fast), background var(--t-fast);
}
.mbn-item:hover  { color: var(--color-text-1); }
.mbn-item.active { color: var(--color-brand); }

/* ═══════════════════════════════════════════════
   TRANSITIONS
═══════════════════════════════════════════════ */
.overlay-enter-active, .overlay-leave-active { transition: opacity var(--t-base); }
.overlay-enter-from, .overlay-leave-to       { opacity: 0; }

.panel-enter-active, .panel-leave-active {
  transition: opacity var(--t-fast), transform var(--t-fast);
}
.panel-enter-from, .panel-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

/* ═══════════════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════════════ */

/* ── Tablet (md) ── */
@media (max-width: 1024px) {
  :root { --sidebar-w: 200px; }
}

/* ── Mobile (< 768px) ── */
@media (max-width: 767px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    transform: translateX(-100%);
    transition: transform var(--t-base), box-shadow var(--t-base);
    width: 260px;
    box-shadow: none;
  }

  .app-shell.sidebar-open .sidebar {
    transform: translateX(0);
    box-shadow: var(--shadow-xl);
  }

  .main-area {
    grid-column: 1;
    margin-left: 0;
  }

  .mobile-bottom-nav {
    display: flex;
  }

  .page-content {
    padding: 1rem var(--page-px);
    padding-bottom: calc(1rem + 72px);
  }

  .notif-panel {
    position: fixed;
    top: calc(var(--topbar-h) + 4px);
    left: 12px;
    right: 12px;
    width: auto;
  }
}

/* ── Small mobile ── */
@media (max-width: 400px) {
  :root { --page-px: 0.75rem; }
}

/* ── Hide/show helpers ── */
@media (max-width: 767px) {
  .hide-mobile  { display: none !important; }
}
@media (min-width: 768px) {
  .show-mobile  { display: none !important; }
  /* Reset bottom nav padding on desktop */
  .page-content { padding-bottom: 1.75rem; }
}
</style>
