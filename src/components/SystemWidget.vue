<script setup>
import { computed } from 'vue'
import { battery, cpu, ram } from '@/lib/system'

/**
 * Sistem — bölmeli seviye çubuğu.
 *
 * Önce halka vardı (yüzdeyi ortasındaki rakamdan okutuyordu, yani
 * süstü), sonra 0.32rem'lik noktalar: ölçek doğruydu ama noktalar hem
 * küçük hem soluktu, karşıdan bakınca gri bir toz şeridi gibi
 * duruyordu. Şimdi aynı yirmi adım DİK ÇUBUKLAR — bir seviye
 * göstergesinin (VU metre) kendi dili, saatin nokta matrisiyle de
 * akraba. Yanan çubuk beyaz, sönük olan neredeyse görünmez; aradaki
 * fark uzaktan da okunuyor.
 */
/** Nokta sayısı: 20 nokta = %5'lik adımlar, okunur bir çözünürlük. */
const DOTS = 20

const rows = computed(() => {
  const out = []
  if (battery.value) {
    out.push({
      key: 'pil',
      label: 'Pil',
      pct: battery.value.level,
      note: battery.value.charging
        ? 'şarjda'
        : (battery.value.minsLeft
          ? `${Math.floor(battery.value.minsLeft / 60)}s ${battery.value.minsLeft % 60}d`
          : ''),
    })
  }
  out.push({ key: 'cpu', label: 'İşlemci', pct: cpu.value, note: '' })
  out.push({
    key: 'ram',
    label: 'Bellek',
    pct: ram.value?.pct,
    note: ram.value ? `${ram.value.usedGb.toFixed(1)} / ${ram.value.totalGb.toFixed(0)} GB` : '',
  })
  return out
})

const lit = (pct) => Math.round(((pct ?? 0) / 100) * DOTS)
</script>

<template>
  <div class="sy">
    <div v-for="r in rows" :key="r.key" class="sy-row">
      <div class="sy-top">
        <span class="sy-label">{{ r.label }}</span>
        <span v-if="r.note" class="sy-note">{{ r.note }}</span>
        <span class="sy-pct">{{ r.pct ?? '–' }}<i>%</i></span>
      </div>
      <div class="sy-scale" :aria-label="`${r.label} %${r.pct ?? 0}`">
        <span v-for="i in DOTS" :key="i" class="bar" :class="{ on: i <= lit(r.pct), hot: i > DOTS * 0.85 && i <= lit(r.pct) }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sy { display: flex; flex-direction: column; gap: 0.7rem; }

.sy-top { display: flex; align-items: baseline; gap: 0.4rem; }

.sy-label {
  font-size: 0.55rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.sy-note { flex: 1; font-size: 0.55rem; color: var(--text-muted); opacity: 0.75; text-align: right; }

.sy-pct {
  font-size: 0.82rem;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  min-width: 2.2rem;
  text-align: right;
}

.sy-pct i { font-size: 0.5rem; font-style: normal; color: var(--text-muted); }

.sy-scale {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  margin-top: 0.3rem;
  height: 0.85rem;
}

/* Sönük çubuklar da duruyor: ölçeğin tamamı görünmezse %30 ile %80
   aynı uzunlukta bir dizi gibi okunuyor. */
.bar {
  flex: 1;
  min-width: 0;
  height: 100%;
  border-radius: 1.5px;
  background: var(--text);
  opacity: 0.1;
  transition: opacity 0.2s ease;
}

/* Yanan çubuk BEYAZ (aksan değil): aksan rengi vakitle değişiyor ve
   bazı vakitlerde zeminden ayrılmıyordu; ölçüm okunurluğu temaya
   bağlı olmamalı. */
.bar.on { opacity: 0.92; }

/* Son %15: dolmak üzere. Tek renkli bir şeritte "neredeyse doldu"
   ancak sayıyı okuyarak anlaşılıyordu. */
.bar.hot { background: var(--primary); opacity: 1; }
</style>
