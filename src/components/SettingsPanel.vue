<script setup>
import { ref, computed } from 'vue'
import { CITIES } from '@alaturkavakitler/core'
import {
  settings,
  ENGINES, CLOCK_STYLES, CLOCK_SOURCES, CLOCK_WEIGHTS, CALENDAR_VIEWS,
  SURFACES, NOTIFY_OPTIONS, VAKIT_LABELS,
  DINI_LINKS, AI_LINKS, SOCIAL_LINKS, GOOGLE_LINKS,
  BUILTIN_GROUPS, GROUP_ICONS, addGroup, removeGroup, moveWidget,
} from '@/lib/settings'
import { isDark } from '@/lib/theme'
import { exportBackup, importBackup } from '@/lib/backup'
import LayoutEditor from '@/components/LayoutEditor.vue'
import { BACKGROUNDS, bgUrl, CUSTOM_BG } from '@/data/backgrounds'
import Icon from '@/ui/Icon.vue'
import Select from '@/ui/Select.vue'
import Switch from '@/ui/Switch.vue'

/**
 * Ayarlar.
 *
 * Panel GRUPLU: her bölümün bir ikonu, bir başlığı ve sağa uzanan ince
 * bir çizgisi var (sitedeki editör panelinin omurgası). Önce düz bir
 * liste vardı ve nerede ne olduğu ancak okuyarak bulunuyordu.
 *
 * Yerel `select` ve `checkbox` KULLANILMIYOR: açılan liste işletim
 * sisteminin penceresidir ve koyu arayüzde beyaz yazı beyaz zemine
 * düşüp okunmuyordu. Yerlerine `ui/Select.vue` ve `ui/Switch.vue`.
 *
 * Bölümler katlanabilir; hangisinin açık olduğu oturum boyunca
 * hatırlanır (uzun panelde her açılışta aşağı inmek gerekmesin).
 */
defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])

