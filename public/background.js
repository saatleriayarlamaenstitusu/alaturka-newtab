/**
 * Arka plan servis çalışanı — vakit hatırlatması.
 *
 * Yeni sekme sayfası yalnızca AÇIKKEN çalışıyor; hatırlatmanın
 * tarayıcı başka bir sayfadayken de gelmesi gerekiyor. Bu yüzden
 * zamanlama burada: `chrome.alarms` tarayıcı kapalıyken bile
 * uyandırıyor.
 *
 * Tek bir alarm kuruluyor ve her çalışmada BİR SONRAKİ hatırlatmaya
 * göre yeniden kuruluyor. Altı vakit için altı alarm kurmak, ayar
 * değişince hepsini tek tek temizlemek demekti.
 *
 * Süre VAKİT BAŞINA ayarlanıyor (`notify[vakit]`): -1 kapalı, 0 tam
 * vaktinde, pozitif değer dakika cinsinden önce. Tek bir ortak süre
 * yetmiyordu — yatsıya bir saat kala haber almak isteyen, imsağa aynı
 * süreyle uyandırılmak istemiyor.
 *
 * Veri sayfanın önbelleğinden okunuyor (`chrome.storage.local`):
 * servis çalışanı ağa çıkmıyor, sekme neyi gösteriyorsa onu bildiriyor.
 */
const ALARM = 'vakit'
/** Sayfanın kullandığı anahtarlar (bkz. src/lib/storage.js). */
const SETTINGS_KEY = 'alaturka-newtab'
const VAKIT_KEY = 'alaturka-newtab-vakit'
const LABELS = {
  imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle',
  ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı',
}

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Ayarlar ve vakit tablosu, sayfanın yazdığı yerden okunur. */
async function config() {
  const all = await chrome.storage.local.get([SETTINGS_KEY, VAKIT_KEY])
  const notify = all[SETTINGS_KEY]?.notify ?? {}
  const table = all[VAKIT_KEY]?.json ?? null
  return { notify, table }
}

/** Bugünün ve yarının AÇIK hatırlatmaları, zamanına göre sıralı. */
function moments(table, notify) {
  if (!table) return []
  const out = []
  const now = new Date()
  for (const add of [0, 1]) {
    const day = new Date(now)
    day.setDate(day.getDate() + add)
    const row = table[iso(day)]
    if (!row) continue
    for (const [key, val] of Object.entries(row)) {
      if (!LABELS[key] || typeof val !== 'string') continue
      const mins = notify[key]
      if (typeof mins !== 'number' || mins < 0) continue
      const [h, m] = val.split(':').map(Number)
      const at = new Date(day)
      at.setHours(h, m, 0, 0)
      const when = at.getTime() - mins * 60000
      if (when > Date.now() + 1000) out.push({ key, when, at, mins })
    }
  }
  return out.sort((a, b) => a.when - b.when)
}

async function schedule() {
  const { notify, table } = await config()
  await chrome.alarms.clear(ALARM)
  const next = moments(table, notify)[0]
  if (!next) return
  chrome.alarms.create(ALARM, { when: next.when })
}

async function fire() {
  const { notify, table } = await config()
  // Hangi vakit için uyandığımızı yeniden hesaplıyoruz: alarm
  // gecikmiş olabilir ve en yakın hatırlatma doğru olandır.
  const soon = moments(table, notify)[0]
  const label = LABELS[soon?.key] ?? ''
  const mins = soon?.mins ?? 0
  if (label) {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/128.png',
      title: mins ? `${label} vaktine ${mins} dakika` : `${label} vakti`,
      message: soon.at.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      silent: false,
    })
  }
  schedule()
}

chrome.runtime.onInstalled.addListener(schedule)
chrome.runtime.onStartup.addListener(schedule)
chrome.alarms.onAlarm.addListener((a) => { if (a.name === ALARM) fire() })

// Sayfa ayarı ya da vakit tablosunu değiştirince zamanlama yenilenir.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return
  if (SETTINGS_KEY in changes || VAKIT_KEY in changes) schedule()
})
