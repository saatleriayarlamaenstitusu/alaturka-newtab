<script setup>
import { computed, ref, watch } from 'vue'
import {
  TR_MONTHS, TR_WEEKDAYS, HIJRI_MONTHS, toHijri, fromHijri,
  hijriMonthLength, holyDaysBetween, isoDate,
} from '@alaturkavakitler/core'
import { settings } from '@/lib/settings'
import { nationalDaysOn } from '@/data/holidays'

/**
 * Aylık takvim.
 *
 * Nokta ızgarası denendi ve BIRAKILDI: ay bir bakışta okunuyordu ama
 * "bugün ayın kaçı", "cuma hangi gün" gibi takvime sorulan asıl
 * sorulara cevap vermiyordu — noktalar güzeldi, takvim değildi.
 * Rakamlı ızgara geri geldi; küçük punto ve dar satır yüksekliğiyle
 * yine altı satıra sığıyor.
 *
 * Üç görünüm: miladi, hicri ve BİRLEŞİK. Birleşikte her hücre iki
 * sayı taşır — büyük olan ayardan seçilir (`calendar.main`), küçüğü
 * öbür takvimin karşılığıdır. İki takvimi yan yana tutan biri için
 * ayrı ayrı bakmak sürekli kafadan çevirmek demekti.
 *
 * Hicri ay başlangıcı ve uzunluğu çekirdeğin tablosundan geliyor
 * (`fromHijri`, `hijriMonthLength`), aritmetik bir yaklaşımdan değil.
 *
 * AY GEZİNTİSİ: ok ileri/geri ayı değiştirir, gezinti hangi takvim
 * büyük yazılıyorsa ONUN ayını sayar (hicri görünümde hicri ay).
 * Ay değişince seçili gün düşer — başka ayın günü seçili kalmasın.
 *
 * GÜN İŞARETLERİ: dinî günler çekirdekten (`holyDaysBetween`), millî
 * bayram/tatiller `data/holidays.js`ten. İkisi de günün altında NOKTA;
 * renkler ayrı ve SABİT (aksan değil): aksan vakitle değişiyor ve
 * yatsıda koyu zeminde kayboluyordu.
 */
const props = defineProps({ now: { type: Date, required: true } })

const view = computed(() => settings.calendar?.view ?? 'miladi')
/** Izgaranın hangi takvime göre kurulduğu. */
const hicri = computed(() =>
  view.value === 'hicri' || (view.value === 'birlesik' && settings.calendar?.main === 'hicri'))
const birlesik = computed(() => view.value === 'birlesik')

/** Kaç ay ileri/geri. Bugüne dönünce sıfırlanır. */
const offset = ref(0)
/** Seçili gün (ISO). Bir güne dokununca o günün etkinliği açılır. */
const picked = ref(null)

const todayIso = computed(() => isoDate(props.now))

const info = computed(() => {
  const d = props.now
  if (!hicri.value) {
    const first = new Date(d.getFullYear(), d.getMonth() + offset.value, 1)
    const y = first.getFullYear()
    const m = first.getMonth()
    const days = new Date(y, m + 1, 0).getDate()
    return {
      title: `${TR_MONTHS[m]} ${y}`,
      days,
      dateOf: (n) => new Date(y, m, n),
      first,
      last: new Date(y, m, days),
      lead: (first.getDay() + 6) % 7,
    }
  }
  const h = toHijri(d)
  // Hicri ay kayması yıl sınırını aşabilir: 12'den sonrası yıl atlar.
  let m = h.month + offset.value
  let y = h.year
  while (m < 1) { m += 12; y -= 1 }
  while (m > 12) { m -= 12; y += 1 }
  const first = fromHijri(y, m, 1)
  // Ay uzunluğu çekirdekten: hicri ay 29 ya da 30 gündür ve hangisi
  // olduğu Diyanet tablosundan gelir, aritmetikten değil.
  const days = hijriMonthLength(y, m)
  return {
    title: `${HIJRI_MONTHS?.[m - 1] ?? m} ${y}`,
    days,
    dateOf: (n) => fromHijri(y, m, n),
    first,
    last: fromHijri(y, m, days),
    lead: first ? (first.getDay() + 6) % 7 : 0,
  }
})

