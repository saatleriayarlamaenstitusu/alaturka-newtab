import { reactive, watch } from 'vue'
import { readAll, writeAll } from './storage'

/**
 * Eklenti ayarları.
 *
 * Tek bir reaktif obje; her değişiklikte tamamı yazılıyor. Ayar sayısı
 * onlarla ölçülüyor, parça parça yazmanın getireceği karmaşıklığa
 * değmez.
 *
 * Depo eşzamansız olduğu için uygulama ÖNCE varsayılanlarla açılıp
 * sonra kayıtlı değerlerle güncelleniyor; `ready` bu anı bildirir.
 */

/** Dinî bağlantılar — kendi widget'ı. */
export const DINI_LINKS = [
  { id: 'av', name: 'Alaturka Vakitler', url: 'https://alaturkavakitler.com' },
  { id: 'kuran', name: "Kur'an-ı Kerim", url: 'https://kuran.diyanet.gov.tr' },
  { id: 'hadis', name: 'Hadislerle İslam', url: 'https://hadislerleislam.diyanet.gov.tr' },
  { id: 'ansiklopedi', name: 'İslam Ansiklopedisi', url: 'https://islamansiklopedisi.org.tr' },
  { id: 'diyanet', name: 'Diyanet', url: 'https://diyanet.gov.tr' },
]

