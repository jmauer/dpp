import { defineStore } from 'pinia'
import { TOUR_STEPS, type TourStep } from '~/utils/tour-steps'

/**
 * Gefuehrte Einfuehrung durch die App.
 *
 * Der Store haelt nur den Ablauf – gezeichnet wird in
 * `components/tour/TourSpotlight.vue`, die Inhalte stehen in
 * `utils/tour-steps.ts`.
 *
 * Die Fuehrung laeuft ueber mehrere Seiten hinweg. Zwei Wege fuehren jeweils
 * zum naechsten Schritt:
 *   • `nextRoute`      – „Weiter“ navigiert selbst dorthin
 *   • `advanceOnRoute` – der Nutzer klickt das echte Element und landet dort
 * Beide Wege enden im selben Schritt, deshalb blockiert die Fuehrung nie:
 * „Weiter“ ist immer klickbar, auch wenn der Nutzer nichts ausgefuellt hat.
 */

/** Pro Konto merken, ob die Fuehrung schon lief. */
const DONE_KEY_PREFIX = 'dpp-tour-done:'

function doneKey(userKey: string): string {
  return `${DONE_KEY_PREFIX}${userKey.toLowerCase()}`
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export const useTourStore = defineStore('tour', () => {

  // ── State ─────────────────────────────────

  const isActive  = ref(false)
  const stepIndex = ref(0)

  /**
   * Aktionen, die einzelne Seiten anbieten (z.B. „Beispieldaten einfügen“ im
   * Anlegen-Formular). Die Seite traegt sich beim Mounten ein und wieder aus –
   * so muss die Fuehrung nichts ueber den Aufbau der Seite wissen.
   */
  const actions = ref<Record<string, () => void>>({})

  // ── Getters ───────────────────────────────

  const steps       = computed<TourStep[]>(() => TOUR_STEPS)
  const total       = computed(() => steps.value.length)
  const step        = computed<TourStep | null>(() => steps.value[stepIndex.value] ?? null)
  const isFirst     = computed(() => stepIndex.value === 0)
  const isLast      = computed(() => stepIndex.value === total.value - 1)
  const progressPct = computed(() => Math.round(((stepIndex.value + 1) / total.value) * 100))

  /** Aktion des aktuellen Schritts, sofern die Seite sie bereitgestellt hat. */
  const stepAction = computed(() => {
    const key = step.value?.action
    return key ? actions.value[key] ?? null : null
  })

  // ── Persistenz ────────────────────────────

  /** Wurde die Fuehrung fuer dieses Konto bereits abgeschlossen oder verworfen? */
  function hasCompleted(userKey: string): boolean {
    if (!canUseStorage() || !userKey) return false
    try {
      return localStorage.getItem(doneKey(userKey)) === '1'
    } catch {
      return false
    }
  }

  function _markCompleted(userKey: string) {
    if (!canUseStorage() || !userKey) return
    try {
      localStorage.setItem(doneKey(userKey), '1')
    } catch { /* Storage voll oder gesperrt – dann laeuft sie eben erneut */ }
  }

  /** Nur fuer die Einstellungen: Merker loeschen, damit sie wieder automatisch startet. */
  function resetCompletion(userKey: string) {
    if (!canUseStorage() || !userKey) return
    try {
      localStorage.removeItem(doneKey(userKey))
    } catch { /* egal */ }
  }

  // ── Steuerung ─────────────────────────────

  function start(fromIndex = 0) {
    stepIndex.value = Math.min(Math.max(fromIndex, 0), total.value - 1)
    isActive.value  = true
  }

  /**
   * Beim ersten Login starten – aber nur, wenn die Fuehrung fuer dieses Konto
   * noch nie lief. Gibt zurueck, ob sie tatsaechlich gestartet wurde.
   */
  function startIfFirstVisit(userKey: string): boolean {
    if (!userKey || hasCompleted(userKey)) return false
    start()
    return true
  }

  function next() {
    if (isLast.value) return finish()
    stepIndex.value++
  }

  function prev() {
    if (isFirst.value) return
    stepIndex.value--
  }

  function goTo(index: number) {
    if (index < 0 || index >= total.value) return
    stepIndex.value = index
  }

  /** Vorzeitig beenden. Zaehlt als erledigt – niemand will sie zweimal wegklicken. */
  function skip(userKey: string) {
    isActive.value = false
    _markCompleted(userKey)
  }

  function finish(userKey?: string) {
    isActive.value = false
    if (userKey) _markCompleted(userKey)
  }

  /**
   * Wird von `advanceOnRoute` benutzt: erreicht der Nutzer die Zielroute des
   * aktuellen Schritts, geht es von selbst weiter.
   */
  function advanceIfRouteMatches(path: string): boolean {
    const pattern = step.value?.advanceOnRoute
    if (!pattern || !isActive.value) return false
    const matches = typeof pattern === 'string' ? path === pattern : pattern.test(path)
    if (!matches) return false
    next()
    return true
  }

  // ── Seiten-Aktionen ───────────────────────

  function registerAction(key: string, fn: () => void) {
    actions.value = { ...actions.value, [key]: fn }
  }

  function unregisterAction(key: string) {
    const { [key]: _removed, ...rest } = actions.value
    actions.value = rest
  }

  return {
    // state
    isActive,
    stepIndex,
    // getters
    steps,
    step,
    total,
    isFirst,
    isLast,
    progressPct,
    stepAction,
    // actions
    start,
    startIfFirstVisit,
    next,
    prev,
    goTo,
    skip,
    finish,
    advanceIfRouteMatches,
    hasCompleted,
    resetCompletion,
    registerAction,
    unregisterAction,
  }
})
