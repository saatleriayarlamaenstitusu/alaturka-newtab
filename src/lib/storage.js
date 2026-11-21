/**
 * Kalıcı depo.
 *
 * Eklenti içinde `chrome.storage.local` kullanılır: `localStorage`
 * eklenti sayfalarında çalışır ama profille senkronlanmaz ve bazı
 * temizleme işlemlerinde silinir. Geliştirirken (`npm run dev`, normal
 * bir sekme) `chrome` nesnesi yoktur; o zaman `localStorage`a düşülür,
 * böylece eklentiyi her seferinde yeniden yüklemeden çalışılabiliyor.
 *
 * Arayüz eşzamansızdır — `chrome.storage` eşzamanlı okuma sunmuyor.
 */
const area = globalThis.chrome?.storage?.local ?? null

const KEY = 'alaturka-newtab'

export async function readAll() {
  if (area) {
    const got = await area.get(KEY)
    return got?.[KEY] ?? {}
  }
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export async function writeAll(obj) {
  if (area) return area.set({ [KEY]: obj })
  try { localStorage.setItem(KEY, JSON.stringify(obj)) } catch { /* kota */ }
}

/**
 * Genel amaçlı okuma/yazma — ayarların DIŞINDA kalan, kendi ömrü olan
 * veriler için (vakit tablosu, hava durumu). Ayarlarla aynı anahtarda
 * dursalardı her ayar değişiminde onlar da yeniden yazılırdı.
 */
export async function readKey(key) {
  if (area) {
    const got = await area.get(key)
    return got?.[key] ?? null
  }
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}

export async function writeKey(key, obj) {
  if (area) return area.set({ [key]: obj })
  try { localStorage.setItem(key, JSON.stringify(obj)) } catch { /* kota */ }
}

/** Vakit tabloları ayrı anahtarda: ayarlardan çok daha büyükler. */
const VAKIT_KEY = 'alaturka-newtab-vakit'

export async function readVakit() {
  if (area) {
    const got = await area.get(VAKIT_KEY)
    return got?.[VAKIT_KEY] ?? null
  }
  try { return JSON.parse(localStorage.getItem(VAKIT_KEY) || 'null') } catch { return null }
}

export async function writeVakit(obj) {
  if (area) return area.set({ [VAKIT_KEY]: obj })
  try { localStorage.setItem(VAKIT_KEY, JSON.stringify(obj)) } catch { /* kota */ }
}