/** Yapay zekâ kısayolları. */
export const AI_LINKS = [
  { id: 'claude', name: 'Claude', url: 'https://claude.ai' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai' },
  { id: 'grok', name: 'Grok', url: 'https://grok.com' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com' },
]

/** Sosyal medya — ayrı widget, çünkü ayrı bir kullanım anı. */
export const SOCIAL_LINKS = [
  { id: 'x', name: 'X', url: 'https://x.com' },
  { id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com' },
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com' },
  { id: 'whatsapp', name: 'WhatsApp', url: 'https://web.whatsapp.com' },
  { id: 'telegram', name: 'Telegram', url: 'https://web.telegram.org' },
  { id: 'linkedin', name: 'LinkedIn', url: 'https://www.linkedin.com/feed/' },
]

export const ENGINES = [
  { id: 'google', label: 'Google', url: 'https://www.google.com/search?q=' },
  { id: 'yandex', label: 'Yandex', url: 'https://yandex.com.tr/search/?text=' },
  { id: 'duckduckgo', label: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  { id: 'bing', label: 'Bing', url: 'https://www.bing.com/search?q=' },
  { id: 'brave', label: 'Brave', url: 'https://search.brave.com/search?q=' },
]

export const CLOCK_STYLES = [
  { id: 'sade', label: 'Sade' },
  { id: 'mono', label: 'Daktilo' },
  { id: 'nokta', label: 'Nokta matris' },
]

export const CLOCK_SOURCES = [
  { id: 'alaturka', label: 'Alaturka' },
  { id: 'vasati', label: 'Vasati' },
]

/** Saat ağırlıkları — Inter Tight değişken, 200–700 arası. */
export const CLOCK_WEIGHTS = [
  { id: 200, label: 'İnce' },
  { id: 300, label: 'Hafif' },
  { id: 400, label: 'Normal' },
  { id: 600, label: 'Kalın' },
]

/** Aylık takvim görünümü. */
export const CALENDAR_VIEWS = [
  { id: 'miladi', label: 'Miladi' },
  { id: 'hicri', label: 'Hicri' },
  { id: 'birlesik', label: 'Birleşik' },
]

/**
 * Vakit hatırlatması seçenekleri (dakika).
 *
 * Sitedeki kalıbın aynısı: her vakit AYRI ayarlanır. "Hepsi için tek
 * süre" yetmiyor — yatsıya bir saat kala haber almak isteyen, imsağa
 * aynı süreyle uyandırılmak istemiyor.
 */
export const NOTIFY_OPTIONS = [
  { value: -1, label: 'Kapalı' },
  { value: 0, label: 'Tam vaktinde' },
  { value: 5, label: '5 dk önce' },
  { value: 10, label: '10 dk önce' },
  { value: 15, label: '15 dk önce' },
  { value: 20, label: '20 dk önce' },
  { value: 30, label: '30 dk önce' },
  { value: 45, label: '45 dk önce' },
  { value: 60, label: '1 saat önce' },
]

export const VAKIT_LABELS = {
  imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle',
  ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı',
}

export const SURFACES = [
  { id: 'buzlu', label: 'Buzlu cam' },
  { id: 'mat', label: 'Mat' },
  { id: 'cizgi', label: 'Yalnız çerçeve' },
  { id: 'yok', label: 'Zeminsiz' },
]

/** Widget'ın durabileceği yerler. */
export const SLOTS = [
  { id: 'sol', label: 'Solda' },
  { id: 'sag', label: 'Sağda' },
  { id: 'alt', label: 'Aramanın altında' },
  { id: 'kapali', label: 'Kapalı' },
]

/**
 * İlk açılışta gelen düzen. Kullanıcının tarayıcıda kurduğu düzen
 * birebir alındı: soldaki analog saat/takvim/vakit/hava, sağdaki
 * sistem/sosyal/yapay zekâ/ayet, aramanın altında not. Böylece eklenti
 * ilk kurulduğunda boş bir sayfa değil, kullanılan bir sayfa açılır.
 */
const DEFAULTS = {
  city: { plate: '81', name: 'DÜZCE' },
  engine: 'google',
  /** Widget yerleşimi: kolon → sıralı kimlik listesi. */
  layout: {
    sol: ['analog', 'takvim', 'vakit', 'hava'],
    sag: ['sistem', 'sosyal', 'yapayzeka', 'ayet'],
    alt: ['not'],
  },
  clock: { style: 'nokta', main: 'vasati', side: 'alaturka', weight: 200 },
  /**
   * Aylık takvim: hangi görünüm ve birleşik görünümde hangi takvim
   * BÜYÜK yazılacak.
   */
  calendar: { view: 'birlesik', main: 'miladi' },
  /** Widget zemini. */
  surface: 'cizgi',
  palette: 'klasik',
  theme: 'auto',            // 'auto' | 'dark' | 'light'
  themePerVakit: true,
  hijriOffset: true,        // hicri gün akşam ezanıyla başlar
  /** Kişisel kısayollar: kendi eklediklerin (sabitlenenler dahil). */
  shortcuts: [{ id: 'av', name: 'Alaturka Vakitler', url: 'https://alaturkavakitler.com' }],
  /** 'oto' = sık ziyaret edilenler de listelensin. */
  shortcutMode: 'oto',
  dini: DINI_LINKS,
  yapayzeka: AI_LINKS,
  sosyal: SOCIAL_LINKS,
  note: '',
  /**
   * Vakit hatırlatması: vakit başına dakika. -1 kapalı, 0 tam
   * vaktinde. Sitedeki `notifyOffsets` ile aynı kalıp.
   */
  notify: { imsak: -1, gunes: -1, ogle: -1, ikindi: -1, aksam: -1, yatsi: -1 },
  /**
   * Arka plan. `mode`: foto (görselin kendisi) | mesh (görselin
   * renklerinden üretilen gradyan) | yok (sayfanın kendi gradyanı).
   */
  bg: { image: '29524511', mode: 'foto', dim: 45, blur: 8, grid: false, grain: true },
}

export const settings = reactive(structuredClone(DEFAULTS))
export const state = reactive({ ready: false })

export async function loadSettings() {
  const saved = await readAll()
  // Kayıtlı değerler varsayılanların ÜSTÜNE oturur: sonradan eklenen
  // bir ayar eski kayıtta yok diye tanımsız kalmasın.
  Object.assign(settings, { ...DEFAULTS, ...saved })
  settings.bg = { ...DEFAULTS.bg, ...(saved.bg ?? {}) }
  settings.clock = { ...DEFAULTS.clock, ...(saved.clock ?? {}) }
  // Eski kayıt `{ on, offset }` taşıyordu; vakit başına ayara çevir.
  const n = saved.notify ?? {}
  settings.notify = 'on' in n
    ? Object.fromEntries(Object.keys(DEFAULTS.notify).map((k) => [k, n.on ? (n.offset ?? 0) : -1]))
    : { ...DEFAULTS.notify, ...n }
  if (typeof saved.calendar === 'string') settings.calendar = { view: saved.calendar, main: 'miladi' }
  else settings.calendar = { ...DEFAULTS.calendar, ...(saved.calendar ?? {}) }
  settings.layout = { ...DEFAULTS.layout, ...(saved.layout ?? {}) }
  if (!Array.isArray(settings.shortcuts)) settings.shortcuts = []
  for (const [key, def] of [['dini', DINI_LINKS], ['yapayzeka', AI_LINKS], ['sosyal', SOCIAL_LINKS]])
    if (!Array.isArray(settings[key])) settings[key] = structuredClone(def)
  state.ready = true
  watch(settings, () => writeAll(JSON.parse(JSON.stringify(settings))), { deep: true })
}

export const engineUrl = (id) =>
  (ENGINES.find((e) => e.id === id) ?? ENGINES[0]).url

/** Bir widget hangi kolonda: 'sol' | 'sag' | 'alt' | 'kapali'. */
export function slotOf(id) {
  for (const slot of ['sol', 'sag', 'alt'])
    if (settings.layout[slot]?.includes(id)) return slot
  return 'kapali'
}

/**
 * Widget'ı bir kolona TAŞI ve sırasını da belirle.
 *
 * `index` verilmezse kolonun sonuna eklenir. Sıralama ayarın kendisi:
 * ekranda hangi widget'ın üstte olacağını kullanıcı belirliyor.
 */
export function moveWidget(id, slot, index = -1) {
  const next = {}
  for (const s of ['sol', 'sag', 'alt'])
    next[s] = (settings.layout[s] ?? []).filter((w) => w !== id)
  if (slot !== 'kapali') {
    const list = next[slot] ?? []
    const at = index < 0 || index > list.length ? list.length : index
    list.splice(at, 0, id)
    next[slot] = list
  }
  settings.layout = next
}

/** Widget'ı başka bir kolona taşı (ya da kapat). */
export function setSlot(id, slot) {
  const next = {}
  for (const s of ['sol', 'sag', 'alt'])
    next[s] = (settings.layout[s] ?? []).filter((w) => w !== id)
  if (slot !== 'kapali') next[slot] = [...next[slot], id]
  settings.layout = next
}
