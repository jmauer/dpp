<template>
  <div class="theme-toggle" ref="wrapper">
    <button
      class="toggle-btn"
      :title="isDark ? 'Dark Mode aktiv' : 'Light Mode aktiv'"
      :aria-label="isDark ? 'Zu Light Mode wechseln' : 'Zu Dark Mode wechseln'"
      @click="open = !open"
    >
      <!-- Sun -->
      <Sun :size="16" v-if="!isDark" aria-hidden="true"/>
      <!-- Moon -->
      <Moon :size="16" v-else aria-hidden="true"/>
    </button>

    <!-- Dropdown -->
    <div v-if="open" class="theme-menu" role="menu">
      <button
        v-for="opt in options"
        :key="opt.value"
        class="theme-opt"
        :class="{ active: theme === opt.value }"
        role="menuitem"
        @click="pick(opt.value)"
      >
        <span class="opt-icon">{{ opt.icon }}</span>
        <span class="opt-label">{{ opt.label }}</span>
        <Check :size="12" v-if="theme === opt.value" class="opt-check" aria-hidden="true"/>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Sun, Moon, Check } from '@lucide/vue';

const { theme, isDark, setTheme } = useTheme()

const open    = ref(false)
const wrapper = ref<HTMLElement | null>(null)

const options = [
  { value: 'light',  icon: '☀️', label: 'Hell'   },
  { value: 'dark',   icon: '🌙', label: 'Dunkel' },
  { value: 'system', icon: '💻', label: 'System' },
] as const

function pick(val: 'light' | 'dark' | 'system') {
  setTheme(val)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (wrapper.value && !wrapper.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(()  => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.theme-toggle { position: relative; }

.toggle-btn {
  width: 32px; height: 32px;
  color: var(--color-text-2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.toggle-btn:hover { background: var(--color-surface-2); color: var(--color-text-1); }

.theme-menu {
  position: absolute; top: calc(100% + 6px); right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  min-width: 130px;
  z-index: var(--z-modal);
}

.theme-opt {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 9px 12px;
  font-size: 13px; font-family: inherit;
  background: none; border: none; cursor: pointer;
  color: var(--color-text-1); text-align: left;
}
.theme-opt:hover { background: var(--color-surface-2); }
.theme-opt.active { font-weight: 500; }

.opt-icon  { font-size: 14px; }
.opt-label { flex: 1; }
.opt-check { color: var(--color-brand); flex-shrink: 0; }
</style>