/**
 * Ayın bütün günleri: `{ '2026-11-23': [{name, kind, milli}] }`.
 *
 * Dinî taraf tek çağrıda geliyor (`holyDaysBetween` aralığı tarıyor);
 * millî taraf sabit yedi gün, aralıkta kalanlar süzülüyor.
 */
const events = computed(() => {
  const i = info.value
  if (!i.first || !i.last) return {}
  const map = {}
  const dini = holyDaysBetween(i.first, i.last)
  for (const [iso, list] of Object.entries(dini)) map[iso] = list.map((x) => ({ ...x, milli: false }))
  const d = new Date(i.first.getFullYear(), i.first.getMonth(), i.first.getDate())
  while (d <= i.last) {
    const list = nationalDaysOn(d)
    if (list.length) {
      const iso = isoDate(d)
      map[iso] = [...(map[iso] ?? []), ...list]
    }
    d.setDate(d.getDate() + 1)
  }
  return map
})

/** Ayın etkinlik listesi — ızgaranın ALTINDA durur. */
const monthList = computed(() =>
  Object.entries(events.value)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([iso, list]) => ({ iso, list, label: dayLabel(iso) })))

const cells = computed(() => {
  const i = info.value
  return Array.from({ length: i.days }, (_, k) => {
    const n = k + 1
    const date = i.dateOf(n)
    const iso = date ? isoDate(date) : ''
    const list = events.value[iso] ?? []
    // Birleşikte ikinci sayı: ızgara miladi ise hicri günü, hicri ise
    // miladi günü. Dönüşüm hücre başına yapılıyor çünkü iki takvimin
    // ay sınırları örtüşmüyor.
    const alt = birlesik.value && date
      ? (hicri.value ? date.getDate() : toHijri(date)?.day)
      : null
    return {
      n,
      iso,
      alt,
      list,
      today: iso === todayIso.value,
      // Geçmişlik gün NUMARASINDAN değil tarihten: gezintide başka
      // ayın 3'i bugünün 23'ünden önce gelebiliyor.
      past: date ? iso < todayIso.value : false,
      dini: list.some((x) => !x.milli),
      milli: list.some((x) => x.milli),
    }
  })
})

