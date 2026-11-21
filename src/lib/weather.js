import { ref } from 'vue'
import { CITIES } from '@alaturkavakitler/core'
import { readKey, writeKey } from './storage'

/**
 * Hava durumu.
 *
 * Kaynak **Open-Meteo**: anahtar istemiyor, ticari olmayan kullanımda
 * ücretsiz ve CORS açık. Anahtar isteyen bir servis seçmek, anahtarı
 * eklenti paketinin içine koymak demekti — paket herkese açık, anahtar
 * da öyle olurdu.
 *
 * **Yeni sekme ağ beklemez** (vakit tablosundaki kuralın aynısı):
 * önbellekteki değer hemen gösterilir, tazeleme arka planda yapılır.
 * Tazelik eşiği 30 dakika; hava o süreden hızlı değişmiyor ve her
 * sekmede istek atmak hem gereksiz hem görgüsüz.
 *
 * Konum şehir kütüğünden (`CITIES`, plakayla anahtarlı) geliyor;
 * cihazın konumu İSTENMİYOR — namaz vakitleri de şehir merkezine göre,
 * ikisi aynı yeri göstermeli.
 */
const KEY = 'alaturka-newtab-hava'
const FRESH_MS = 30 * 60 * 1000

export const weather = ref(null)   // { temp, feels, code, min, max, days[] }
export const loading = ref(false)

/**
 * WMO hava kodları → Türkçe ad ve işaret.
 *
 * Tam liste 28 kod; yakın olanlar birleştirildi (örn. hafif/orta/yoğun
 * yağmur tek satır): widget'ta okunacak olan "yağmurlu mu" sorusunun
 * cevabı, şiddetin derecesi değil.
 */
const CODES = [
  [[0], 'Açık', '☀'],
  [[1, 2], 'Parçalı bulutlu', '⛅'],
  [[3], 'Kapalı', '☁'],
  [[45, 48], 'Sisli', '≋'],
  [[51, 53, 55, 56, 57], 'Çiseliyor', '☂'],
  [[61, 63, 65, 66, 67, 80, 81, 82], 'Yağmurlu', '☔'],
  [[71, 73, 75, 77, 85, 86], 'Karlı', '❄'],
  [[95, 96, 99], 'Gök gürültülü', '⚡'],
]

export function describe(code) {
  for (const [list, label, sign] of CODES) if (list.includes(code)) return { label, sign }
  return { label: '—', sign: '•' }
}

const DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
const dayName = (iso) => DAYS[new Date(`${iso}T12:00:00`).getDay()]

function shape(json) {
  const c = json?.current ?? {}
  const d = json?.daily ?? {}
  return {
    temp: Math.round(c.temperature_2m ?? 0),
    feels: Math.round(c.apparent_temperature ?? c.temperature_2m ?? 0),
    code: c.weather_code ?? 0,
    min: Math.round(d.temperature_2m_min?.[0] ?? 0),
    max: Math.round(d.temperature_2m_max?.[0] ?? 0),
    // Bugün hariç üç gün: bugünün değeri zaten büyük yazıyla duruyor.
    days: (d.time ?? []).slice(1, 4).map((iso, i) => ({
      iso,
      name: dayName(iso),
      code: d.weather_code?.[i + 1] ?? 0,
      min: Math.round(d.temperature_2m_min?.[i + 1] ?? 0),
      max: Math.round(d.temperature_2m_max?.[i + 1] ?? 0),
    })),
  }
}

/**
 * Önbellekten oku, gerekiyorsa tazele.
 *
 * Şehir değiştiyse önbellek başka bir yerin havası demektir ve
 * yaşından bağımsız atılır.
 */
export async function ensureWeather(plate) {
  const city = CITIES[String(plate)]
  if (!city) return
  const cached = await readKey(KEY)
  const fits = cached?.plate === String(plate)
  if (fits) weather.value = cached.data
  if (fits && Date.now() - (cached.at ?? 0) < FRESH_MS) return

  loading.value = true
  try {
    const url = 'https://api.open-meteo.com/v1/forecast'
      + `?latitude=${city.lat}&longitude=${city.lon}`
      + '&current=temperature_2m,apparent_temperature,weather_code'
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min'
      + '&forecast_days=4&timezone=auto'
    const res = await fetch(url)
    if (!res.ok) throw new Error(String(res.status))
    const data = shape(await res.json())
    weather.value = data
    await writeKey(KEY, { plate: String(plate), at: Date.now(), data })
  } catch {
    // Ağ yoksa önbellekteki değer ekranda kalır; eskimiş bir sıcaklık
    // boş bir kutudan iyidir.
  } finally {
    loading.value = false
  }
}
