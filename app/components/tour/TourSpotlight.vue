<template>
  <Teleport to="body">
    <div v-if="tour.isActive" class="tour-root" role="dialog" aria-modal="false" :aria-label="`Einführung, Schritt ${tour.stepIndex + 1} von ${tour.total}`">

      <!-- Abdunklung. Mit Ziel entsteht das „Loch“ ueber den riesigen
           Schlagschatten des Spotlight-Rahmens, ohne Ziel deckt diese
           Flaeche den Bildschirm. -->
      <div v-if="!spot" class="tour-dim" />
      <div
        v-else
        class="tour-spot"
        :style="{
          top:    spot.top + 'px',
          left:   spot.left + 'px',
          width:  spot.width + 'px',
          height: spot.height + 'px',
        }"
      />

      <!-- Sprechblase -->
      <div
        ref="bubbleEl"
        class="tour-bubble"
        :class="[`tb-${resolvedPlacement}`, { centered: !spot }]"
        :style="bubbleStyle"
      >
        <div v-if="spot" class="tour-arrow" :style="arrowStyle" aria-hidden="true" />

        <div class="tour-head">
          <span class="tour-count">Schritt {{ tour.stepIndex + 1 }} / {{ tour.total }}</span>
          <button class="tour-close" aria-label="Führung beenden" @click="handleSkip">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <h2 class="tour-title">{{ step?.title }}</h2>
        <p class="tour-body">{{ step?.body }}</p>

        <button
          v-if="tour.stepAction && step?.actionLabel"
          class="tour-action"
          @click="runAction"
        >
          {{ actionDone ? '✓ Eingefügt' : step.actionLabel }}
        </button>

        <div class="tour-progress" aria-hidden="true">
          <span
            v-for="(s, i) in tour.steps"
            :key="s.id"
            class="tour-dot"
            :class="{ active: i === tour.stepIndex, done: i < tour.stepIndex }"
          />
        </div>

        <div class="tour-actions">
          <button class="tour-btn ghost" @click="handleSkip">Führung beenden</button>
          <div class="tour-nav">
            <button v-if="!tour.isFirst" class="tour-btn secondary" @click="tour.prev()">Zurück</button>
            <button class="tour-btn primary" @click="handleNext">
              {{ step?.nextLabel ?? (tour.isLast ? 'Fertig' : 'Weiter') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { TourPlacement } from '~/utils/tour-steps'

const tour  = useTourStore()
const auth  = useAuthStore()
const route = useRoute()

const step = computed(() => tour.step)

/** Luft zwischen hervorgehobenem Element und Spotlight-Kante */
const SPOT_PADDING = 8
/** Abstand zwischen Spotlight und Sprechblase */
const BUBBLE_GAP   = 14
/** Mindestabstand der Sprechblase zum Fensterrand */
const VIEWPORT_PAD = 12
const BUBBLE_WIDTH = 330

const targetEl = ref<HTMLElement | null>(null)
const bubbleEl = ref<HTMLElement | null>(null)
const spot     = ref<{ top: number; left: number; width: number; height: number } | null>(null)
const bubblePos = ref<{ top: number; left: number }>({ top: 0, left: 0 })
const resolvedPlacement = ref<TourPlacement>('bottom')
const actionDone = ref(false)

const bubbleStyle = computed(() => spot.value
  ? { top: `${bubblePos.value.top}px`, left: `${bubblePos.value.left}px`, width: `${BUBBLE_WIDTH}px` }
  : { width: `${BUBBLE_WIDTH}px` },
)

/** Pfeilspitze mittig auf das Ziel ausrichten, auch wenn die Blase verschoben wurde. */
const arrowStyle = computed(() => {
  if (!spot.value) return {}
  const s = spot.value
  const b = bubblePos.value
  return resolvedPlacement.value === 'top' || resolvedPlacement.value === 'bottom'
    ? { left: `${Math.max(16, Math.min(BUBBLE_WIDTH - 16, s.left + s.width / 2 - b.left))}px` }
    : { top:  `${Math.max(16, s.top + s.height / 2 - b.top)}px` }
})

// ─────────────────────────────────────────────
// Ziel finden und vermessen
// ─────────────────────────────────────────────

/**
 * Nach einem Seitenwechsel steht das Element nicht sofort im DOM.
 * Deshalb kurz darauf warten statt sofort aufzugeben.
 */
function waitForElement(selector: string, timeoutMs = 2500): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLElement>(selector)
    if (existing) return resolve(existing)

    const observer = new MutationObserver(() => {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) { observer.disconnect(); clearTimeout(timer); resolve(el) }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const timer = setTimeout(() => { observer.disconnect(); resolve(null) }, timeoutMs)
  })
}