/** "23 Kasım" — liste ve seçili gün başlığı için. */
function dayLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${TR_MONTHS[m - 1]}`
}

const pickedInfo = computed(() => {
  if (!picked.value) return null
  const [y, m, d] = picked.value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const h = toHijri(date)
  return {
    iso: picked.value,
    label: `${d} ${TR_MONTHS[m - 1]} ${y}`,
    weekday: TR_WEEKDAYS?.[(date.getDay() + 6) % 7] ?? '',
    hicri: h ? `${h.day} ${h.monthName} ${h.year}` : '',
    list: events.value[picked.value] ?? [],
  }
})

function pickDay(c) {
  if (!c.iso) return
  picked.value = picked.value === c.iso ? null : c.iso
}

function shift(d) {
  offset.value += d
  picked.value = null
}

function backToToday() {
  offset.value = 0
  picked.value = null
}

// Görünüm değişince gezinti sıfırlanır: miladi ayın kayması hicri
// aya taşınmaz, ikisi aynı uzunlukta değil.
watch(view, () => { offset.value = 0; picked.value = null })

const WEEK = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P']
</script>

<template>
  <div class="mo">
    <div class="mo-head">
      <div class="mo-nav">
        <button class="mo-arrow" aria-label="Önceki ay" @click="shift(-1)">‹</button>
        <span class="mo-title">{{ info.title }}</span>
        <button class="mo-arrow" aria-label="Sonraki ay" @click="shift(1)">›</button>
      </div>
      <div class="mo-switch">
        <button
          v-for="v in [{ id: 'miladi', l: 'Miladi' }, { id: 'hicri', l: 'Hicri' }, { id: 'birlesik', l: 'İkisi' }]"
          :key="v.id"
          :class="{ on: view === v.id }"
          @click="settings.calendar = { ...settings.calendar, view: v.id }"
        >{{ v.l }}</button>
      </div>
    </div>

    <button v-if="offset !== 0" class="mo-today" @click="backToToday">Bugüne dön</button>

    <div class="mo-grid">
      <span v-for="(w, i) in WEEK" :key="i" class="mo-wd">{{ w }}</span>
      <span v-for="n in info.lead" :key="`l${n}`" class="mo-pad" />
      <button
        v-for="c in cells"
        :key="c.n"
        type="button"
        class="mo-day"
        :class="{ today: c.today, past: c.past, two: birlesik, on: picked === c.iso }"
        :aria-label="`${c.n} ${info.title}`"
        @click="pickDay(c)"
      >
        <b>{{ c.n }}</b>
        <i v-if="c.alt">{{ c.alt }}</i>
        <span v-if="c.dini || c.milli" class="mo-dots">
          <span v-if="c.dini" class="dot dini" />
          <span v-if="c.milli" class="dot milli" />
        </span>
      </button>
    </div>

    <!-- Ayın günleri ızgaranın altında; bir güne dokununca o günün
         künyesi ve etkinliği yerini alır. -->
    <div class="mo-foot">
      <template v-if="pickedInfo">
        <div class="mo-pick">
          <div class="mo-pick-head">
            <span class="mo-pick-day">{{ pickedInfo.label }}</span>
            <button class="mo-x" aria-label="Seçimi kaldır" @click="picked = null">×</button>
          </div>
          <p class="mo-pick-sub">{{ pickedInfo.weekday }} · {{ pickedInfo.hicri }}</p>
          <ul v-if="pickedInfo.list.length" class="mo-list">
            <li v-for="(e, i) in pickedInfo.list" :key="i">
              <span class="dot" :class="e.milli ? 'milli' : 'dini'" />
              <span class="mo-ev">{{ e.name }}<i v-if="e.note" class="mo-note">{{ e.note }}</i></span>
            </li>
          </ul>
          <p v-else class="mo-empty">Bu günde işaretli bir gün yok.</p>
        </div>
      </template>

      <template v-else-if="monthList.length">
        <p class="mo-cap">Bu ay</p>
        <ul class="mo-list">
          <li v-for="m in monthList" :key="m.iso">
            <span class="dot" :class="m.list.some(x => x.milli) ? 'milli' : 'dini'" />
            <button class="mo-ev-btn" @click="picked = m.iso">
              <b>{{ m.label }}</b>
              <span class="mo-ev">{{ m.list.map(x => x.name).join(' · ') }}</span>
            </button>
          </li>
        </ul>
      </template>

      <p v-else class="mo-empty">Bu ayda işaretli bir gün yok.</p>
    </div>
  </div>
</template>

<style scoped>
.mo { display: flex; flex-direction: column; gap: 0.6rem; }

/* Başlık alanı SABİT: oklar hiç yer değiştirmez.
   Önce başlık kendi genişliğindeydi ("Kasım 2026" 68.7px,
   "Cemaziyelevvel 1448" 122.2px — ölçüldü) ve ay değiştikçe oklar
   kayıyordu; uzun hicri adlarda görünüm anahtarının üstüne de
   taşıyordu. Şimdi gezinti kalan yerin TAMAMINI alıyor ve üç
   sütunlu ızgara: ok | başlık | ok. Başlık ortalanıyor, sığmazsa
   üç nokta. Punto 0.78 → 0.7rem: en uzun ad böyle sığıyor. */
.mo-head { display: flex; align-items: center; justify-content: space-between; gap: 0.35rem; }

.mo-nav {
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  grid-template-columns: 1rem minmax(0, 1fr) 1rem;
  gap: 0.1rem;
  align-items: center;
}

.mo-arrow {
  width: 1rem;
  height: 1rem;
  display: grid;
  place-items: center;
  padding: 0;
  font: inherit;
  font-size: 0.8rem;
  line-height: 1;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.mo-arrow:hover { color: var(--text); background: color-mix(in srgb, var(--text) 8%, transparent); }

.mo-title {
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  color: var(--text);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mo-today {
  align-self: flex-start;
  padding: 0.1rem 0.4rem;
  font: inherit;
  font-size: 0.52rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.mo-today:hover { color: var(--text); border-color: var(--accent-ui); }

.mo-switch { flex: 0 0 auto; display: inline-flex; gap: 2px; padding: 2px; border: 1px solid var(--border); border-radius: 999px; }

.mo-switch button {
  padding: 0.12rem 0.35rem;
  font: inherit;
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.mo-switch button.on { background: var(--text); color: var(--bg); }

.mo-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px 0; justify-items: center; }

.mo-wd {
  padding-bottom: 0.2rem;
  font-size: 0.5rem;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  opacity: 0.6;
}

.mo-pad { height: 1.5rem; }
.mo-grid:has(.two) .mo-pad { height: 1.85rem; }

/* Hücre DÜĞME: bir güne dokununca o günün etkinliği aşağıda açılıyor.
   Yükseklik noktaya yer açacak kadar arttı (1.35 → 1.5rem). */
.mo-day {
  position: relative;
  display: grid;
  place-items: center;
  align-content: center;
  width: 1.35rem;
  height: 1.5rem;
  padding: 0 0 0.22rem;
  border: none;
  border-radius: 7px;
  background: transparent;
  font: inherit;
  font-size: 0.62rem;
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
  cursor: pointer;
}

.mo-day:hover { background: color-mix(in srgb, var(--text) 8%, transparent); }

/* Birleşik hücre: büyük sayı seçilen takvim, küçüğü öbürü. Hücre
   biraz uzar, ızgara yine yedi sütun kalır. */
.mo-day.two { height: 1.85rem; gap: 0; }
.mo-day b { font-weight: 400; }

.mo-day i {
  font-style: normal;
  font-size: 0.45rem;
  line-height: 1;
  opacity: 0.6;
}

/* Geçmiş günler soluk: ayın neresinde olduğumuz rakamları okumadan da
   görünsün. */
.mo-day.past { opacity: 0.4; }

.mo-day.today {
  color: var(--bg);
  background: var(--accent-ui);
  opacity: 1;
}

.mo-day.on { box-shadow: inset 0 0 0 1px var(--accent-ui); opacity: 1; }

/* Nokta günün ALTINDA. İki tür varsa yan yana: biri dinî, biri millî. */
.mo-dots {
  position: absolute;
  left: 50%;
  bottom: 2px;
  display: flex;
  gap: 2px;
  transform: translateX(-50%);
}

.dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  flex: 0 0 auto;
}

/* Renkler SABİT: aksan vakitle değişiyor ve yatsıda (#2e3b83) koyu
   zeminde nokta kayboluyordu. Yeşil dinî, kırmızı millî — ikisi de
   iki temada okunuyor. */
.dot.dini { background: #3fb950; }
.dot.milli { background: #ff6b6b; }
:root[data-theme='light']:not([data-photo='on']) .dot.dini { background: #1a7f37; }
:root[data-theme='light']:not([data-photo='on']) .dot.milli { background: #d92d20; }

/* Bugünün üstünde nokta zeminle aynı renge düşmesin: aksan zeminde
   beyaz nokta her vakitte okunuyor. */
.mo-day.today .dot { background: var(--bg); }

.mo-foot { border-top: 1px solid var(--border); padding-top: 0.5rem; }

.mo-cap {
  margin: 0 0 0.3rem;
  font-size: 0.5rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.mo-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.28rem; }

.mo-list li { display: flex; align-items: baseline; gap: 0.35rem; }
.mo-list .dot { align-self: center; }

.mo-ev { font-size: 0.6rem; line-height: 1.35; color: var(--text); }

.mo-ev-btn {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 0;
  border: none;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  min-width: 0;
}

.mo-ev-btn b {
  flex: 0 0 auto;
  font-size: 0.55rem;
  font-weight: 400;
  color: var(--text-muted);
  white-space: nowrap;
}

.mo-ev-btn:hover .mo-ev { color: var(--accent-ui); }

.mo-note { display: block; font-style: normal; font-size: 0.52rem; color: var(--text-muted); }

.mo-pick-head { display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; }
.mo-pick-day { font-size: 0.68rem; color: var(--text); }

.mo-x {
  width: 1rem;
  height: 1rem;
  display: grid;
  place-items: center;
  padding: 0;
  font: inherit;
  font-size: 0.7rem;
  line-height: 1;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.mo-x:hover { color: var(--text); background: color-mix(in srgb, var(--text) 10%, transparent); }

.mo-pick-sub { margin: 0.1rem 0 0.4rem; font-size: 0.52rem; color: var(--text-muted); }

.mo-empty { margin: 0; font-size: 0.55rem; color: var(--text-muted); }
</style>
