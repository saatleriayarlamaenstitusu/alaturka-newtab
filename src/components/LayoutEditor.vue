<script setup>
import { computed, ref } from 'vue'
import { settings, moveWidget, SLOTS } from '@/lib/settings'
import { WIDGETS, widgetById } from '@/data/widgets'
import Icon from '@/ui/Icon.vue'

/**
 * Yerleşim düzenleyici — küçük bir ekran maketi.
 *
 * Önce her widget'ın yanında bir "nerede dursun" seçici vardı ve iki
 * şeyi söyleyemiyordu: kolondaki SIRA ve yerleşimin ekranda nasıl
 * göründüğü. Burada maketin kendisi düzenleniyor: üç kolon, altında
 * kapalılar rafı; sürükleyip bırakmak hem kolonu hem sırayı
 * değiştiriyor.
 *
 * Sürükleme HTML5'in kendi düzeneğiyle: bir chip'in ÜSTÜNE bırakmak
 * onun önüne ekler, kolonun boşluğuna bırakmak sona ekler.
 */
const COLS = [
  { id: 'sol', label: 'Sol' },
  { id: 'alt', label: 'Orta (aramanın altı)' },
  { id: 'sag', label: 'Sağ' },
]

const drag = ref('')
const over = ref('')

const listOf = (slot) => computed(() =>
  (settings.layout[slot] ?? []).map(widgetById).filter(Boolean))

const cols = { sol: listOf('sol'), alt: listOf('alt'), sag: listOf('sag') }

const hidden = computed(() => {
  const placed = new Set(['sol', 'sag', 'alt'].flatMap((s) => settings.layout[s] ?? []))
  return WIDGETS.filter((w) => !placed.has(w.id))
})

function dropOn(slot, index) {
  if (drag.value) moveWidget(drag.value, slot, index)
  drag.value = ''
  over.value = ''
}
</script>

<template>
  <div class="le">
    <div class="le-screen">
      <div
        v-for="c in COLS"
        :key="c.id"
        class="le-col"
        :class="{ over: over === c.id }"
        @dragover.prevent="over = c.id"
        @dragleave="over === c.id && (over = '')"
        @drop.prevent="dropOn(c.id, -1)"
      >
        <span class="le-col-label">{{ c.label }}</span>
        <div
          v-for="(w, i) in cols[c.id].value"
          :key="w.id"
          class="chip"
          draggable="true"
          @dragstart="drag = w.id"
          @dragend="drag = ''; over = ''"
          @drop.stop.prevent="dropOn(c.id, i)"
          @dragover.stop.prevent="over = c.id"
        >
          <Icon :name="w.icon" :size="11" />
          <span>{{ w.title }}</span>
        </div>
      </div>
    </div>

    <div
      class="le-off"
      :class="{ over: over === 'kapali' }"
      @dragover.prevent="over = 'kapali'"
      @dragleave="over === 'kapali' && (over = '')"
      @drop.prevent="dropOn('kapali', -1)"
    >
      <span class="le-col-label">Kapalı</span>
      <div
        v-for="w in hidden"
        :key="w.id"
        class="chip off"
        draggable="true"
        @dragstart="drag = w.id"
        @dragend="drag = ''; over = ''"
      >
        <Icon :name="w.icon" :size="11" />
        <span>{{ w.title }}</span>
      </div>
      <span v-if="!hidden.length" class="le-empty">—</span>
    </div>

    <p class="le-hint">Sürükleyip bırak: kolonu da sırayı da değiştirir.</p>
  </div>
</template>

<style scoped>
.le { display: flex; flex-direction: column; gap: 0.4rem; }

/* Maket gerçek ekranın oranında: üç kolon, ortası geniş. */
.le-screen {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 0.3rem;
  padding: 0.3rem;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: color-mix(in srgb, var(--text) 4%, transparent);
}

.le-col, .le-off {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-height: 5rem;
  padding: 0.25rem;
  border: 1px dashed transparent;
  border-radius: 7px;
}

.le-col.over, .le-off.over { border-color: var(--accent-ui); background: color-mix(in srgb, var(--accent-ui) 10%, transparent); }

.le-off { min-height: 2.4rem; flex-direction: row; flex-wrap: wrap; align-items: center; border-style: dashed; border-color: var(--border); }

.le-col-label {
  font-size: 0.45rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  opacity: 0.7;
}

.chip {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.18rem 0.3rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background-color: color-mix(in srgb, var(--bg) 70%, transparent);
  font-size: 0.58rem;
  color: var(--text);
  cursor: grab;
  user-select: none;
}

.chip:active { cursor: grabbing; }
.chip.off { color: var(--text-muted); opacity: 0.8; }
.chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.le-empty { font-size: 0.6rem; color: var(--text-muted); }
.le-hint { margin: 0; font-size: 0.58rem; color: var(--text-muted); opacity: 0.7; }
</style>
