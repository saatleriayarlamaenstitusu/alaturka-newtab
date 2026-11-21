<script setup>
import { computed } from 'vue'
import { calculateAlaturka } from '@alaturkavakitler/core'
import { raw } from '@/lib/vakit'
import { settings } from '@/lib/settings'

/**
 * Analog saat — ayrı bir widget.
 *
 * Kadran ALATURKA da olabiliyor: alaturka saatte gün batımı 12'dir,
 * yani yelkovan değil akrep başka bir anlam taşır. Hangi saatin
 * gösterileceği saat ayarındaki "büyük saat" seçimini izler, iki ayrı
 * yerde iki farklı saat göstermek kafa karıştırırdı.
 *
 * Rakam yok, yalnızca çentik: yeni sekmede saate bakmak "kaç" sorusu
 * değil "günün neresindeyim" sorusu.
 */
const props = defineProps({ now: { type: Date, required: true } })

const parts = computed(() => {
  if (settings.clock.main === 'alaturka') {
    const [h, m] = (calculateAlaturka(props.now, raw.value) || '00:00').split(':').map(Number)
    return { h: h % 12, m: m || 0, s: props.now.getSeconds() }
  }
  return { h: props.now.getHours() % 12, m: props.now.getMinutes(), s: props.now.getSeconds() }
})

const deg = computed(() => ({
  h: parts.value.h * 30 + parts.value.m * 0.5,
  m: parts.value.m * 6,
  s: parts.value.s * 6,
}))

const ticks = Array.from({ length: 12 }, (_, i) => i * 30)
</script>

<template>
  <div class="an">
    <svg viewBox="-50 -50 100 100" class="an-face" role="img" aria-label="Analog saat">
      <circle r="47" class="rim" />
      <line
        v-for="t in ticks"
        :key="t"
        x1="0" y1="-41" x2="0" y2="-45"
        class="tick"
        :transform="`rotate(${t})`"
      />
      <line x1="0" y1="6" x2="0" y2="-24" class="hand h" :transform="`rotate(${deg.h})`" />
      <line x1="0" y1="8" x2="0" y2="-36" class="hand m" :transform="`rotate(${deg.m})`" />
      <line x1="0" y1="10" x2="0" y2="-38" class="hand s" :transform="`rotate(${deg.s})`" />
      <circle r="2.2" class="pin" />
    </svg>
    <span class="an-tag">{{ settings.clock.main }}</span>
  </div>
</template>

<style scoped>
.an { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
.an-face { width: 100%; max-width: 9rem; }

.rim { fill: none; stroke: var(--border); stroke-width: 1; }
.tick { stroke: var(--text); stroke-width: 1.6; opacity: 0.45; stroke-linecap: round; }

.hand { stroke: var(--text); stroke-linecap: round; }
.h { stroke-width: 3.4; }
.m { stroke-width: 2.2; }
/* Saniye aksan renginde ve ince: kadranın tek hareketli vurgusu. */
.s { stroke: var(--accent-ui); stroke-width: 1; }
.pin { fill: var(--accent-ui); }

.an-tag {
  font-size: 0.5rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-muted);
}
</style>
