/**
 * Günün ayeti kütüğünü üretir: `src/data/ayahs.js`.
 *
 * Ayetler ELLE seçildi. "Rastgele ayet" göstermek, bağlamından kopmuş
 * ya da günlük bir hatırlatmaya uymayan bir metni ekrana basmak
 * demekti; buradaki liste yaygın olarak okunan, tek başına da anlamını
 * taşıyan ayetlerden oluşuyor.
 *
 * Metin ve meal quran.com'dan alınıyor (Arapça `text_uthmani`, meal
 * 77 = Diyanet İşleri) ve dosyaya YAZILIYOR: eklenti açılışta ağa
 * çıkmasın, çevrimdışı da çalışsın.
 *
 *   node scripts/export-ayahs.js
 */
import { writeFile } from 'node:fs/promises'

const KEYS = [
  '2:152', '2:153', '2:186', '2:255', '2:286',
  '3:139', '3:159', '3:173', '3:190',
  '4:58', '4:86',
  '13:11', '13:28',
  '14:7',
  '16:90', '16:97', '16:128',
  '17:23', '17:80',
  '18:23',
  '20:114',
  '21:87',
  '23:1',
  '25:74',
  '29:69',
  '30:21',
  '31:17',
  '39:53',
  '40:60',
  '41:33',
  '42:43',
  '49:10', '49:13',
  '51:56',
  '55:60',
  '57:4',
  '59:18',
  '65:3',
  '67:2',
  '94:5',
  '103:1', '103:2', '103:3',
]

/** 52 = Elmalılı Hamdi Yazır, 19 = Pickthall (İngilizce). */
const TR = 52
const EN = 19
const api = 'https://api.quran.com/api/v4'

const chapters = await fetch(`${api}/chapters?language=tr`).then((r) => r.json())
const nameOf = Object.fromEntries(
  chapters.chapters.map((c) => [c.id, c.translated_name?.name ?? c.name_simple]))

const out = []
for (const key of KEYS) {
  const res = await fetch(
    `${api}/verses/by_key/${key}?fields=text_uthmani&translations=${TR},${EN}`).then((r) => r.json())
  const v = res.verse
  // Meal metninde dipnot bağlantıları `<sup>` olarak geliyor; düz
  // metne indirgeniyor, çünkü widget'ta etiket basılmıyor.
  const clean = (t) => (t ?? '').replace(/<[^>]+>/g, '').trim()
  const byId = Object.fromEntries(
    (v.translations ?? []).map((t) => [t.resource_id, clean(t.text)]))
  const tr = byId[TR] ?? ''
  const en = byId[EN] ?? ''
  const [s, n] = key.split(':')
  out.push({ key, surah: Number(s), verse: Number(n), name: nameOf[Number(s)], ar: v.text_uthmani, tr, en })
  process.stdout.write('.')
}

const body = `/**
 * Günün ayeti — elle seçilmiş ${out.length} ayet.
 *
 * Üretim: \`node scripts/export-ayahs.js\` (quran.com; meal Elmalılı
 * Hamdi Yazır, İngilizcesi Pickthall). Dosyaya yazılıyor ki eklenti
 * açılışta ağa çıkmasın.
 *
 * Gösterilen ayet GÜNE göre seçilir, rastgele değil: aynı gün açılan
 * her sekmede aynı ayet durur, ertesi gün değişir.
 */
export const AYAHS = ${JSON.stringify(out, null, 2)}

/** Günün ayeti: tarihten türeyen sabit bir sıra. */
export function ayahOfDay(date = new Date()) {
  const day = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000)
  return AYAHS[day % AYAHS.length]
}
`
await writeFile(new URL('../src/data/ayahs.js', import.meta.url), body)
console.log(`\n${out.length} ayet yazıldı`)
