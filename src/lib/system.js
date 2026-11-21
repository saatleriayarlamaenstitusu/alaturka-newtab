import { ref } from 'vue'

/**
 * Sistem göstergeleri: pil, işlemci, bellek.
 *
 * Üçü de tarayıcının kendi uçlarından geliyor, hiçbir şey ağa
 * çıkmıyor:
 *  - **Pil** `navigator.getBattery()` (izin istemez; masaüstünde pil
 *    yoksa hiç gelmez, blok da gösterilmez).
 *  - **İşlemci** `chrome.system.cpu` — ama o uç ANLIK yüzde VERMEZ,
 *    açılıştan beri biriken kene (tick) sayılarını verir. Yüzde iki
 *    ölçüm arasındaki FARKTAN çıkar: (kernel+user farkı) / toplam fark.
 *    Tek ölçümle "yüzde" hesaplamak, makinenin açıldığından beri
 *    ortalamasını göstermek olurdu.
 *  - **Bellek** `chrome.system.memory` — kapasite ve boşta kalan.
 *
 * Yenileme aralığı 3 saniye: yeni sekme bir izleme panosu değil,
 * saniyede bir ölçmek boşuna iş.
 */
export const battery = ref(null)   // { level, charging, minsLeft }
export const cpu = ref(null)       // 0–100
export const ram = ref(null)       // { pct, usedGb, totalGb }

const api = typeof chrome !== 'undefined' ? chrome : null
let last = null
let timer = null

async function readCpu() {
  if (!api?.system?.cpu) return
  const info = await api.system.cpu.getInfo()
  const sum = info.processors.reduce((a, p) => {
    const u = p.usage
    a.busy += u.kernel + u.user
    a.total += u.total
    return a
  }, { busy: 0, total: 0 })
  if (last) {
    const dt = sum.total - last.total
    if (dt > 0) cpu.value = Math.round(((sum.busy - last.busy) / dt) * 100)
  }
  last = sum
}

async function readRam() {
  if (!api?.system?.memory) return
  const m = await api.system.memory.getInfo()
  const used = m.capacity - m.availableCapacity
  ram.value = {
    pct: Math.round((used / m.capacity) * 100),
    usedGb: used / 1024 ** 3,
    totalGb: m.capacity / 1024 ** 3,
  }
}

async function readBattery() {
  if (!navigator.getBattery) return
  const b = await navigator.getBattery()
  const apply = () => {
    const secs = b.charging ? b.chargingTime : b.dischargingTime
    battery.value = {
      level: Math.round(b.level * 100),
      charging: b.charging,
      // `Infinity` "bilinmiyor" demek; sayıymış gibi basılmamalı.
      minsLeft: Number.isFinite(secs) && secs > 0 ? Math.round(secs / 60) : null,
    }
  }
  apply()
  for (const ev of ['levelchange', 'chargingchange', 'chargingtimechange', 'dischargingtimechange'])
    b.addEventListener(ev, apply)
}

/** Sistem bilgisi okunabiliyor mu — blok buna göre gösterilir. */
export const hasSystem = Boolean(api?.system?.cpu || api?.system?.memory) || Boolean(navigator.getBattery)

export function startSystem(everyMs = 3000) {
  if (timer) return
  readBattery()
  readCpu()
  readRam()
  timer = setInterval(() => { readCpu(); readRam() }, everyMs)
}

export function stopSystem() {
  clearInterval(timer)
  timer = null
}
