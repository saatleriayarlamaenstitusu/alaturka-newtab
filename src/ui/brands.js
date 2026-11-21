/**
 * Minimal marka ikonları — path ve host eşlemesi.
 *
 * Her marka: `{ paths, fill? }`. `paths` string veya `{ d, fill }` —
 * YouTube üçgeni gibi parçalı dolgular için. Claude’da ortada daire
 * yok (güneş gibi okunmasın); Anthropic yıldızı.
 */

/** id → { paths, fill? } — 24'lük ızgara. */
export const BRANDS = {
  x: {
    fill: true,
    paths: ['M3.5 3.5 10.8 13.2 3.5 20.5h2.7l5.8-6.6 4.7 6.6H20.5l-7.6-10.7L19.8 3.5h-2.7l-5.3 6L7.3 3.5z'],
  },
  instagram: {
    paths: [
      'M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Z',
      'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
      'M17.5 7.5h.01',
    ],
  },
  youtube: {
    paths: [
      'M3.5 8.5A3.5 3.5 0 0 1 7 5h10a3.5 3.5 0 0 1 3.5 3.5v7A3.5 3.5 0 0 1 17 19H7a3.5 3.5 0 0 1-3.5-3.5z',
      { d: 'M10 9.2v5.6l5.2-2.8z', fill: true },
    ],
  },
  whatsapp: {
    paths: [
      'M12 21a9 9 0 1 0-7.9-4.6L3 21l4.7-1.2A9 9 0 0 0 12 21Z',
      'M8.2 9.8c.2-.5.5-.5.8-.5h.6c.2 0 .4 0 .5.4l.6 1.6c.1.2 0 .4-.2.5l-.3.4c-.1.2-.1.3.1.5.5.7 1.2 1.3 1.9 1.7.2.1.4.1.5-.1l.4-.4c.2-.1.4-.2.6 0l1.6.7c.3.1.4.3.4.5v.6c0 .3-.1.6-.7.9-.6.3-1.4.4-2.2.1A8.2 8.2 0 0 1 8 12.1c-.2-.8 0-1.5.2-2.3z',
    ],
  },
  telegram: {
    fill: true,
    paths: ['M21 4 2.5 11.2c-.7.3-.7 1.3 0 1.5l4.8 1.5 1.9 5.8c.2.7 1.1.9 1.6.3l2.7-3.1 4.9 3.6c.6.4 1.5.1 1.7-.6L21 4z'],
  },
  linkedin: {
    paths: [
      'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z',
      'M8 11v6M8 8v.01M12 17v-3.2A1.8 1.8 0 0 1 15.6 14V17M15.6 17v-4A3.2 3.2 0 0 0 10 14',
    ],
  },

  // Claude — Anthropic yıldızı; ortada daire yok
  claude: {
    paths: [
      'M12 3v4.2M12 16.8V21M5.1 5.1l3 3M15.9 15.9l3 3M3 12h4.2M16.8 12H21M5.1 18.9l3-3M15.9 8.1l3-3',
    ],
  },
  // ChatGPT — OpenAI düğümünün sadeleştirilmiş hâli: altıgen çerçeve +
  // üç kollu iç bağ. Sohbet balonu denendi ve bırakıldı; balon her
  // sohbet uygulamasının işareti, hiçbirinin kendi işareti değil.
  // Düğümün kendi örgüsü 20px'te lapaya dönüşüyor, dönme simetrisi
  // kalıyor — tanınan şey zaten o.
  chatgpt: {
    paths: [
      'M12 2.9 19.1 7v8.2L12 19.3 4.9 15.2V7z',
      'M12 7.3v4.8M12 12.1l4.2 2.4M12 12.1l-4.2 2.4',
    ],
  },
  // Gemini — dört kollu pırıltı
  gemini: {
    fill: true,
    paths: ['M12 2.5c.4 3.8 1.7 6.1 4.8 7.5-3.1 1.4-4.4 3.7-4.8 7.5-.4-3.8-1.7-6.1-4.8-7.5 3.1-1.4 4.4-3.7 4.8-7.5z'],
  },
  // Perplexity — altıgen çerçeveyi dikine kesen çubuk; markanın
  // kendi işaretinin iskeleti bu.
  perplexity: {
    paths: [
      'M12 3.4 19 7.6v8.8L12 20.6 5 16.4V7.6z',
      'M12 3.4v17.2M5 7.6l7 4.2 7-4.2',
    ],
  },
  // Grok — eğik bıçak: iki paralel köşeli şerit. Düz bir "X" hem
  // X'in (twitter) işaretiyle hem kapatma çarpısıyla karışıyordu.
  grok: {
    fill: true,
    paths: ['M7.4 20.5H4.2L14.1 6.6h3.2zM19.8 3.5h-3.2l-2.5 3.5h3.2zM10.2 13.9H7l-2.8 3.9h3.2z'],
  },
  deepseek: {
    paths: [
      'M3.5 13c2.5-5.5 14.5-5.5 17 0-1.2 3.2-4.5 5.5-8.5 5.5S4.7 16.2 3.5 13z',
      'M18.5 11.5c1.5-1 3-2.2 3.5-3.5-1.8.3-3.2 1-4.2 2',
      'M9 13.5h.01M12.5 13.8h.01',
    ],
  },

  av: {
    paths: [
      'M12 3 4 7v5c0 5 3.5 8.5 8 9.5 4.5-1 8-4.5 8-9.5V7z',
      'M12 11v5M9.5 13.5h5',
    ],
  },
  kuran: {
    paths: [
      'M4 5c3 0 5 .7 8 2 3-1.3 5-2 8-2v13c-3 0-5 .7-8 2-3-1.3-5-2-8-2z',
      'M12 7v13',
    ],
  },
  hadis: {
    paths: ['M5 4h14v16H5z', 'M9 8h6M9 12h6M9 16h4'],
  },
  ansiklopedi: {
    paths: ['M5 4h11l3 3v13H5z', 'M16 4v3h3', 'M8 11h8M8 15h5'],
  },
  diyanet: {
    paths: [
      'M12 3 4 7v5c0 5 3.5 8.5 8 9.5 4.5-1 8-4.5 8-9.5V7z',
      'M9 12h6M12 9v6',
    ],
  },

  // ── Google / Workspace ──
  google: {
    paths: [
      'M12 12h8.5A8.5 8.5 0 1 1 15 5.2',
      'M12 12h8.2',
    ],
  },
  gmail: {
    paths: [
      'M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z',
      'M4.5 7.5 12 13l7.5-5.5',
    ],
  },
  docs: {
    paths: [
      'M7 3h7l4 4v14H7z',
      'M14 3v4h4',
      'M10 11h6M10 14h6M10 17h4',
    ],
  },
  drive: {
    paths: [
      'M12 4.5 4.5 17h5.2L14.6 8z',
      'M14.2 9.2 18.5 17H9.8l2.2-3.9z',
      'M8.5 17h11',
    ],
  },
  sheets: {
    paths: [
      'M7 3h7l4 4v14H7z',
      'M14 3v4h4',
      'M9.5 11h7M9.5 14h7M9.5 17h7M12.5 11v6M15.5 11v6',
    ],
  },
  calendar: {
    paths: [
      'M5 6h14v13H5z',
      'M5 6V4.5h14V6',
      'M9 3.5v3M15 3.5v3',
      'M9 12h2M13 12h2M9 15h2M13 15h2',
    ],
  },
  maps: {
    paths: [
      'M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z',
      'M12 13.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    ],
  },
  meet: {
    paths: [
      'M3.5 8.5A2.5 2.5 0 0 1 6 6h8a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 14 18H6a2.5 2.5 0 0 1-2.5-2.5z',
      'M16.5 10.5 21 8v8l-4.5-2.5z',
    ],
  },
}

const HOST = {
  'x.com': 'x', 'twitter.com': 'x',
  'instagram.com': 'instagram',
  'youtube.com': 'youtube', 'youtu.be': 'youtube',
  'web.whatsapp.com': 'whatsapp', 'whatsapp.com': 'whatsapp',
  'web.telegram.org': 'telegram', 'telegram.org': 'telegram', 't.me': 'telegram',
  'linkedin.com': 'linkedin',
  'claude.ai': 'claude',
  'chatgpt.com': 'chatgpt', 'chat.openai.com': 'chatgpt',
  'gemini.google.com': 'gemini',
  'perplexity.ai': 'perplexity',
  'grok.com': 'grok', 'x.ai': 'grok',
  'chat.deepseek.com': 'deepseek', 'deepseek.com': 'deepseek',
  'alaturkavakitler.com': 'av',
  'kuran.diyanet.gov.tr': 'kuran',
  'hadislerleislam.diyanet.gov.tr': 'hadis',
  'islamansiklopedisi.org.tr': 'ansiklopedi',
  'diyanet.gov.tr': 'diyanet',
  // Google — alt alanlar ÖNCE (endsWith `.google.com` yakalamasın diye
  // exact HOST[h] ile çözülür).
  'google.com': 'google',
  'mail.google.com': 'gmail',
  'docs.google.com': 'docs',
  'drive.google.com': 'drive',
  'sheets.google.com': 'sheets',
  'calendar.google.com': 'calendar',
  'maps.google.com': 'maps',
  'meet.google.com': 'meet',
}

/** Bilinen bir markaya çöz; yoksa boş string. */
export function brandKey(id, url) {
  if (id && BRANDS[id]) return id
  try {
    const h = new URL(url).hostname.replace(/^www\./, '').toLowerCase()
    if (HOST[h]) return HOST[h]
    for (const [host, key] of Object.entries(HOST))
      if (h === host || h.endsWith(`.${host}`)) return key
  } catch { /* geçersiz url */ }
  return ''
}
