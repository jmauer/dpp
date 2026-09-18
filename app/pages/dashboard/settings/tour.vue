<template>
  <SettingsLayout>
    <div class="g-page">
      <div class="g-page-header">
        <div>
          <h1 class="g-page-title">Einführung</h1>
          <p class="g-page-sub">Eine geführte Tour durch die App – vom leeren Formular bis zum fertigen Produktpass.</p>
        </div>
      </div>

      <!-- ── Start ── -->
      <section class="settings-section">
        <div class="g-card start-card">
          <div class="start-icon" aria-hidden="true">🧭</div>
          <div class="start-body">
            <h2 class="start-title">Geführte Tour starten</h2>
            <p class="start-desc">
              {{ tour.total }} Schritte, etwa fünf Minuten. Sie legen dabei einen echten Produktpass an –
              auf Wunsch mit Beispieldaten, die Sie danach anpassen oder den Pass wieder löschen können.
            </p>
            <p v-if="alreadyDone" class="start-hint">
              Sie haben die Einführung bereits abgeschlossen. Ein erneuter Start ändert nichts an Ihren Daten.
            </p>
          </div>
          <button class="g-btn g-btn-primary start-btn" @click="start">
            {{ alreadyDone ? 'Erneut starten' : 'Tour starten' }}
          </button>
        </div>
      </section>

      <!-- ── Inhalt der Tour ── -->
      <section class="settings-section" aria-labelledby="s-steps">
        <div class="section-header">
          <h2 id="s-steps" class="section-title">Das kommt darin vor</h2>
          <p class="section-sub-inline">Springen Sie direkt zu einem Schritt</p>
        </div>
        <div class="g-card">
          <ol class="step-list">
            <li v-for="(s, i) in tour.steps" :key="s.id" class="step-row">
              <button class="step-btn" @click="startAt(i)">
                <span class="step-num" aria-hidden="true">{{ i + 1 }}</span>
                <span class="step-text">
                  <span class="step-title">{{ s.title }}</span>
                  <span class="step-body">{{ s.body }}</span>
                </span>
                <span class="step-go" aria-hidden="true">→</span>
              </button>
            </li>
          </ol>
        </div>
      </section>

      <!-- ── Automatischer Start ── -->
      <section class="settings-section" aria-labelledby="s-auto">
        <div class="section-header">
          <h2 id="s-auto" class="section-title">Beim nächsten Login</h2>
        </div>
        <div class="g-card auto-card">
          <div class="auto-row">
            <div>
              <div class="auto-label">Einführung beim ersten Login automatisch zeigen</div>
              <div class="auto-desc">
                {{ alreadyDone
                    ? 'Derzeit aus – die Einführung lief für dieses Konto bereits.'
                    : 'Derzeit an – die Einführung startet beim nächsten Login von selbst.' }}
              </div>
            </div>
            <button
              v-if="alreadyDone"
              class="g-btn g-btn-secondary sm"
              @click="resetAutoStart"
            >
              Wieder aktivieren
            </button>
            <span v-else class="auto-active">Aktiv</span>
          </div>
          <Transition name="fade">
            <p v-if="resetDone" class="auto-saved" role="status">
              ✓ Die Einführung startet beim nächsten Login wieder automatisch.
            </p>
          </Transition>
        </div>
      </section>

    </div>
  </SettingsLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const tour = useTourStore()
const auth = useAuthStore()

const userKey = computed(() => auth.user?.email ?? '')

/**
 * Lokaler Spiegel des Merkers. `hasCompleted` liest den localStorage und ist
 * damit nicht reaktiv – nach einem Zuruecksetzen muss der Wert von Hand
 * nachgezogen werden.
 */
const alreadyDone = ref(false)
const resetDone   = ref(false)

onMounted(() => { alreadyDone.value = tour.hasCompleted(userKey.value) })

function start() {
  tour.start()
}

function startAt(index: number) {
  tour.start(index)
}

function resetAutoStart() {
  tour.resetCompletion(userKey.value)
  alreadyDone.value = false
  resetDone.value   = true
  setTimeout(() => { resetDone.value = false }, 3000)
}
</script>

<style scoped>
.settings-section     { margin-bottom: 24px; }
.section-header       { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; gap: 12px; }
.section-title        { font-size: 14px; font-weight: 600; margin: 0; }
.section-sub-inline   { font-size: 12px; color: var(--color-text-3); margin: 0; }

/* ── Startkarte ── */
.start-card  { display: flex; align-items: center; gap: 18px; padding: 1.25rem; }
.start-icon  {
  width: 46px; height: 46px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; border-radius: 12px;
  background: var(--color-ok-bg);
}
.start-body  { flex: 1; min-width: 0; }
.start-title { font-size: 14px; font-weight: 600; margin: 0 0 4px; }
.start-desc  { font-size: 12px; line-height: 1.55; color: var(--color-text-2); margin: 0; }
.start-hint  { font-size: 12px; color: var(--color-text-3); margin: 6px 0 0; }
.start-btn   { flex-shrink: 0; }

/* ── Schrittliste ── */
.step-list { list-style: none; margin: 0; padding: 0; }
.step-row + .step-row { border-top: 1px solid var(--color-border); }
.step-btn {
  display: flex; align-items: flex-start; gap: 12px; width: 100%;
  padding: 11px 4px; border: none; background: none; cursor: pointer;
  text-align: left; font-family: inherit; color: inherit; border-radius: 8px;
}
.step-btn:hover { background: var(--color-surface-2); }
.step-num {
  width: 22px; height: 22px; flex-shrink: 0; margin-top: 1px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; border-radius: 50%;
  background: var(--color-surface-2); color: var(--color-text-3);
}
.step-btn:hover .step-num { background: var(--color-brand); color: #fff; }
.step-text  { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.step-title { font-size: 13px; font-weight: 500; }
.step-body  {
  font-size: 12px; color: var(--color-text-3); line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.step-go    { color: var(--color-text-3); flex-shrink: 0; margin-top: 2px; }
.step-btn:hover .step-go { color: var(--color-brand); }

/* ── Automatischer Start ── */
.auto-card   { padding: 1.25rem; }
.auto-row    { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.auto-label  { font-size: 13px; font-weight: 500; }
.auto-desc   { font-size: 12px; color: var(--color-text-3); margin-top: 3px; }
.auto-active { font-size: 12px; font-weight: 500; color: var(--color-ok); }
.auto-saved  { font-size: 12px; color: var(--color-ok); font-weight: 500; margin: 10px 0 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

@media (max-width: 640px) {
  .start-card { flex-direction: column; align-items: flex-start; }
  .auto-row   { flex-direction: column; align-items: flex-start; }
}
</style>