const openGroups = ref(new Set(['yerlesim', 'arkaplan']))
const toggleGroup = (id) => {
  const s = new Set(openGroups.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openGroups.value = s
}
const isOpen = (id) => openGroups.value.has(id)

// CITIES bir DİZİ değil, plakaya göre anahtarlanmış bir nesne.
const cityOptions = Object.values(CITIES)
  .map((c) => ({ value: String(c.plate), label: c.name, hint: String(c.plate) }))

const opt = (list) => list.map((x) => ({ value: x.id, label: x.label }))

const dropLink = (key, id) => { settings[key] = settings[key].filter((l) => l.id !== id) }
const BUILTIN_META = {
  dini: { label: 'Dinî bağlantılar', icon: 'kuran' },
  yapayzeka: { label: 'Yapay zekâ', icon: 'ai' },
  sosyal: { label: 'Sosyal medya', icon: 'sosyal' },
  google: { label: 'Google', icon: 'kisayol' },
}

/**
 * Bağlantı grupları: hazır dördü + kullanıcının kendi grupları.
 *
 * İkisi AYNI yapıda tutuluyor (künye ayrı, bağlantılar `settings[key]`
 * altında), bu yüzden buradaki liste ve aşağıdaki bölüm ikisini de
 * ayırt etmeden çiziyor. Tek fark: hazır grup silinemez, sıfırlanır;
 * kullanıcı grubu sıfırlanmaz, silinir.
 */
const LINK_KEYS = computed(() =>
  [...BUILTIN_GROUPS, ...settings.groupMeta.map((g) => g.key)])

const LINK_META = computed(() => {
  const out = { ...BUILTIN_META }
  for (const g of settings.groupMeta) out[g.key] = { label: g.title, icon: g.icon || 'kisayol' }
  return out
})

const isBuiltin = (k) => BUILTIN_GROUPS.includes(k)

/** Yeni grup formu. */
const newGroup = ref({ open: false, title: '', icon: 'kisayol' })

function createGroup() {
  const t = newGroup.value.title.trim()
  if (!t) return
  const key = addGroup(t, newGroup.value.icon)
  // Yeni grup görünür olsun: kapalı bir widget olarak doğarsa
  // kullanıcı onu yerleşim düzenleyicide aramak zorunda kalıyor.
  moveWidget(key, 'sag')
  draft.value[key] = { name: '', url: '' }
  adding.value[key] = true
  open.value = new Set([...open.value, key])
  newGroup.value = { open: false, title: '', icon: 'kisayol' }
}

function dropGroup(key) {
  if (confirmGroup.value !== key) { confirmGroup.value = key; return }
  removeGroup(key)
  confirmGroup.value = null
}
const confirmGroup = ref(null)
const DEFAULT_LINKS = { dini: DINI_LINKS, yapayzeka: AI_LINKS, sosyal: SOCIAL_LINKS, google: GOOGLE_LINKS }
const resetLinks = (key) => { settings[key] = structuredClone(DEFAULT_LINKS[key]) }

/** Yeni bağlantı formu — grup başına ayrı alan (biri açıkken öbürü karışmasın). */
// Taslaklar anahtar başına TEMBEL kuruluyor: grup listesi artık sabit
// değil, kullanıcı yeni grup ekleyebiliyor.
const draft = ref({})
const adding = ref({})
const draftOf = (k) => (draft.value[k] ??= { name: '', url: '' })

function addLink(key) {
  const d = draft.value[key]
  let u = (d.url || '').trim()
  if (!u) return
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`
  let host = ''
  try { host = new URL(u).hostname.replace(/^www\./, '') } catch { return }
  const n = (d.name || '').trim() || host
  settings[key] = [...settings[key], { id: `u${Date.now()}`, name: n, url: u }]
  draft.value = { ...draft.value, [key]: { name: '', url: '' } }
  adding.value = { ...adding.value, [key]: false }
}

const bgModes = [
  { value: 'foto', label: 'Fotoğraf' },
  { value: 'mesh', label: 'Mesh gradyan' },
  { value: 'yok', label: 'Yok' },
]

/**
 * Kendi görselini arka plan yap.
 *
 * Dosya OLDUĞU GİBİ saklanmıyor: `chrome.storage.local` kotası 10 MB
 * ve bir telefon fotoğrafı tek başına onu doldurabiliyor. Görsel en
 * çok 2560px enine küçültülüp JPEG'e çevriliyor (kalite 0.82) —
 * ekranda farkı görünmüyor, boyu onda birine iniyor.
 *
 * Mesh renkleri de burada çıkarılıyor: hazır görsellerde tuval CORS'a
 * takıldığı için renkler kütüğe önceden yazılmıştı, ama yerel bir
 * dosya tuvali kirletmiyor — kullanıcının görselinde mesh kipi de
 * çalışsın diye beş renk okunuyor.
 */
const file = ref(null)
const bgNote = ref('')
const MAX_W = 2560

function pickFile(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  if (!f.type.startsWith('image/')) { bgNote.value = 'Bu bir görsel değil.'; return }
  bgNote.value = 'Görsel hazırlanıyor…'
  const reader = new FileReader()
  reader.onerror = () => { bgNote.value = 'Dosya okunamadı.' }
  reader.onload = () => {
    const img = new Image()
    // `decode()` KULLANILMIYOR: belgeye eklenmemiş `Image` + data URI
    // bileşiminde çözülmüyor (sitedeki palette.js'te ölçüldü).
    img.onerror = () => { bgNote.value = 'Görsel açılamadı.' }
    img.onload = () => {
      try {
        const scale = Math.min(1, MAX_W / img.naturalWidth)
        const w = Math.round(img.naturalWidth * scale)
        const h = Math.round(img.naturalHeight * scale)
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        settings.bg.custom = c.toDataURL('image/jpeg', 0.82)
        settings.bg.customMesh = meshFrom(ctx, c)
        settings.bg.image = CUSTOM_BG
        if (settings.bg.mode === 'yok') settings.bg.mode = 'foto'
        bgNote.value = ''
      } catch {
        bgNote.value = 'Görsel çok büyük, daha küçüğünü dene.'
      }
    }
    img.src = reader.result
  }
  reader.readAsDataURL(f)
}

/**
 * Görselden beş mesh rengi.
 *
 * Tuval 5×1'e indirgeniyor: tarayıcı ortalamayı kendisi alıyor ve
 * ortaya görselin soldan sağa renk şeridi çıkıyor. Kuantalamaya gerek
 * yok, zaten ortalama alınmış renkler.
 */
function meshFrom(ctx, canvas) {
  try {
    const small = document.createElement('canvas')
    small.width = 5
    small.height = 1
    small.getContext('2d').drawImage(canvas, 0, 0, 5, 1)
    const d = small.getContext('2d').getImageData(0, 0, 5, 1).data
    const hex = (n) => n.toString(16).padStart(2, '0')
    return Array.from({ length: 5 }, (_, i) =>
      `#${hex(d[i * 4])}${hex(d[i * 4 + 1])}${hex(d[i * 4 + 2])}`)
  } catch {
    return null
  }
}

