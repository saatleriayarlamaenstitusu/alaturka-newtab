<script setup>
import { computed } from 'vue'

/**
 * Nokta matris rakamlar.
 *
 * Her karakter 5×7 noktalık bir ızgarada çiziliyor — eski istasyon
 * panolarının dili. Yazı tipi indirmeden, tek bir bit eşlemiyle
 * çalışıyor: eklentiye font paketlemek 100+ kB eder ve yalnızca on
 * iki karakter için.
 */
const props = defineProps({
  text: { type: String, required: true },
  /** Nokta çapı (px). */
  cell: { type: Number, default: 8 },
})

// Her satır 5 bitlik bir maske (soldan sağa).
const GLYPHS = {
  0: [0x1f, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1f],
  1: [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  2: [0x1f, 0x01, 0x01, 0x1f, 0x10, 0x10, 0x1f],
  3: [0x1f, 0x01, 0x01, 0x1f, 0x01, 0x01, 0x1f],
  4: [0x11, 0x11, 0x11, 0x1f, 0x01, 0x01, 0x01],
  5: [0x1f, 0x10, 0x10, 0x1f, 0x01, 0x01, 0x1f],
  6: [0x1f, 0x10, 0x10, 0x1f, 0x11, 0x11, 0x1f],
  7: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  8: [0x1f, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x1f],
  9: [0x1f, 0x11, 0x11, 0x1f, 0x01, 0x01, 0x1f],
  ':': [0x00, 0x04, 0x04, 0x00, 0x04, 0x04, 0x00],
  ' ': [0, 0, 0, 0, 0, 0, 0],
}

const chars = computed(() => [...props.text].map((c) => GLYPHS[c] ?? GLYPHS[' ']))
const dots = (rows) => rows.flatMap((r) => [16, 8, 4, 2, 1].map((b) => Boolean(r & b)))
</script>

<template>
  <div class="dn" :style="{ '--c': `${cell}px` }" :aria-label="text" role="img">
    <div v-for="(g, i) in chars" :key="i" class="dn-ch">
      <span v-for="(on, j) in dots(g)" :key="j" class="dn-dot" :class="{ on }" />
    </div>
  </div>
</template>

<style scoped>
.dn { display: flex; gap: calc(var(--c) * 1.6); }

.dn-ch {
  display: grid;
  grid-template-columns: repeat(5, var(--c));
  grid-auto-rows: var(--c);
  gap: calc(var(--c) * 0.6);
}

.dn-dot {
  width: var(--c);
  height: var(--c);
  border-radius: 50%;
  background: currentColor;
  /* Sönük noktalar da duruyor: pano hissi dolu ızgaradan geliyor,
     yalnızca yanan noktaları çizmek rakamı havada bırakıyor. Ama çok
     belirgin olurlarsa rakam okunmuyor — ölçülen sınır %6. */
  opacity: 0.06;
}

.dn-dot.on { opacity: 1; }
</style>