/** Spotlight- und Blasenposition aus der aktuellen Lage des Ziels berechnen. */
function measure() {
  const el = targetEl.value
  if (!el || !el.isConnected) { spot.value = null; return }

  const r = el.getBoundingClientRect()
  // Unsichtbare Elemente (z.B. auf Mobilgeraeten ausgeblendet) nicht hervorheben.
  if (r.width === 0 && r.height === 0) { spot.value = null; return }

  spot.value = {
    top:    r.top    - SPOT_PADDING,
    left:   r.left   - SPOT_PADDING,
    width:  r.width  + SPOT_PADDING * 2,
    height: r.height + SPOT_PADDING * 2,
  }
  positionBubble(spot.value)
}

/** Bevorzugte Seite nehmen, bei Platzmangel kippen, dann ins Fenster klemmen. */
function positionBubble(s: { top: number; left: number; width: number; height: number }) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const bh = bubbleEl.value?.offsetHeight ?? 220

  let placement = step.value?.placement ?? 'bottom'

  const fits: Record<TourPlacement, boolean> = {
    bottom: s.top + s.height + BUBBLE_GAP + bh < vh - VIEWPORT_PAD,
    top:    s.top - BUBBLE_GAP - bh > VIEWPORT_PAD,
    right:  s.left + s.width + BUBBLE_GAP + BUBBLE_WIDTH < vw - VIEWPORT_PAD,
    left:   s.left - BUBBLE_GAP - BUBBLE_WIDTH > VIEWPORT_PAD,
  }

  if (!fits[placement]) {
    const opposite: Record<TourPlacement, TourPlacement> = {
      bottom: 'top', top: 'bottom', right: 'left', left: 'right',
    }
    placement = fits[opposite[placement]]
      ? opposite[placement]
      : (['bottom', 'top', 'right', 'left'] as TourPlacement[]).find(p => fits[p]) ?? placement
  }
  resolvedPlacement.value = placement

  let top  = 0
  let left = 0
  switch (placement) {
    case 'top':    top = s.top - BUBBLE_GAP - bh;  left = s.left + s.width / 2 - BUBBLE_WIDTH / 2; break
    case 'bottom': top = s.top + s.height + BUBBLE_GAP; left = s.left + s.width / 2 - BUBBLE_WIDTH / 2; break
    case 'left':   left = s.left - BUBBLE_GAP - BUBBLE_WIDTH; top = s.top + s.height / 2 - bh / 2; break
    case 'right':  left = s.left + s.width + BUBBLE_GAP;      top = s.top + s.height / 2 - bh / 2; break
  }

  bubblePos.value = {
    left: Math.max(VIEWPORT_PAD, Math.min(left, vw - BUBBLE_WIDTH - VIEWPORT_PAD)),
    top:  Math.max(VIEWPORT_PAD, Math.min(top,  vh - bh - VIEWPORT_PAD)),
  }
}

/** Ziel des aktuellen Schritts auflösen, sichtbar scrollen und vermessen. */
async function resolveTarget() {
  actionDone.value = false
  const target = step.value?.target
  if (!target) { targetEl.value = null; spot.value = null; return }

  const el = await waitForElement(`[data-tour="${target}"]`)
  targetEl.value = el
  if (!el) { spot.value = null; return }

  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
  await nextTick()
  measure()
}

// ─────────────────────────────────────────────
// Laufende Neuvermessung
//
// Statt einzelner scroll/resize-Listener eine rAF-Schleife, solange die
// Fuehrung laeuft: sie erwischt auch Layoutänderungen ohne Event – etwa das
// weiche Scrollen oben oder eine Seite, die noch Daten nachlaedt.
// ─────────────────────────────────────────────

let rafId: number | null = null

function loop() {
  measure()
  rafId = requestAnimationFrame(loop)
}

/**
 * Schritt anwenden: bei Bedarf zur Zielseite navigieren, dann das
 * hervorzuhebende Element suchen.
 */
async function applyStep() {
  const target = step.value?.route
  if (target && route.path !== target) await navigateTo(target)
  await resolveTarget()
}

function startMeasuring() {
  applyStep()
  if (rafId === null) rafId = requestAnimationFrame(loop)
}

function stopMeasuring() {
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
  spot.value = null
}

// Kein `immediate`: der Watcher liefe sonst schon beim Server-Rendering und
// griffe dort auf `document` zu. Ein bereits laufender Durchgang – etwa nach
// einem Seitenwechsel – wird stattdessen in `onMounted` aufgenommen.
watch(() => tour.isActive, (active) => {
  if (active) startMeasuring()
  else        stopMeasuring()
})

onBeforeUnmount(stopMeasuring)

// ─────────────────────────────────────────────
// Ablauf
// ─────────────────────────────────────────────

// Schrittwechsel: bei Bedarf navigieren, dann neues Ziel suchen.
watch(() => tour.stepIndex, () => {
  if (!tour.isActive) return
  applyStep()
})

// Erreicht der Nutzer die Zielroute selbst, geht es von allein weiter.
watch(() => route.path, (path) => {
  if (!tour.isActive) return
  if (tour.advanceIfRouteMatches(path)) return
  resolveTarget()
})

const userKey = computed(() => auth.user?.email ?? '')

