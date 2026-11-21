<script setup>
import { computed, onMounted, watch } from 'vue'
import { settings } from '@/lib/settings'
import { weather, loading, ensureWeather, describe } from '@/lib/weather'

/**
 * Hava durumu.
 *
 * Önce yalnızca bir BAĞLANTIYDI (Meteoroloji / Google): gerçek veri
 * bir API anahtarı ister sanılıyordu ve anahtar, herkese açık bir
 * eklenti paketinin içinde duramazdı. Open-Meteo anahtar istemiyor —
 * o yüzden artık sayının kendisi burada.
 *
 * Kutu takvim widget'ıyla aynı boyda: derece büyük yazılı, altında
 * durum ve gece/gündüz uçları, en altta üç günlük şerit. Tek satırlık
 * bir kutu yanındaki aylık takvimin yanında yarım kalmış duruyordu.
 *
 * Veri önbellekten geliyor, tazeleme arka planda (bkz. lib/weather).
 */
const city = computed(() => settings.city.name)
const now = computed(() => weather.value)
const sky = computed(() => describe(now.value?.code ?? 0))

/** Şehir değişince o şehrin havası istenir. */
onMounted(() => ensureWeather(settings.city.plate))
watch(() => settings.city.plate, (p) => ensureWeather(p))

const mgm = computed(() =>
  `https://www.mgm.gov.tr/?il=${encodeURIComponent(toTitle(city.value))}`)

function toTitle(s) {
  return s.toLocaleLowerCase('tr').replace(/(^|\s|-)([a-zçğıöşü])/g, (m) => m.toLocaleUpperCase('tr'))
}
</script>

<template>
  <div class="we">
    <header class="we-head">
      <span class="we-city">{{ city }}</span>
      <!-- Ayrıntı hâlâ bir dokunuş uzakta: radar, saatlik tahmin ve
           uyarılar bu kutuya sığmaz, sığdırılmaya da çalışılmadı. -->
      <a class="we-more" :href="mgm" title="Meteoroloji Genel Müdürlüğü">MGM ↗</a>
    </header>

    <div v-if="now" class="we-now">
      <span class="we-sign" aria-hidden="true">{{ sky.sign }}</span>
      <span class="we-temp">{{ now.temp }}°</span>
      <span class="we-body">
        <span class="we-label">{{ sky.label }}</span>
        <span class="we-range">{{ now.max }}° / {{ now.min }}°</span>
        <span class="we-feels">hissedilen {{ now.feels }}°</span>
      </span>
    </div>

    <p v-else class="we-wait">{{ loading ? 'Alınıyor…' : 'Hava bilgisi yok' }}</p>

    <!-- Üç gün YAN YANA: alt alta dizildiğinde satırlar üstteki
         "bugün" bloğuyla aynı ritmi tekrarlıyor ve hangisinin bugün
         hangisinin tahmin olduğu seçilmiyordu. Yan yana üç kolon,
         bir hafta şeridi gibi okunuyor. Kolon içinde sıra: gün,
         işaret, durum, derece. -->
    <ul v-if="now?.days?.length" class="we-days">
      <li v-for="d in now.days" :key="d.iso" class="we-day">
        <span class="we-day-name">{{ d.name }}</span>
        <span class="we-day-sign" aria-hidden="true">{{ describe(d.code).sign }}</span>
        <span class="we-day-label">{{ describe(d.code).label }}</span>
        <span class="we-day-temp">{{ d.max }}°<b>{{ d.min }}°</b></span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.we { display: flex; flex-direction: column; gap: 0.7rem; }

.we-head { display: flex; align-items: baseline; gap: 0.5rem; }

.we-city {
  flex: 1;
  min-width: 0;
  font-size: 0.6rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.we-more { font-size: 0.55rem; letter-spacing: 0.1em; color: var(--text-muted); }
.we-more:hover { color: var(--text); }

.we-now { display: flex; align-items: center; gap: 0.6rem; }

.we-sign { font-size: 1.6rem; line-height: 1; color: var(--text); }

/* Derece sayfanın okunan sayısı: saatten sonra en büyük rakam o.
   Tablo rakamları — sıcaklık değişince kutu zıplamasın. */
.we-temp {
  font-size: 2.3rem;
  font-weight: 300;
  letter-spacing: -0.04em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.we-body { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
.we-label { font-size: 0.72rem; color: var(--text); }

.we-range {
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.we-feels { font-size: 0.56rem; letter-spacing: 0.06em; color: var(--text-muted); opacity: 0.8; }

.we-wait { margin: 0; font-size: 0.7rem; color: var(--text-muted); }

/* Üç gün: eşit üç kolon. */
.we-days {
  list-style: none;
  margin: 0;
  padding: 0.6rem 0 0;
  border-top: 1px solid var(--border);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.3rem;
}

.we-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  text-align: center;
  min-width: 0;
}

.we-day-name {
  font-size: 0.55rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* İşaret kolonun ağırlık merkezi: gün adı ve derece onun etrafında
   küçük kalıyor, şerit tek bakışta "yarın yağmurlu" diyor. */
.we-day-sign { font-size: 1.5rem; line-height: 1.1; color: var(--text); }

.we-day-label {
  font-size: 0.52rem;
  line-height: 1.25;
  letter-spacing: 0.02em;
  color: var(--text-muted);
  /* Uzun durum adı ("Gök gürültülü") iki satıra düşer; üçüncüde
     kolonlar birbirinden farklı boya geliyor. */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.we-day-temp {
  display: flex;
  gap: 0.3rem;
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.we-day-temp b { font-weight: 400; color: var(--text-muted); }
</style>
