<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { settings, state, loadSettings, setSlot } from '@/lib/settings'
import { ensureVakit, refreshCurrent, current } from '@/lib/vakit'
import { startSystem, stopSystem, hasSystem } from '@/lib/system'
import { loadTopSites } from '@/lib/sites'
import { WIDGETS, widgetById } from '@/data/widgets'
import BackgroundLayer from '@/components/BackgroundLayer.vue'
import WidgetShell from '@/components/WidgetShell.vue'
import ClockWidget from '@/components/ClockWidget.vue'
import VakitWidget from '@/components/VakitWidget.vue'
import MonthWidget from '@/components/MonthWidget.vue'
import SystemWidget from '@/components/SystemWidget.vue'
import AnalogWidget from '@/components/AnalogWidget.vue'
import AyahWidget from '@/components/AyahWidget.vue'
import NoteWidget from '@/components/NoteWidget.vue'
import WeatherWidget from '@/components/WeatherWidget.vue'
import LinkWidget from '@/components/LinkWidget.vue'
import SearchBar from '@/components/SearchBar.vue'
import ShortcutGrid from '@/components/ShortcutGrid.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import LogoMark from '@/components/LogoMark.vue'
import Icon from '@/ui/Icon.vue'

/**
 * Yeni sekme sayfası.
 *
 * Omurga: ORTADA saat + tarih (tek blok, telefon widget'ları gibi),
 * altında arama ve kişisel kısayollar. Yanlardaki iki kolon
 * widget'lar içindir ve hangi widget'ın hangi kolonda duracağı
 * ayardan gelir — kimi vakitleri solda ister, kimi sağda.
 *
 * Saniyelik tek bir tik var ve her şey ondan besleniyor: saat, sayaç
 * ve "hangi vakitteyiz". Sistem ölçümleri AYRI bir tiktedir (3 sn);
 * pil ve işlemci saniyede bir okunacak şeyler değil.
 */
const now = ref(new Date())
const openSettings = ref(false)
const search = ref(null)

let timer = null

onMounted(async () => {
  await loadSettings()
  await ensureVakit(settings.city.plate)
  applyTheme()
  loadTopSites()
  if (inUse('sistem')) startSystem()
  timer = setInterval(() => {
    now.value = new Date()
    refreshCurrent()
  }, 1000)
  // Elin klavyedeyken sekme açıldıysa yazmaya devam edebilmeli.
  search.value?.focus()
})

onUnmounted(() => { clearInterval(timer); stopSystem() })

watch(() => settings.city.plate, (p) => ensureVakit(p))
watch([() => settings.theme, () => settings.themePerVakit, () => settings.palette,
  () => settings.bg.image, () => settings.bg.mode, current], () => applyTheme())

/**
 * Tema `<html>` üzerindeki özniteliklere yazılır (sitedeki kalıp):
 * `data-theme` her zaman AÇIKÇA set edilir — `auto` modda sistem
 * tercihi burada çözülür, böylece CSS'te `prefers-color-scheme`
 * dalı tutmaya gerek kalmıyor.
 */
function applyTheme() {
  const el = document.documentElement
  const dark = settings.theme === 'auto'
    ? !window.matchMedia('(prefers-color-scheme: light)').matches
    : settings.theme === 'dark'
  el.dataset.theme = dark ? 'dark' : 'light'
  el.dataset.palette = settings.palette
  if (settings.themePerVakit && current.value) el.dataset.vakit = current.value
  else delete el.dataset.vakit
  // Arka planda görsel/mesh varken sayfanın kendi gradyanı kalkar ve
  // renkler koyuya sabitlenir (bkz. base.css).
  el.dataset.photo = settings.bg.image && settings.bg.mode !== 'yok' ? 'on' : 'off'
}

const COMPONENTS = {
  vakit: VakitWidget,
  takvim: MonthWidget,
  sistem: SystemWidget,
  analog: AnalogWidget,
  ayet: AyahWidget,
  not: NoteWidget,
  hava: WeatherWidget,
}

/** Bağlantı widget'ları tek bileşenden beslenir; fark yalnızca veride. */
const LINKS = { dini: {}, yapayzeka: { compact: true }, sosyal: { compact: true } }

const inUse = (id) => ['sol', 'sag', 'alt'].some((s) => settings.layout[s]?.includes(id))

watch(() => settings.layout, () => (inUse('sistem') ? startSystem() : stopSystem()), { deep: true })

/** Bir kolondaki widget'lar — kapalı ya da desteklenmeyenler elenir. */
const columnOf = (slot) => computed(() =>
  (settings.layout[slot] ?? [])
    .filter((id) => id !== 'sistem' || hasSystem)
    .map((id) => widgetById(id))
    .filter(Boolean))

