<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { settings } from '@/lib/settings'
import { bgUrl, bgById, meshOf, CUSTOM_BG } from '@/data/backgrounds'

/**
 * Arka plan katmanı.
 *
 * Görselin kendisi, üstünde karartma, isteğe bağlı ızgara ve gren.
 * Sıra önemli: gren ve ızgara KARARTMANIN üstünde durur, yoksa
 * karartma onları da söndürüyor.
 *
 * Bulanıklık görselin kenarlarını saydamlaştırdığı için görsel
 * bulanıklık kadar taşırılıyor (sitedeki paylaşım tuvalinde ölçülen
 * aynı tuzak).
 */
const mode = computed(() => settings.bg.mode ?? 'foto')
/** Kullanıcının kendi görseli seçiliyse kaynak CDN değil, data URI. */
const custom = computed(() => settings.bg.image === CUSTOM_BG)
const img = computed(() => {
  if (mode.value !== 'foto' || !settings.bg.image) return ''
  return custom.value ? (settings.bg.custom || '') : bgUrl(settings.bg.image)
})

/**
 * Mesh gradyan: görselin KENDİ renklerinden.
 *
 * Renkler kütükte önceden duruyor (`meshOf`); çalışma anında görseli
 * tuvale çizip okumak, eklentinin kökeni CDN'in CORS listesinde
 * olmadığı için çalışmıyor. Beş renk, beş radyal leke — fotoğrafın
 * havası kalıyor, ayrıntısı gidiyor; yazı her zaman okunuyor.
 */
const mesh = computed(() => {
  if (mode.value !== 'mesh') return ''
  // Kendi görselinin renkleri dosya seçilirken çıkarılıp kaydedildi.
  const own = custom.value ? settings.bg.customMesh : meshOf(settings.bg.image)
  const c = own ?? ['#1b1d22', '#2a2f39', '#101216', '#3a2f28', '#0b0c0e']
  const spots = [
    [15, 20], [85, 15], [75, 80], [20, 85], [50, 50],
  ]
  const layers = spots.map(([x, y], i) =>
    `radial-gradient(60% 55% at ${x}% ${y}%, ${c[i % c.length]} 0%, transparent 70%)`)
  return `${layers.join(', ')}, linear-gradient(160deg, ${c[1]}, ${c[0]})`
})
const tone = computed(() => bgById(settings.bg.image)?.tone ?? 'orta')

/** Açık görselde yazı kaybolmasın: karartmaya bir taban eklenir. */
const dim = computed(() => {
  const base = tone.value === 'açık' ? 12 : 0
  return Math.min(85, (settings.bg.dim ?? 0) + base) / 100
})

const blur = computed(() => Number(settings.bg.blur) || 0)

/**
 * Izgara — widget'ların DELDİĞİ bir ağ.
 *
 * Izgara düz bir CSS deseniyken widget'ların kenarlıklarıyla
 * karışıyordu: iki ince çizgi yan yana gelince hangisi çerçeve,
 * hangisi ızgara belli olmuyordu. Şimdi tuvale çiziliyor ve her
 * widget'ın dikdörtgeni `destination-out` ile SİLİNİYOR — ağ
 * widget'ın altından geçmiyor, etrafından dolaşıyor.
 *
 * Ölçüler gerçek yerleşimden okunuyor (`getBoundingClientRect`), bu
 * yüzden yeni bir widget eklemek ya da pencereyi değiştirmek ayrı bir
 * ayar istemiyor.
 */
const GRID = 80
/** Delik açılan şeyler: widget'lar, arama kutusu, saat ve mini blok. */
const HOLES = '.w, .search, .ck, .mini'
const canvas = ref(null)
let ro = null
let mo = null
let pending = 0
/** Şu an izlenen kutular — yenisi geldiğinde gözlemciye eklenir. */
let watched = new Set()