/* ── Yedek ───────────────────────────────────────────────────────── */
const backupFile = ref(null)
const backupNote = ref('')
const backupWarn = ref(false)
const pendingBackup = ref(null)

async function pickBackup(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  try {
    const data = await importBackup(f)
    pendingBackup.value = data
    backupWarn.value = false
    const d = data.at ? new Date(data.at).toLocaleString('tr-TR') : 'tarihsiz'
    backupNote.value = `${Object.keys(data.settings).length} ayar · ${d}. Üzerine yazılsın mı?`
  } catch (err) {
    pendingBackup.value = null
    backupWarn.value = true
    backupNote.value = err.message
  }
}

function applyPending() {
  const data = pendingBackup.value
  if (!data) return
  Object.assign(settings, data.settings)
  pendingBackup.value = null
  backupWarn.value = false
  backupNote.value = 'Yüklendi.'
}
</script>

<template>
  <div v-if="open" class="veil" @click="emit('close')">
    <aside class="panel" role="dialog" aria-label="Ayarlar" @click.stop>
      <header class="head">
        <span class="head-t">Ayarlar</span>
        <button class="x" aria-label="Kapat" @click="emit('close')"><Icon name="kapat" :size="14" /></button>
      </header>

      <div class="body">
        <!-- ── Yer ── -->
        <section class="grp">
          <button class="grp-head" @click="toggleGroup('yer')">
            <Icon name="sehir" :size="13" /><span>Yer</span><span class="rule" /><span class="chev">{{ isOpen('yer') ? '−' : '+' }}</span>
          </button>
          <div v-if="isOpen('yer')" class="grp-body">
            <label class="row"><span>Şehir</span>
              <Select
                :model-value="settings.city.plate"
                :options="cityOptions"
                label="Şehir"
                @update:model-value="settings.city = { plate: $event, name: cityOptions.find(c => c.value === $event).label }"
              />
            </label>
            <label class="row"><span>Hicri tarih akşam ezanıyla değişsin</span>
              <Switch v-model="settings.hijriOffset" label="Hicri kayma" />
            </label>
          </div>
        </section>

        <!-- ── Saat ── -->
        <section class="grp">
          <button class="grp-head" @click="toggleGroup('saat')">
            <Icon name="saat" :size="13" /><span>Saat</span><span class="rule" /><span class="chev">{{ isOpen('saat') ? '−' : '+' }}</span>
          </button>
          <div v-if="isOpen('saat')" class="grp-body">
            <div class="row"><span>Biçim</span>
              <div class="seg">
                <button
                  v-for="c in CLOCK_STYLES"
                  :key="c.id"
                  :class="{ on: settings.clock.style === c.id }"
                  @click="settings.clock = { ...settings.clock, style: c.id }"
                >{{ c.label }}</button>
              </div>
            </div>
            <div class="row"><span>Büyük saat</span>
              <div class="seg">
                <button
                  v-for="c in CLOCK_SOURCES"
                  :key="c.id"
                  :class="{ on: settings.clock.main === c.id }"
                  @click="settings.clock = { ...settings.clock, main: c.id }"
                >{{ c.label }}</button>
              </div>
            </div>
            <div class="row"><span>Yanındaki</span>
              <div class="seg">
                <button
                  v-for="c in [...CLOCK_SOURCES, { id: 'yok', label: 'Yok' }]"
                  :key="c.id"
                  :class="{ on: settings.clock.side === c.id }"
                  @click="settings.clock = { ...settings.clock, side: c.id }"
                >{{ c.label }}</button>
              </div>
            </div>
            <div v-if="settings.clock.style !== 'nokta'" class="row"><span>Kalınlık</span>
              <div class="seg">
                <button
                  v-for="w in CLOCK_WEIGHTS"
                  :key="w.id"
                  :class="{ on: settings.clock.weight === w.id }"
                  @click="settings.clock = { ...settings.clock, weight: w.id }"
                >{{ w.label }}</button>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Yerleşim ── -->
        <section class="grp">
          <button class="grp-head" @click="toggleGroup('yerlesim')">
            <Icon name="yerlesim" :size="13" /><span>Widget yerleşimi</span><span class="rule" /><span class="chev">{{ isOpen('yerlesim') ? '−' : '+' }}</span>
          </button>
          <div v-if="isOpen('yerlesim')" class="grp-body">
            <LayoutEditor />
          </div>
        </section>

        <!-- ── Takvim ── -->
        <section class="grp">
          <button class="grp-head" @click="toggleGroup('takvim')">
            <Icon name="takvim" :size="13" /><span>Takvim</span><span class="rule" /><span class="chev">{{ isOpen('takvim') ? '−' : '+' }}</span>
          </button>
          <div v-if="isOpen('takvim')" class="grp-body">
            <div class="row"><span>Görünüm</span>
              <div class="seg">
                <button
                  v-for="v in CALENDAR_VIEWS"
                  :key="v.id"
                  :class="{ on: settings.calendar.view === v.id }"
                  @click="settings.calendar = { ...settings.calendar, view: v.id }"
                >{{ v.label }}</button>
              </div>
            </div>
            <div v-if="settings.calendar.view === 'birlesik'" class="row"><span>Büyük yazılan</span>
              <div class="seg">
                <button
                  v-for="v in CALENDAR_VIEWS.filter(x => x.id !== 'birlesik')"
                  :key="v.id"
                  :class="{ on: settings.calendar.main === v.id }"
                  @click="settings.calendar = { ...settings.calendar, main: v.id }"
                >{{ v.label }}</button>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Arka plan ── -->
        <section class="grp">
          <button class="grp-head" @click="toggleGroup('arkaplan')">
            <Icon name="arkaplan" :size="13" /><span>Arka plan</span><span class="rule" /><span class="chev">{{ isOpen('arkaplan') ? '−' : '+' }}</span>
          </button>
          <div v-if="isOpen('arkaplan')" class="grp-body">
            <div class="bgs">
              <button
                v-for="b in BACKGROUNDS"
                :key="b.id"
                class="bg-opt"
                :class="{ on: settings.bg.image === b.id }"
                :title="b.label"
                :style="{ backgroundImage: `url(${bgUrl(b.id, true)})` }"
                @click="settings.bg.image = b.id"
              />
              <!-- Kendi görseli: kütükteki dokuzun yanında, aynı
                   ızgarada. Seçildiğinde küçük hâli karenin zemini
                   oluyor, yani öbürleriyle aynı dilde. -->
              <button
                class="bg-opt bg-own"
                :class="{ on: settings.bg.image === CUSTOM_BG }"
                title="Kendi görselin"
                :style="settings.bg.custom ? { backgroundImage: `url(${settings.bg.custom})` } : null"
                @click="file?.click()"
              >
                <Icon v-if="!settings.bg.custom" name="arkaplan" :size="14" />
                <span v-else class="bg-own-tag">Değiştir</span>
              </button>
              <input
                ref="file"
                type="file"
                accept="image/*"
                class="bg-file"
                @change="pickFile"
              />
            </div>
            <p v-if="bgNote" class="bg-note">{{ bgNote }}</p>
            <div class="row"><span>Biçim</span>
              <div class="seg">
                <button
                  v-for="m in bgModes"
                  :key="m.value"
                  :class="{ on: settings.bg.mode === m.value }"
                  @click="settings.bg.mode = m.value"
                >{{ m.label }}</button>
              </div>
            </div>
            <label class="row"><span>{{ isDark ? 'Karartma' : 'Aydınlatma' }}</span>
              <input type="range" min="0" max="80" step="5" v-model.number="settings.bg.dim" />
              <b>{{ settings.bg.dim }}%</b>
            </label>
            <label class="row"><span>Bulanıklık</span>
              <input type="range" min="0" max="20" step="1" v-model.number="settings.bg.blur" />
              <b>{{ settings.bg.blur }}px</b>
            </label>
            <label class="row"><span>Izgara</span><Switch v-model="settings.bg.grid" label="Izgara" /></label>
            <label class="row"><span>Gren</span><Switch v-model="settings.bg.grain" label="Gren" /></label>
            <div class="row"><span>Widget zemini</span>
              <div class="seg wrap">
                <button
                  v-for="x in SURFACES"
                  :key="x.id"
                  :class="{ on: settings.surface === x.id }"
                  @click="settings.surface = x.id"
                >{{ x.label }}</button>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Arama ── -->
        <section class="grp">
          <button class="grp-head" @click="toggleGroup('arama')">
            <Icon name="arama" :size="13" /><span>Arama ve kısayollar</span><span class="rule" /><span class="chev">{{ isOpen('arama') ? '−' : '+' }}</span>
          </button>
          <div v-if="isOpen('arama')" class="grp-body">
            <label class="row"><span>Arama motoru</span>
              <Select v-model="settings.engine" :options="ENGINES.map(e => ({ value: e.id, label: e.label }))" label="Arama motoru" />
            </label>
            <label class="row"><span>Sık ziyaret edilenler listelensin</span>
              <Switch
                :model-value="settings.shortcutMode === 'oto'"
                label="Sık ziyaret edilenler"
                @update:model-value="settings.shortcutMode = $event ? 'oto' : 'kendi'"
              />
            </label>
            <p class="hint">Kısayol ekleme, sabitleme ve sıralama ızgaranın kendisinde.</p>
          </div>
        </section>

        <!-- ── Hatırlatma ── -->
        <section class="grp">
          <button class="grp-head" @click="toggleGroup('bildirim')">
            <Icon name="bildirim" :size="13" /><span>Vakit hatırlatması</span><span class="rule" /><span class="chev">{{ isOpen('bildirim') ? '−' : '+' }}</span>
          </button>
          <div v-if="isOpen('bildirim')" class="grp-body">
            <label v-for="(label, key) in VAKIT_LABELS" :key="key" class="row">
              <span>{{ label }}</span>
              <Select
                :model-value="settings.notify[key]"
                :options="NOTIFY_OPTIONS"
                :label="`${label} hatırlatması`"
                @update:model-value="settings.notify = { ...settings.notify, [key]: $event }"
              />
            </label>
            <p class="hint">Her vakit ayrı ayarlanır. Bildirim tarayıcı başka sayfadayken de gelir; izin ilk bildirimde sorulur.</p>
          </div>
        </section>

        <!-- ── Bağlantılar ── -->
        <section v-for="k in LINK_KEYS" :key="k" class="grp">
          <button class="grp-head" @click="toggleGroup(k)">
            <Icon :name="LINK_META[k].icon" :size="13" />
            <span>{{ LINK_META[k].label }}</span>
            <span class="rule" /><span class="chev">{{ isOpen(k) ? '−' : '+' }}</span>
          </button>
          <div v-if="isOpen(k)" class="grp-body">
            <ul class="links">
              <li v-for="l in settings[k]" :key="l.id">
                <span class="ln">{{ l.name }}</span>
                <span class="lu">{{ l.url.replace(/^https?:\/\//, '') }}</span>
                <button class="del" :aria-label="`${l.name} sil`" @click="dropLink(k, l.id)">
                  <Icon name="kapat" :size="11" />
                </button>
              </li>
            </ul>
            <form v-if="adding[k]" class="link-add" @submit.prevent="addLink(k)">
              <input v-model="draftOf(k).name" placeholder="Ad" :aria-label="`${k} bağlantı adı`" />
              <input v-model="draftOf(k).url" placeholder="adres.com" :aria-label="`${k} bağlantı adresi`" />
              <button type="submit">Kaydet</button>
            </form>
            <div class="link-actions">
              <button class="reset" type="button" @click="adding[k] = !adding[k]">
                {{ adding[k] ? 'Vazgeç' : 'Ekle' }}
              </button>
              <!-- Hazır grup SİLİNMEZ (kütükten geliyor), sıfırlanır;
                   kullanıcı grubu sıfırlanmaz, silinir. -->
              <button v-if="isBuiltin(k)" class="reset" type="button" @click="resetLinks(k)">Hazır listeye dön</button>
              <button
                v-else
                class="reset"
                :class="{ danger: confirmGroup === k }"
                type="button"
                @click="dropGroup(k)"
              >{{ confirmGroup === k ? 'Emin misin?' : 'Grubu sil' }}</button>
            </div>
          </div>
        </section>

        <!-- ── Yeni kısayol grubu ── -->
        <section class="grp">
          <button class="grp-head" @click="newGroup.open = !newGroup.open">
            <Icon name="arti" :size="13" /><span>Yeni kısayol grubu</span>
            <span class="rule" /><span class="chev">{{ newGroup.open ? '−' : '+' }}</span>
          </button>
          <div v-if="newGroup.open" class="grp-body">
            <p class="hint">Kendi başlığın, kendi ikonun, kendi bağlantıların. Grup ayrı bir widget olarak eklenir; yerini yerleşim düzenleyiciden değiştirebilirsin.</p>
            <form class="link-add" @submit.prevent="createGroup">
              <input v-model="newGroup.title" placeholder="Grup adı" aria-label="Grup adı" />
              <button type="submit" :disabled="!newGroup.title.trim()">Oluştur</button>
            </form>
            <div class="icons">
              <button
                v-for="i in GROUP_ICONS"
                :key="i"
                class="icon-opt"
                :class="{ on: newGroup.icon === i }"
                :title="i"
                type="button"
                @click="newGroup.icon = i"
              ><Icon :name="i" :size="15" /></button>
            </div>
          </div>
        </section>

        <!-- ── Yedek ── -->
        <section class="grp">
          <button class="grp-head" @click="toggleGroup('yedek')">
            <Icon name="yerlesim" :size="13" /><span>Yedek</span>
            <span class="rule" /><span class="chev">{{ isOpen('yedek') ? '−' : '+' }}</span>
          </button>
          <div v-if="isOpen('yedek')" class="grp-body">
            <p class="hint">
              Bütün ayarların tarayıcının kendi deposunda duruyor; tarayıcı verisi
              temizlenirse geri getirecek bir sunucu yok. Dosya bu cihazda üretilir,
              hiçbir yere gönderilmez.
            </p>
            <div class="link-actions">
              <button class="reset" type="button" @click="exportBackup()">Yedeği indir</button>
              <button class="reset" type="button" @click="backupFile?.click()">Yedekten yükle</button>
            </div>
            <input ref="backupFile" type="file" accept="application/json,.json" class="bg-file" @change="pickBackup" />
            <p v-if="backupNote" class="hint" :class="{ warn: backupWarn }">{{ backupNote }}</p>
            <!-- İçe aktarma İKİ adımlı: yanlış dosyada geri dönüşü
                 olmayan bir iş, tek dokunuşla yapılmamalı. -->
            <div v-if="pendingBackup" class="link-actions">
              <button class="reset danger" type="button" @click="applyPending">Üzerine yaz</button>
              <button class="reset" type="button" @click="pendingBackup = null; backupNote = ''">Vazgeç</button>
            </div>
          </div>
        </section>

        <!-- ── Görünüm ── -->
        <section class="grp">
          <button class="grp-head" @click="toggleGroup('gorunum')">
            <Icon name="gorunum" :size="13" /><span>Görünüm</span><span class="rule" /><span class="chev">{{ isOpen('gorunum') ? '−' : '+' }}</span>
          </button>
          <div v-if="isOpen('gorunum')" class="grp-body">
            <label class="row"><span>Tema</span>
              <Select
                v-model="settings.theme"
                :options="[{ value: 'auto', label: 'Sistem' }, { value: 'dark', label: 'Koyu' }, { value: 'light', label: 'Açık' }]"
                label="Tema"
              />
            </label>
            <label class="row"><span>Renk vakte göre değişsin</span>
              <Switch v-model="settings.themePerVakit" label="Vakit rengi" />
            </label>
          </div>
        </section>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* Grup ikonu seçici: küçük kareler, seçili olan aksanlı. */
.icons { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.4rem; }

.icon-opt {
  display: grid;
  place-items: center;
  width: 1.9rem;
  height: 1.9rem;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.icon-opt.on { border-color: var(--accent-ui); color: var(--text); }
.reset.danger { color: var(--primary); border-color: var(--primary); }
.hint.warn { color: var(--primary); }

/* Kendi görseli: boşken ikonlu bir kare, doluyken küçük hâli zemin. */
.bg-own {
  display: grid;
  place-items: center;
  color: var(--text-muted);
  border-style: dashed;
}

.bg-own.on { border-style: solid; }

.bg-own-tag {
  font-size: 0.5rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.1rem 0.25rem;
  border-radius: 4px;
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  color: var(--text);
}

.bg-file { display: none; }

.bg-note { margin: 0.35rem 0 0; font-size: 0.6rem; color: var(--text-muted); }

.veil {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  justify-content: flex-end;
  background: rgb(0 0 0 / 0.45);
  backdrop-filter: blur(2px);
}

/* Panel ortada bir kutu değil, SAĞDAN açılan bir sütun: ayar
   değiştikçe sayfanın kendisi görünür kalsın — etkisi hemen yanında. */
.panel {
  width: min(100%, 23rem);
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border);
  background-color: var(--bg);
  background-image: linear-gradient(var(--surface), var(--surface));
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 0.8rem 0.9rem 1.1rem;
  border-bottom: 1px solid var(--border);
}

.head-t { font-size: 0.6rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--text-muted); }

.x {
  display: grid;
  place-items: center;
  width: 1.9rem;
  height: 1.9rem;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.x:hover { color: var(--text); background: color-mix(in srgb, var(--text) 10%, transparent); }

.body { flex: 1; overflow-y: auto; padding: 0.5rem 1.1rem 2rem; }

.grp { border-bottom: 1px solid var(--border); }
.grp:last-child { border-bottom: none; }

/* Grup başlığı panelin omurgası: ikon + ad + sağa uzanan çizgi.
   9px'lik soluk satırlar nerede ne olduğunu belirsizleştiriyordu. */
.grp-head {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.75rem 0;
  font: inherit;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: none;
  background: transparent;
  color: var(--text);
  cursor: pointer;
}

.rule { flex: 1; height: 1px; background: var(--border); }
.chev { font-size: 0.8rem; color: var(--text-muted); }

.grp-body { display: flex; flex-direction: column; gap: 0.5rem; padding: 0 0 0.9rem; }

.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.76rem;
  color: var(--text-muted);
}

.row > span:first-of-type { flex: 1; min-width: 0; }
.row :deep(.sel) { flex: 0 0 9.5rem; }
.row input[type='range'] { flex: 0 0 7rem; accent-color: var(--accent-ui); }
.row b { font-size: 0.66rem; font-weight: 500; min-width: 2.4rem; text-align: right; }

/* Segment düğmeleri: iki-üç seçenekli ayarlarda açılır liste fazla —
   seçenekler zaten ekranda sığıyor ve tek dokunuşla değişiyor. */
.seg {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 999px;
}

.seg.wrap { flex-wrap: wrap; border-radius: 10px; }

.seg button {
  padding: 0.16rem 0.45rem;
  font: inherit;
  font-size: 0.6rem;
  letter-spacing: 0.04em;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  white-space: nowrap;
}

.seg button.on { background: var(--text); color: var(--bg); }

.hint { margin: 0; font-size: 0.64rem; color: var(--text-muted); opacity: 0.75; }

.bgs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(4.4rem, 1fr));
  gap: 0.3rem;
  margin-bottom: 0.3rem;
}

