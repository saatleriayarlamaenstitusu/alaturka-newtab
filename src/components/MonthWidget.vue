<script setup>
import { computed } from 'vue'
import { TR_MONTHS, HIJRI_MONTHS, toHijri, fromHijri, hijriMonthLength, holyDaysOn } from '@alaturkavakitler/core'
import { settings } from '@/lib/settings'

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
 */
const props = defineProps({ now: { type: Date, required: true } })

const view = computed(() => settings.calendar?.view ?? 'miladi')
/** Izgaranın hangi takvime göre kurulduğu. */
const hicri = computed(() =>
  view.value === 'hicri' || (view.value === 'birlesik' && settings.calendar?.main === 'hicri'))
const birlesik = computed(() => view.value === 'birlesik')

const info = computed(() => {
  const d = props.now
  if (!hicri.value) {
    const first = new Date(d.getFullYear(), d.getMonth(), 1)
    const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    return {
      title: `${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      days,
      today: d.getDate(),
      dateOf: (n) => new Date(d.getFullYear(), d.getMonth(), n),
      lead: (first.getDay() + 6) % 7,
    }
  }
  const h = toHijri(d)
  const first = fromHijri(h.year, h.month, 1)
  // Ay uzunluğu çekirdekten: hicri ay 29 ya da 30 gündür ve hangisi
  // olduğu Diyanet tablosundan gelir, aritmetikten değil.
  const days = hijriMonthLength(h.year, h.month)
  return {
    title: `${HIJRI_MONTHS?.[h.month - 1] ?? h.monthName} ${h.year}`,
    days,
    today: h.day,
    dateOf: (n) => fromHijri(h.year, h.month, n),
    lead: first ? (first.getDay() + 6) % 7 : 0,
  }
})

const cells = computed(() => {
  const i = info.value
  return Array.from({ length: i.days }, (_, k) => {
    const n = k + 1
    const date = i.dateOf(n)
    // Birleşikte ikinci sayı: ızgara miladi ise hicri günü, hicri ise
    // miladi günü. Dönüşüm hücre başına yapılıyor çünkü iki takvimin
    // ay sınırları örtüşmüyor.
    const alt = birlesik.value && date
      ? (hicri.value ? date.getDate() : toHijri(date)?.day)
      : null
    return {
      n,
      alt,
      today: n === i.today,
      past: n < i.today,
      holy: date ? holyDaysOn(date).length > 0 : false,
    }
  })
})

const WEEK = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P']
</script>

<template>
  <div class="mo">
    <div class="mo-head">
      <span class="mo-title">{{ info.title }}</span>
      <div class="mo-switch">
        <button
          v-for="v in [{ id: 'miladi', l: 'Miladi' }, { id: 'hicri', l: 'Hicri' }, { id: 'birlesik', l: 'İkisi' }]"
          :key="v.id"
          :class="{ on: view === v.id }"
          @click="settings.calendar = { ...settings.calendar, view: v.id }"
        >{{ v.l }}</button>
      </div>
    </div>

    <div class="mo-grid">
      <span v-for="(w, i) in WEEK" :key="i" class="mo-wd">{{ w }}</span>
      <span v-for="n in info.lead" :key="`l${n}`" class="mo-pad" />
      <span
        v-for="c in cells"
        :key="c.n"
        class="mo-day"
        :class="{ today: c.today, past: c.past, holy: c.holy, two: birlesik }"
      >
        <b>{{ c.n }}</b>
        <i v-if="c.alt">{{ c.alt }}</i>
      </span>
    </div>
  </div>
</template>

<style scoped>
.mo { display: flex; flex-direction: column; gap: 0.6rem; }

.mo-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }

.mo-title {
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: var(--text);
}

.mo-switch { display: inline-flex; gap: 2px; padding: 2px; border: 1px solid var(--border); border-radius: 999px; }

.mo-switch button {
  padding: 0.12rem 0.45rem;
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

.mo-pad { height: 1.35rem; }
.mo-grid:has(.two) .mo-pad { height: 1.7rem; }

.mo-day {
  position: relative;
  display: grid;
  place-items: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 7px;
  font-size: 0.62rem;
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
}

/* Birleşik hücre: büyük sayı seçilen takvim, küçüğü öbürü. Hücre
   biraz uzar, ızgara yine yedi sütun kalır. */
.mo-day.two { height: 1.7rem; align-content: center; gap: 0; }
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

/* Dinî gün: rakamın altında ince bir çizgi. Bugünle aynı biçimi
   paylaşmaz — ikisi aynı güne düşebiliyor. */
.mo-day.holy::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 2px;
  width: 0.5rem;
  height: 1px;
  transform: translateX(-50%);
  background: currentColor;
  opacity: 0.9;
}
</style>
