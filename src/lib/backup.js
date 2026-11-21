import { settings } from './settings'

/**
 * Ayar yedeği.
 *
 * Eklentinin bütün hafızası tarayıcıdadır ve geri getirecek bir sunucu
 * yoktur: tarayıcı verisini temizlemek şehri, widget yerleşimini, arka
 * planı, kısayolları ve notu siler. Bu yüzden dışa aktarma bir özellik
 * değil, zorunluluk (sitede de aynı gerekçeyle var).
 *
 * Dosya TARAYICIDA üretilir, hiçbir yere gönderilmez.
 *
 * Vakit tablosu ve hava durumu önbelleği YEDEĞE GİRMEZ: ikisi de
 * yeniden üretilebilir ve dosyayı şişirmekten başka işe yaramazlar.
 */
const VERSION = 1
const NAME = 'alaturka-yenisekme-yedek'

export function exportBackup() {
  const payload = {
    app: NAME,
    version: VERSION,
    at: new Date().toISOString(),
    settings: JSON.parse(JSON.stringify(settings)),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const d = new Date()
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  a.href = url
  a.download = `${NAME}-${iso}.json`
  a.click()
  // Bırakılmazsa veri bellekte asılı kalıyor.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Dosyayı OKUR ve doğrular — yazmaz.
 *
 * İçe aktarma iki adımlı: önce "kaç ayar, hangi tarihli" diye söylenir,
 * sonra onaylanır. Tek dokunuşla üzerine yazmak, yanlış dosyada geri
 * dönüşü olmayan bir iş olurdu.
 *
 * @returns {Promise<{version:number, at:string, settings:object}>}
 */
export async function importBackup(file) {
  let data
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('Dosya okunamadı — geçerli bir JSON değil.')
  }
  if (!data || typeof data !== 'object' || !data.settings || typeof data.settings !== 'object')
    throw new Error('Bu dosya bir Alaturka yeni sekme yedeği değil.')
  if (data.app && data.app !== NAME)
    throw new Error('Bu yedek başka bir uygulamaya ait.')
  // Yedek elle düzenlenebilir bir metindir: yalnızca TANINAN anahtarlar
  // yazılır, gerisi yok sayılır.
  const known = Object.keys(settings)
  const clean = {}
  for (const k of known) if (k in data.settings) clean[k] = data.settings[k]
  if (!Object.keys(clean).length) throw new Error('Yedekte tanınan bir ayar yok.')
  return { version: data.version ?? 0, at: data.at ?? '', settings: clean }
}
