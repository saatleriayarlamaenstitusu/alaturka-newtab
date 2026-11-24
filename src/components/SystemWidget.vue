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
      // Uyarı yönü TERS: işlemci/bellekte dolmak kötü, pilde dolmak
      // iyi. `low` bunu söylüyor — kırmızı buna göre ölçeğin
      // başında mı sonunda mı duracağını belirliyor.
      low: true,
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

/**
 * Kırmızı hangi çubuklarda?
 *
 * İşlemci ve bellekte son %15: yük dolmak üzere, uyarı.
 *
 * PİLDE TERSİ: %100 pilde son üç çubuğun kırmızı olması "pil dolu,
 * tehlike" diyordu — oysa dolması iyi bir şey. Pilde uyarı AZALMAK:
 * %15'in altındaysa yanan çubukların hepsi kırmızı. %100'de ölçeğin
 * tamamı beyaz.
 */
const HOT = 0.15
const isHot = (r, i) => {
  if (i > lit(r.pct)) return false          // yanmayan çubuk boyanmaz
  return r.low ? (r.pct ?? 0) <= HOT * 100 : i > DOTS * (1 - HOT)
}
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
        <span v-for="i in DOTS" :key="i" class="bar" :class="{ on: i <= lit(r.pct), hot: isHot(r, i) }" />
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

/* Uyarı rengi (hangi çubuklarda olduğu `isHot`ta): işlemci/bellekte
   son %15, pilde %15'in ALTI. Tek renkli bir şeritte "neredeyse
   doldu" / "bitmek üzere" ancak sayıyı okuyarak anlaşılıyordu.

   Renk SABİT kırmızı, `--primary` DEĞİL: aksan vakitle değişiyor ve
   yatsıda (#2e3b83) koyu kartın üstünde neredeyse görünmüyordu —
   %100 pilde son üç çubuk "renkli ama boş kutu" gibi okunuyordu
   (ölçüldü: zemin #0b0b0d ile kontrast 1.9:1, yanan beyaz çubuk
   16:1). Yorum zaten "kırmızı" diyordu, kod aksanı kullanıyordu. */
.bar.hot { background: #ff6b6b; opacity: 1; }

/* Açık temada koyu kırmızı — ama fotoğraf açıkken DEĞİL: o durumda
   renkler koyuya sabitleniyor (bkz. base.css `data-photo`), tema
   etiketi 'light' olsa da zemin koyu kalıyor. */
:root[data-theme='light']:not([data-photo='on']) .bar.hot { background: #d92d20; }
</style>