const left = columnOf('sol')
const right = columnOf('sag')
const under = columnOf('alt')

const close = (id) => setSlot(id, 'kapali')
</script>

<template>
  <main class="page" :class="{ dim: !state.ready }">
    <BackgroundLayer />

    <aside class="col left">
      <WidgetShell
        v-for="w in left"
        :key="w.id"
        :id="w.id"
        :title="w.title"
        :icon="w.icon"
        @close="close"
      >
        <component :is="COMPONENTS[w.id]" v-if="COMPONENTS[w.id]" :now="now" />
        <LinkWidget v-else :links="settings[w.id]" v-bind="LINKS[w.id]" />
      </WidgetShell>
    </aside>

    <section class="mid">
      <ClockWidget :now="now" />
      <SearchBar ref="search" />
      <ShortcutGrid />
      <div v-if="under.length" class="under">
        <WidgetShell
          v-for="w in under"
          :key="w.id"
          :id="w.id"
          :title="w.title"
          :icon="w.icon"
          @close="close"
        >
          <component :is="COMPONENTS[w.id]" v-if="COMPONENTS[w.id]" :now="now" />
          <LinkWidget v-else :links="settings[w.id]" v-bind="LINKS[w.id]" />
        </WidgetShell>
      </div>
    </section>

    <aside class="col right">
      <WidgetShell
        v-for="w in right"
        :key="w.id"
        :id="w.id"
        :title="w.title"
        :icon="w.icon"
        @close="close"
      >
        <component :is="COMPONENTS[w.id]" v-if="COMPONENTS[w.id]" :now="now" />
        <LinkWidget v-else :links="settings[w.id]" v-bind="LINKS[w.id]" />
      </WidgetShell>
    </aside>

    <!-- Marka işareti üstte ortada, kişiselleştirme altta ortada: ikisi
         de sabit, widget kolonlarının yerleşimine karışmaz. -->
    <header class="brand">
      <LogoMark />
    </header>

    <footer class="foot">
      <button class="personalize" aria-label="Kişiselleştir" @click="openSettings = true">
        <Icon name="gorunum" :size="15" />
        <span>Kişiselleştir</span>
      </button>
    </footer>

    <SettingsPanel :open="openSettings" @close="openSettings = false" />
  </main>
</template>

<style scoped>
/* Mobil taban: tek kolon, her şey alt alta. Üç kolonlu düzen yalnızca
   geniş ekranda — kural sitedekiyle aynı: mobil düzen medya
   sorgusunun DIŞINDA kalır. */
.page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4rem;
  padding: 2.5rem 1rem 4rem;
}

/* Ayarlar okunana kadar sayfa bir anlığına varsayılanlarla duruyor;
   sönük başlayıp açılması, yanlış şehirle "yanıp sönmesinden" iyi. */
.dim { opacity: 0; }
.page { transition: opacity 0.18s ease-out; }

.col { display: flex; flex-direction: column; gap: 0.8rem; width: min(100%, 21rem); }

.mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.6rem;
  width: 100%;
}

.under { display: flex; flex-direction: column; gap: 0.8rem; width: min(100%, 34rem); }

/* Marka işareti bir kutuya girmez: dairenin kenarı işareti kesiyordu.
   Yalnızca konumlandırma var; zemin, çerçeve ve kırpma yok. */
.brand {
  z-index: 5;
  place-items: center;
  display: flex;
  position: fixed;
  top: .7rem;
  left: 50%;
  transform: translate(-50%);
  align-items: center;
  justify-content: center;
}

.foot {
  position: fixed;
  left: 50%;
  bottom: 1rem;
  z-index: 5;
  transform: translateX(-50%);
}

.personalize {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.42rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg) 55%, transparent);
  color: var(--text-muted);
  font-family: inherit;
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
  cursor: pointer;
}

.personalize:hover { color: var(--text); border-color: var(--accent-ui); }

@media (min-width: 900px) {
  .page {
    display: grid;
    grid-template-columns: 19rem minmax(0, 1fr) 19rem;
    align-items: start;
    gap: 2rem;
    padding: 3rem 2rem 4rem;
  }

  .col { width: auto; }

  /* Orta kolon dikeyde ortalanır: saat ve arama ekranın göbeğinde
     olmalı, yanındaki widget'ların boyuna göre kaymamalı. */
  .mid {
    justify-content: center;
    min-height: calc(100dvh - 7rem);
    gap: 2rem;
  }
}
</style>