async function handleNext() {
  if (tour.isLast) {
    tour.finish(userKey.value)
    return
  }

  const before = tour.stepIndex
  const target = step.value?.nextRoute
  if (target && route.path !== target) await navigateTo(target)

  // Hat die Navigation den Schritt bereits weitergeschaltet (`advanceOnRoute`),
  // darf hier nicht noch einmal gezaehlt werden.
  if (tour.stepIndex === before) tour.next()
}

function handleSkip() {
  tour.skip(userKey.value)
}

function runAction() {
  tour.stepAction?.()
  actionDone.value = true
}

// Tastatur: Esc beendet, Pfeile blättern.
function onKey(e: KeyboardEvent) {
  if (!tour.isActive) return
  if (e.key === 'Escape')     { e.preventDefault(); handleSkip() }
  if (e.key === 'ArrowRight') { e.preventDefault(); handleNext() }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); tour.prev() }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  if (tour.isActive) startMeasuring()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.tour-root { position: fixed; inset: 0; z-index: 1000; pointer-events: none; }

/* Ohne Ziel: ganzer Bildschirm gedimmt */
.tour-dim { position: absolute; inset: 0; background: rgba(12, 14, 13, 0.62); }

/* Mit Ziel: der Schlagschatten dunkelt alles ausserhalb ab, das Element
   selbst bleibt sichtbar UND bedienbar (pointer-events: none). */
.tour-spot {
  position: absolute;
  border-radius: 10px;
  box-shadow: 0 0 0 9999px rgba(12, 14, 13, 0.62);
  outline: 2px solid var(--color-brand, #1D9E75);
  outline-offset: 0;
  transition: top 0.18s ease, left 0.18s ease, width 0.18s ease, height 0.18s ease;
}

.tour-bubble {
  position: absolute;
  pointer-events: auto;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e3e3e0);
  border-radius: var(--radius-lg, 12px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  padding: 16px;
  transition: top 0.18s ease, left 0.18s ease;
}
.tour-bubble.centered {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}

.tour-arrow {
  position: absolute;
  width: 10px; height: 10px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e3e3e0);
  transform: rotate(45deg);
}
.tb-bottom .tour-arrow { top: -6px;    border-right: none; border-bottom: none; margin-left: -5px; }
.tb-top    .tour-arrow { bottom: -6px; border-left: none;  border-top: none;    margin-left: -5px; }
.tb-right  .tour-arrow { left: -6px;   border-right: none; border-top: none;    margin-top: -5px; }
.tb-left   .tour-arrow { right: -6px;  border-left: none;  border-bottom: none; margin-top: -5px; }

.tour-head  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.tour-count { font-size: 11px; font-weight: 500; color: var(--color-brand, #1D9E75); letter-spacing: 0.02em; }
.tour-close {
  display: flex; padding: 3px; border: none; background: none; cursor: pointer;
  color: var(--color-text-3, #8a8a85); border-radius: 5px;
}
.tour-close:hover { color: var(--color-text-1, #1a1916); background: var(--color-surface-2, #f4f4f2); }

.tour-title { font-size: 15px; font-weight: 600; margin: 0 0 6px; color: var(--color-text-1, #1a1916); }
.tour-body  { font-size: 13px; line-height: 1.55; margin: 0; color: var(--color-text-2, #55554f); }

.tour-action {
  margin-top: 12px; width: 100%;
  font-size: 12px; font-weight: 500; padding: 7px 12px;
  border: 1px dashed var(--color-brand, #1D9E75); border-radius: 8px;
  background: var(--color-brand-bg, rgba(29, 158, 117, 0.1));
  color: var(--color-brand, #1D9E75); cursor: pointer;
}
.tour-action:hover { background: var(--color-brand, #1D9E75); color: #fff; border-style: solid; }

.tour-progress { display: flex; gap: 4px; margin: 14px 0 12px; }
.tour-dot {
  height: 3px; flex: 1; border-radius: 2px;
  background: var(--color-border, #e3e3e0); transition: background 0.2s ease;
}
.tour-dot.done   { background: var(--color-brand, #1D9E75); opacity: 0.4; }
.tour-dot.active { background: var(--color-brand, #1D9E75); }

.tour-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.tour-nav     { display: flex; gap: 8px; }
.tour-btn {
  font-size: 12px; font-weight: 500; padding: 7px 13px;
  border-radius: 8px; cursor: pointer; border: 1px solid transparent;
  font-family: inherit; white-space: nowrap;
}
.tour-btn.primary   { background: var(--color-brand, #1D9E75); color: #fff; }
.tour-btn.primary:hover { filter: brightness(1.06); }
.tour-btn.secondary { background: var(--color-surface, #fff); border-color: var(--color-border, #e3e3e0); color: var(--color-text-1, #1a1916); }
.tour-btn.ghost     { background: none; color: var(--color-text-3, #8a8a85); padding-left: 0; }
.tour-btn.ghost:hover { color: var(--color-text-1, #1a1916); }

@media (max-width: 480px) {
  .tour-bubble { width: calc(100vw - 24px) !important; left: 12px !important; }
  .tour-arrow  { display: none; }
}
</style>
