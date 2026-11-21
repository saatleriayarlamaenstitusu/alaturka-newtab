import { ref } from 'vue'
import { settings } from './settings'

/**
 * Kişisel kısayollar.
 *
 * İki kaynak var ve ikisi tek listede birleşiyor:
 *  - **Sık ziyaret edilenler** tarayıcıdan gelir (`chrome.topSites`):
 *    hiçbir şey eklemeden de dolu bir sayfa.
 *  - **Kendi eklediklerin** kalıcıdır ve her zaman BAŞTA durur.
 *
 * Sabitlemek (pin), tarayıcıdan gelen bir siteyi kendi listene
 * taşımaktır: sık ziyaret listesi her gün değişiyor, sabitlenen
 * değişmiyor. Sabitlenen bir siteyi sık ziyaret listesinde İKİNCİ KEZ
 * göstermemek için adrese göre eleniyor.
 */
export const top = ref([])

const api = typeof chrome !== 'undefined' ? chrome : null

/** Adresleri karşılaştırmak için: şema, `www.` ve sondaki `/` düşer. */
export const keyOf = (url) => {
  try {
    const u = new URL(url)
    return (u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, '')).toLowerCase()
  } catch { return String(url).toLowerCase() }
}

export async function loadTopSites() {
  if (!api?.topSites) return
  try {
    const list = await api.topSites.get()
    top.value = list.map((s) => ({ id: `t${keyOf(s.url)}`, name: s.title || keyOf(s.url), url: s.url, auto: true }))
  } catch { /* izin yoksa liste boş kalır, sayfa çalışmaya devam eder */ }
}

export function pin(site) {
  const k = keyOf(site.url)
  if (settings.shortcuts.some((s) => keyOf(s.url) === k)) return
  settings.shortcuts = [...settings.shortcuts, { id: `u${Date.now()}`, name: site.name, url: site.url }]
}

export function unpin(id) {
  settings.shortcuts = settings.shortcuts.filter((s) => s.id !== id)
}

export function move(from, to) {
  if (from === to || from < 0 || to < 0) return
  const list = [...settings.shortcuts]
  const [m] = list.splice(from, 1)
  list.splice(to, 0, m)
  settings.shortcuts = list
}

export function add(name, url) {
  let u = url.trim()
  if (!u) return false
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`
  const n = name.trim() || keyOf(u).split('/')[0]
  settings.shortcuts = [...settings.shortcuts, { id: `u${Date.now()}`, name: n, url: u }]
  return true
}
