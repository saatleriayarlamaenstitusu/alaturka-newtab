import { ref } from 'vue'
import { createVakitTable, findVakit } from '@alaturkavakitler/core'
import { readVakit, writeVakit } from './storage'

/**
 * Namaz vakti verisi.
 *
 * Kaynak siteyle AYNI: Diyanet verisinin tutulduğu depo. Hesaplar da
 * aynı — `@alaturkavakitler/core`. Eklentide ikinci bir kopya kural
 * yazılmıyor; sapmanın nasıl olduğu sitede ölçüldü (bkz. çekirdek
 * paketin gerekçesi).
 *
 * **Yeni sekme ağ beklemez.** Tablo `chrome.storage`dan okunup hemen
 * gösteriliyor; tazeleme arka planda yapılıyor. Her sekme açılışında
 * ağa çıkmak, sekmenin boş görünmesi demek olurdu.
 */
const BASE = 'https://raw.githubusercontent.com/saatleriayarlamaenstitusu'
  + '/data-diyanet-namaz-vakitleri/main/data/namaz/'

/** Tablonun sonuna bu kadar günden az kaldıysa yenilenir. */
const REFRESH_DAYS = 5

export const raw = ref(null)       // ham JSON (tarih → vakitler)
export const table = ref(null)     // core'un vakit tablosu
export const current = ref(null)   // içinde bulunulan vakit
export const status = ref('')      // kullanıcıya gösterilecek hata

function apply(json) {
  raw.value = json
  table.value = createVakitTable(json)
  current.value = findVakit(table.value)
}

/** Tablo bitmeye yakın mı (ya da hiç yok mu). */
function stale(json) {
  if (!json) return true
  const keys = Object.keys(json)
  if (!keys.length) return true
  const last = new Date(keys[keys.length - 1])
  return (last - new Date()) / 86400000 < REFRESH_DAYS
}

async function fetchCity(plate) {
  const res = await fetch(`${BASE}${plate}.json`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/**
 * Şehrin tablosunu hazırlar: önbellek varsa hemen gösterir, gerekiyorsa
 * arka planda tazeler. Şehir değişmişse önbellek kullanılmaz.
 */
export async function ensureVakit(plate) {
  const cached = await readVakit()
  if (cached?.plate === plate && cached.json) {
    apply(cached.json)
    if (!stale(cached.json)) return
  }
  try {
    const json = await fetchCity(plate)
    apply(json)
    status.value = ''
    await writeVakit({ plate, json, at: Date.now() })
  } catch (e) {
    // Önbellek varsa kullanıcı bunu hiç fark etmemeli.
    if (!table.value) status.value = 'Vakitler alınamadı'
  }
}

/** Saniyelik tik: içinde bulunulan vakit değişmiş olabilir. */
export function refreshCurrent() {
  if (table.value) current.value = findVakit(table.value)
}
