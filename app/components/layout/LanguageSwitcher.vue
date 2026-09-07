<template>
  <div class="lang-switcher" ref="wrapper">
    <button
      class="lang-btn"
      :aria-label="`Sprache: ${currentLocale?.name}`"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="open = !open"
    >
      <span class="lang-flag" aria-hidden="true">{{ currentLocale?.flag }}</span>
      <span class="lang-code hide-xs">{{ (currentLocale?.code ?? 'de').toUpperCase() }}</span>
      <svg class="lang-chevron" :class="{ rotated: open }" width="10" height="10" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <Transition name="lang-panel">
      <div v-if="open" class="lang-panel" role="listbox" :aria-label="'Sprache wählen'">

        <!-- Search (only shown when many options) -->
        <div class="lang-search-wrap">
          <svg class="lang-search-icon" width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/>
            <path d="M15 15l-2.5-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input
            ref="searchInput"
            v-model="query"
            class="lang-search"
            type="search"
            placeholder="Sprache suchen…"
            autocomplete="off"
            aria-label="Sprache suchen"
            @keydown.esc="open = false"
            @keydown.down.prevent="focusItem(0)"
          />
        </div>

        <div class="lang-list" role="group">
          <!-- Priority languages always at top -->
          <div v-if="!query" class="lang-group-label">Häufig verwendet</div>
          <button
            v-for="loc in filteredPriority"
            :key="loc.code"
            class="lang-item"
            :class="{ active: locale === loc.code }"
            role="option"
            :aria-selected="locale === loc.code"
            @click="pick(loc.code)"
          >
            <span class="item-flag">{{ loc.flag }}</span>
            <span class="item-name">{{ loc.name }}</span>
            <svg v-if="locale === loc.code" class="item-check" width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <div v-if="!query && filteredRest.length" class="lang-divider" role="separator" />
          <div v-if="!query && filteredRest.length" class="lang-group-label">Alle EU-Sprachen</div>

          <button
            v-for="loc in filteredRest"
            :key="loc.code"
            class="lang-item"
            :class="{ active: locale === loc.code }"
            role="option"
            :aria-selected="locale === loc.code"
            @click="pick(loc.code)"
          >
            <span class="item-flag">{{ loc.flag }}</span>
            <span class="item-name">{{ loc.name }}</span>
            <svg v-if="locale === loc.code" class="item-check" width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <p v-if="filteredPriority.length === 0 && filteredRest.length === 0" class="lang-empty">
            Keine Sprache gefunden
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const open        = ref(false)
const query       = ref('')
const wrapper     = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)

// Priority locales shown at top (most common EU languages)
const PRIORITY = ['de', 'en', 'fr', 'es', 'it', 'pl', 'nl']

const allLocales = computed(() =>
  (locales.value as Array<{ code: string; name: string; flag: string; iso: string }>)
    .map(l => ({ code: l.code, name: l.name, flag: l.flag ?? '🌐', iso: l.iso }))
)

const currentLocale = computed(() =>
  allLocales.value.find(l => l.code === locale.value)
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allLocales.value
  return allLocales.value.filter(l =>
    l.name.toLowerCase().includes(q) ||
    l.code.toLowerCase().includes(q) ||
    (l.iso ?? '').toLowerCase().includes(q)
  )
})

const filteredPriority = computed(() =>
  query.value
    ? filtered.value.filter(l => PRIORITY.includes(l.code))
    : allLocales.value.filter(l => PRIORITY.includes(l.code))
)

const filteredRest = computed(() =>
  query.value
    ? filtered.value.filter(l => !PRIORITY.includes(l.code))
    : allLocales.value.filter(l => !PRIORITY.includes(l.code))
)

async function pick(code: string) {
  await setLocale(code)
  open.value  = false
  query.value = ''
}

// Focus search input when panel opens
watch(open, async (v) => {
  if (v) {
    await nextTick()
    searchInput.value?.focus()
  }
})

// Close on outside click
function onClickOutside(e: MouseEvent) {
  if (wrapper.value && !wrapper.value.contains(e.target as Node)) {
    open.value  = false
    query.value = ''
  }
}

// Close on Escape at document level
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { open.value = false; query.value = '' }
}

function focusItem(idx: number) {
  const items = wrapper.value?.querySelectorAll<HTMLButtonElement>('.lang-item')
  items?.[idx]?.focus()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.lang-switcher { position: relative; }

/* ── Trigger button ── */
.lang-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 9px;
  color: var(--color-text-2);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
}
.lang-btn:hover { background: var(--color-surface-2); color: var(--color-text-1); }

.lang-flag   { font-size: 14px; line-height: 1; }
.lang-code   { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
.lang-chevron { color: var(--color-text-3); transition: transform var(--t-fast); flex-shrink: 0; }
.lang-chevron.rotated { transform: rotate(180deg); }

/* ── Panel ── */
.lang-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 220px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  z-index: var(--z-modal);
}

/* ── Search ── */
.lang-search-wrap {
  position: relative;
  padding: 8px;
  border-bottom: 1px solid var(--color-border);
}
.lang-search-icon {
  position: absolute;
  left: 16px; top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-3);
  pointer-events: none;
}
.lang-search {
  width: 100%;
  padding: 6px 8px 6px 28px;
  font-size: 12px;
  font-family: inherit;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-2);
  color: var(--color-text-1);
  outline: none;
}
.lang-search:focus {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-brand) 15%, transparent);
}
.lang-search::placeholder { color: var(--color-text-3); }
/* Hide default search 'x' */
.lang-search::-webkit-search-cancel-button { display: none; }

/* ── List ── */
.lang-list {
  max-height: 260px;
  overflow-y: auto;
  padding: 4px;
}

.lang-group-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 6px 8px 3px;
}

.lang-divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}

.lang-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 8px;
  border-radius: var(--radius-md);
  border: none;
  background: none;
  font-size: 13px;
  font-family: inherit;
  color: var(--color-text-1);
  cursor: pointer;
  text-align: left;
}
.lang-item:hover { background: var(--color-surface-2); }
.lang-item.active { font-weight: 500; color: var(--color-brand); }

.item-flag  { font-size: 15px; line-height: 1; flex-shrink: 0; }
.item-name  { flex: 1; }
.item-check { color: var(--color-brand); flex-shrink: 0; }

.lang-empty {
  padding: 1rem;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-3);
  margin: 0;
}

/* ── Transition ── */
.lang-panel-enter-active,
.lang-panel-leave-active {
  transition: opacity var(--t-fast), transform var(--t-fast);
}
.lang-panel-enter-from,
.lang-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

/* ── Responsive ── */
@media (max-width: 400px) {
  .hide-xs { display: none; }
  .lang-btn { padding: 0 6px; }
  .lang-panel { right: 0; left: 0; width: auto; }
}
</style>