function paint() {
  const el = canvas.value
  // Tuval henüz yoksa (ızgara az önce açıldı) bir sonraki kareye bırak:
  // sessizce vazgeçmek "ızgara bazen hiç çizilmiyor"un sebebiydi.
  if (!el) { if (settings.bg.grid) schedule(); return }
  const dpr = window.devicePixelRatio || 1
  const w = window.innerWidth
  const h = window.innerHeight
  if (!w || !h) return
  el.width = Math.round(w * dpr)
  el.height = Math.round(h * dpr)
  const ctx = el.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(255,255,255,0.07)'
  ctx.lineWidth = 1
  ctx.beginPath()
  // Yarım piksel kaydırma: tam sayıda çizilen 1px çizgi iki piksele
  // yayılıp bulanıklaşıyor.
  for (let x = GRID; x < w; x += GRID) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h) }
  for (let y = GRID; y < h; y += GRID) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5) }
  ctx.stroke()

  ctx.globalCompositeOperation = 'destination-out'
  const pad = 6
  for (const node of document.querySelectorAll(HOLES)) {
    const r = node.getBoundingClientRect()
    if (!r.width || !r.height) continue
    const radius = parseFloat(getComputedStyle(node).borderRadius) || 10
    ctx.beginPath()
    ctx.roundRect(r.x - pad, r.y - pad, r.width + pad * 2, r.height + pad * 2, radius + pad)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'
}

/** Çizim bir sonraki kareye ertelenir: ardışık değişiklikler tek çizim. */
function schedule() {
  cancelAnimationFrame(pending)
  pending = requestAnimationFrame(() => nextTick(paint))
}

/**
 * Her kutuyu AYRI izle.
 *
 * Önce yalnızca `document.body` izleniyordu ve yetmedi: not kutusu
 * elle büyütüldüğünde gövdenin boyu değişmiyor (widget kolonun
 * içinde, sayfa zaten o kadar uzun), gözlemci hiç tetiklenmiyor ve
 * ızgara not kutusunun arkasında asılı kalıyordu. Kutuların kendisi
 * izlenince her boy değişimi yakalanıyor.
 */
function observeHoles() {
  if (!ro) return
  const now = new Set(document.querySelectorAll(HOLES))
  for (const el of now) if (!watched.has(el)) ro.observe(el)
  for (const el of watched) if (!now.has(el)) ro.unobserve(el)
  watched = now
}

onMounted(() => {
  schedule()
  window.addEventListener('resize', schedule)
  // Sekme arkadayken `requestAnimationFrame` çalışmıyor: öne gelince
  // bir kez daha çizilmezse ızgara eksik kalabiliyor.
  document.addEventListener('visibilitychange', schedule)
  ro = new ResizeObserver(schedule)
  ro.observe(document.body)
  observeHoles()
  // Widget açılıp kapandıkça kutu listesi değişiyor; yeni gelen
  // kutular da izlenmeli.
  mo = new MutationObserver(() => { observeHoles(); schedule() })
  mo.observe(document.body, { childList: true, subtree: true })
  // Yazı tipi geç gelirse yerleşim kayıyor ve delikler eski yerinde
  // kalıyor.
  document.fonts?.ready?.then(schedule).catch(() => {})
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', schedule)
  document.removeEventListener('visibilitychange', schedule)
  ro?.disconnect()
  mo?.disconnect()
  cancelAnimationFrame(pending)
})

watch(() => [settings.bg.grid, settings.surface, settings.layout, settings.noteHeight],
  () => { nextTick(observeHoles); schedule() }, { deep: true })
</script>

<template>
  <div v-if="img || mesh" class="bg" aria-hidden="true">
    <div v-if="mesh" class="bg-mesh" :style="{ backgroundImage: mesh }" />
    <div
      v-if="img"
      class="bg-img"
      :style="{
        backgroundImage: `url(${img})`,
        filter: blur ? `blur(${blur}px)` : 'none',
        inset: blur ? `-${blur * 2}px` : '0',
      }"
    />
    <div class="bg-dim" :style="{ opacity: dim }" />
    <canvas v-if="settings.bg.grid" ref="canvas" class="bg-grid" />
    <div v-if="settings.bg.grain" class="bg-grain" />
  </div>
</template>

<style scoped>
.bg { position: fixed; inset: 0; z-index: -1; overflow: hidden; }

.bg-mesh { position: absolute; inset: 0; background-size: cover; }

.bg-img {
  position: absolute;
  background-size: cover;
  background-position: center;
}

.bg-dim { position: absolute; inset: 0; background: #000; }

/* Izgara: yazıyla yarışmayacak kadar soluk, ama sayfaya bir düzen
   duygusu veriyor. Ölçü 80px — ekran büyüdükçe kare sayısı artar,
   oranı değil. Çizim tuvalde, çünkü widget'ların bıraktığı delikler
   CSS deseniyle kesilemiyor. */
.bg-grid { position: absolute; inset: 0; width: 100%; height: 100%; }

/* Gren dokusu sitedekiyle aynı kaynaktan (feTurbulence data URI):
   iki uygulama aynı karakterde olsun. */
.bg-grain {
  position: absolute;
  inset: 0;
  opacity: 0.22;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
}
</style>
