<script setup>
import { computed } from 'vue'
import { calculateAlaturka, nowHijri, TR_MONTHS, holyDayLabel } from '@alaturkavakitler/core'
import { raw } from '@/lib/vakit'
import { settings } from '@/lib/settings'
import DotNumber from './DotNumber.vue'

/**
 * Saat ve tarih — tek blok.
 *
 * Telefon widget'larındaki gibi: büyük saat, altında tarih, yanında
 * ikincil saat. Önce saat ve tarih iki ayrı bloktu ve aralarındaki
 * boşluk ikisini ilgisiz iki şey gibi gösteriyordu; aynı an'ın iki
 * yüzü oldukları için tek çerçevede duruyorlar.
 *
 * Üç biçim: `sade` (ince grotesk), `mono` (daktilo, dar), `nokta`
 * (nokta matris — rakamlar 5×7 ızgarada noktalarla çizilir).
 */
const props = defineProps({ now: { type: Date, required: true } })

const pad = (n) => String(n).padStart(2, '0')
const vasati = computed(() => `${pad(props.now.getHours())}:${pad(props.now.getMinutes())}`)
const alaturka = computed(() => calculateAlaturka(props.now, raw.value))

const textOf = (id) => (id === 'alaturka' ? alaturka.value : vasati.value)
const main = computed(() => textOf(settings.clock.main))
const side = computed(() =>
  (settings.clock.side !== 'yok' && settings.clock.side !== settings.clock.main
    ? { id: settings.clock.side, text: textOf(settings.clock.side) }
    : null))

/**
 * Hicri gün akşam ezanıyla başlar: ayar açıksa kesme anı o günün
 * AKŞAM VAKTİDİR, sabit bir saat değil.
 */
const aksamCutoff = computed(() => {
  if (!settings.hijriOffset || !raw.value) return null
  const iso = props.now.toISOString().slice(0, 10)
  const v = raw.value[iso]?.aksam
  if (!v) return null
  const [h, m] = v.split(':').map(Number)
  const d = new Date(props.now)
  d.setHours(h, m, 0, 0)
  return d
})

const hijri = computed(() => {
  const h = nowHijri('object', props.now, aksamCutoff.value)
  return h ? `${h.date} ${h.monthName} ${h.year}` : ''
})

const miladi = computed(() =>
  `${props.now.getDate()} ${TR_MONTHS[props.now.getMonth()]} ${props.now.getFullYear()}`)

const weekday = computed(() => props.now.toLocaleDateString('tr-TR', { weekday: 'long' }))
const holy = computed(() => holyDayLabel(props.now))
</script>

<template>
  <div class="ck" :data-style="settings.clock.style">
    <div class="ck-main">
      <DotNumber v-if="settings.clock.style === 'nokta'" :text="main" :cell="9" />
      <span v-else class="ck-val" :style="{ fontWeight: settings.clock.weight }">{{ main }}</span>
      <span class="ck-tag">{{ settings.clock.main }}</span>
    </div>

    <div class="ck-meta">
      <span v-if="side" class="ck-side">{{ side.text }} <i>{{ side.id }}</i></span>
      <span class="ck-date">{{ hijri }}</span>
      <span class="ck-date dim">{{ miladi }} · {{ weekday }}</span>
      <span v-if="holy" class="ck-holy">{{ holy }}</span>
    </div>
  </div>
</template>

<style scoped>
.ck {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.ck-main { display: flex; align-items: flex-start; gap: 0.5rem; }

.ck-val {
  font-size: clamp(3.6rem, 8vw, 6.4rem);
  font-weight: 200;
  letter-spacing: -0.03em;
  line-height: 0.95;
  font-variant-numeric: tabular-nums;
}

[data-style='mono'] .ck-val {
  font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
  font-weight: 300;
  letter-spacing: -0.02em;
}

.ck-tag {
  margin-top: 0.5rem;
  font-size: 0.52rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* Tarih satırları saatin altında, ortalı ve daralan bir hiyerarşide:
   hicri önce (asıl takvim), miladi soluk, dinî gün varsa aksanla. */
.ck-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  text-align: center;
}

.ck-side {
  font-size: 1.05rem;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.ck-side i {
  font-style: normal;
  font-size: 0.5rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.ck-date {
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.ck-date.dim { font-size: 0.6rem; opacity: 0.75; }

.ck-holy {
  margin-top: 0.15rem;
  padding: 0.1rem 0.45rem;
  font-size: 0.55rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text);
  border: 1px solid var(--accent-ui);
  border-radius: 999px;
}
</style>