.bg-opt {
  height: 2.8rem;
  border: 1px solid var(--border);
  border-radius: 7px;
  background-size: cover;
  background-position: center;
  cursor: pointer;
}

.bg-opt.on { border-color: var(--accent-ui); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-ui) 35%, transparent); }

.links { list-style: none; margin: 0 0 0.3rem; padding: 0; display: flex; flex-direction: column; gap: 0.2rem; }

.links li {
  display: grid;
  grid-template-columns: 1fr auto 1.4rem;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.74rem;
  color: var(--text-muted);
}

.ln { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
.lu { font-size: 0.6rem; opacity: 0.7; max-width: 9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.del {
  display: grid;
  place-items: center;
  width: 1.4rem;
  height: 1.4rem;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.del:hover { color: var(--text); background: color-mix(in srgb, var(--text) 10%, transparent); }

.link-actions { display: flex; flex-wrap: wrap; gap: 0.35rem; }

.link-add {
  display: grid;
  grid-template-columns: 1fr 1.4fr auto;
  gap: 0.3rem;
}

.link-add input {
  min-width: 0;
  padding: 0.3rem 0.45rem;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  color: var(--text);
  font: inherit;
  font-size: 0.72rem;
}

.link-add button,
.reset {
  align-self: flex-start;
  padding: 0.3rem 0.6rem;
  font: inherit;
  font-size: 0.68rem;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.link-add button:hover,
.reset:hover { color: var(--text); border-color: var(--text); }
</style>
