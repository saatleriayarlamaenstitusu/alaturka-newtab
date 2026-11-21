<script setup>
import { computed } from 'vue'
import { VAKIT_KEYS, nextVakit } from '@alaturkavakitler/core'
import { table, current, status } from '@/lib/vakit'

/**
 * Namaz vakitleri — yan yana, altı sütun.
 *
 * Alt alta liste denendi: okunuyordu ama widget'ı gereksiz
 * uzatıyordu ve yanındaki takvimle birlikte sol kolon ekranı
 * dolduruyordu. Altı vakit yan yana bir ŞERİTTİR; her sütunda ad
 * üstte küçük, saat altta büyük.
 *
 * Geçmiş vakitler soluklaşır, içinde bulunulan vakit üstündeki aksan
 * çizgisiyle işaretlenir: çizelge değil, günün neresinde olduğunu
 * gösteren bir şerit.
 */
const props = defineProps({ now: { type: Date, required: true } })

const LABELS = {
  imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle',
  ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı',
}

const next = computed(() => (table.value ? nextVakit(table.value, props.now) : null))
const nowKey = computed(() => current.value)
const pad = (n) => String(n).padStart(2, '0')
const left = computed(() => {
  const n = next.value
  return n ? `${pad(n.hours)}:${pad(n.minutes)}:${pad(n.seconds)}` : ''
})

const rows = computed(() => {
  const idx = VAKIT_KEYS.indexOf(current.value)
  return VAKIT_KEYS.map((k, i) => ({
    key: k,
    label: LABELS[k],
    value: table.value?.[k]?.value ?? '--:--',
    on: current.value === k,
    past: idx > -1 && i < idx,
  }))
})
</script>

<template>
  <div class="vk">
    <!-- Sayacın üstünde iki uç: ŞU ANKİ vakit ve SONRAKİ. Aradaki
         çizgi geçen zamanı değil, iki vakit arasında olduğumuzu
         anlatır — sayaç da o aralığın kalanıdır. -->
    <div v-if="next" class="vk-next">
      <div class="vk-span">
        <span class="vk-now">{{ LABELS[nowKey] ?? '—' }}</span>
        <span class="vk-dash" aria-hidden="true" />
        <span class="vk-then">{{ LABELS[next.key] }}</span>
      </div>
      <span class="vk-to">Vaktin çıkmasına</span>
      <span class="vk-left">{{ left }}</span>
    </div>
    <p v-else-if="status" class="vk-note">{{ status }}</p>

    <ul class="vk-list">
      <li v-for="r in rows" :key="r.key" :class="{ on: r.on, past: r.past }">
        <span class="vk-name">{{ r.label }}</span>
        <span class="vk-val">{{ r.value }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.vk { display: flex; flex-direction: column; gap: 0.6rem; }

.vk-next { display: flex; flex-direction: column; gap: 0.1rem; }

.vk-span { display: flex; align-items: center; gap: 0.45rem; }

.vk-now, .vk-then {
  font-size: 0.56rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.vk-now { color: var(--text); }
.vk-then { color: var(--text-muted); }

.vk-dash { flex: 1; height: 1px; background: var(--border); }

.vk-to {
  font-size: 0.5rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-muted);
  opacity: 0.8;
}

.vk-left {
  font-size: 1.6rem;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  line-height: 1.1;
}

.vk-note { margin: 0; font-size: 0.72rem; color: var(--text-muted); }

.vk-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.15rem;
}

.vk-list li {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.35rem 0.1rem 0.3rem;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
}

.vk-list li.past { opacity: 0.42; }

/* İçinde bulunulan vakit: ÜSTÜNDEKİ çizgi aksan rengine döner.
   Zemin vermek vakit renginin kendisiyle çakışıyor. */
.vk-list li.on { color: var(--text); border-top-color: var(--accent-ui); border-top-width: 2px; }

.vk-name {
  font-size: 0.48rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.85;
}

.vk-val { font-size: 0.8rem; font-variant-numeric: tabular-nums; }
</style>
