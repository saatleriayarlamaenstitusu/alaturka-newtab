/**
 * Millî bayramlar ve resmî tatiller — MİLADİ, sabit günler.
 *
 * Dinî günler (kandiller, Ramazan/Kurban bayramı, arefe, aşure) BURADA
 * DEĞİL: onlar hicri takvime bağlı ve `@alaturkavakitler/core`un
 * `holyDaysOn` / `holyDaysBetween` fonksiyonlarından geliyor. İki liste
 * takvimde birleşiyor, kural iki yerde yaşamıyor.
 *
 * Neden çekirdekte değil: çekirdek vakit ve hicri takvim kuralını
 * tutuyor; bu liste ikisi de değil, yılda yedi sabit miladi gün.
 * Çekirdeğe taşımak sürüm + üç depoda kurulum demek, ayrı bir iş.
 * Site de bu listeyi isterse o zaman çekirdeğe taşınmalı — o güne
 * kadar tek kopya burada.
 *
 * 28 Ekim öğleden sonra tatildir ama tam gün değil; ayrı gün olarak
 * işaretlenmiyor, 29 Ekim'in notunda duruyor.
 */
export const NATIONAL_DAYS = [
  { month: 1, day: 1, name: 'Yılbaşı', kind: 'tatil' },
  { month: 4, day: 23, name: 'Ulusal Egemenlik ve Çocuk Bayramı', kind: 'bayram' },
  { month: 5, day: 1, name: 'Emek ve Dayanışma Günü', kind: 'tatil' },
  { month: 5, day: 19, name: 'Atatürk’ü Anma, Gençlik ve Spor Bayramı', kind: 'bayram' },
  { month: 7, day: 15, name: 'Demokrasi ve Millî Birlik Günü', kind: 'tatil' },
  { month: 8, day: 30, name: 'Zafer Bayramı', kind: 'bayram' },
  { month: 10, day: 29, name: 'Cumhuriyet Bayramı', kind: 'bayram', note: '28 Ekim öğleden sonra resmî tatildir.' },
]

/** Bir güne düşen millî günler — çekirdeğin `holyDaysOn`ıyla aynı biçim. */
export function nationalDaysOn(date) {
  if (!date) return []
  const m = date.getMonth() + 1
  const d = date.getDate()
  return NATIONAL_DAYS
    .filter((x) => x.month === m && x.day === d)
    .map((x) => ({ id: `milli-${x.month}-${x.day}`, name: x.name, kind: x.kind, note: x.note, milli: true }))
}
