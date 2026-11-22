// Mağaza ve tanıtım görsellerini basar.
//
// Görseller ELLE ÇİZİLMİYOR: her karede uygulamanın KENDİSİ çalışıyor
// (sitedeki `brand/social/render.mjs` ile aynı gerekçe — taklit edilen
// bir arayüz, uygulama değiştikçe sessizce yalan söylemeye başlıyor).
//
// Yol: dist derlenir → küçük bir sunucuyla yayınlanır → headless
// Chromium'a her belge için ayarlar ve önbellek enjekte edilir →
// istenen ölçüde ekran görüntüsü alınır. Tanıtım kutuları da aynı
// tarayıcıda, HTML şablonundan çiziliyor; böylece tipografi uygulamayla
// aynı kalıyor.
//
// Kullanım:
//   node scripts/magaza-gorseller.mjs            → bütün görseller
//   node scripts/magaza-gorseller.mjs --no-build → dist'i derleme
//   node scripts/magaza-gorseller.mjs --video    → ayrıca YouTube filmi
import { spawn, spawnSync } from 'node:child_process'
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises'
import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { dirname, extname, join } from 'node:path'
import { tmpdir } from 'node:os'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const DIST = join(ROOT, 'dist')
const OUT = join(ROOT, 'magaza')
const args = process.argv.slice(2)
const want = (f) => args.includes(f)

// ── 1. Derle ──
if (!want('--no-build')) {
  const r = spawnSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit' })
  if (r.status !== 0) process.exit(1)
}
if (!existsSync(join(DIST, 'index.html'))) {
  console.error('dist/index.html yok — önce `npm run build`.')
  process.exit(1)
}

// ── 2. Sunucu ──
const PORT = 8137
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
}
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  let p = join(DIST, decodeURIComponent(url.pathname))
  if (url.pathname === '/' || !existsSync(p)) p = join(DIST, 'index.html')
  res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' })
  createReadStream(p).pipe(res)
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}`

// ── 3. Veri: vakit tablosu önceden indirilir ──
// Headless tarayıcının ağa çıkmasını beklemek hem yavaş hem kırılgan;
// tablo burada bir kez alınıp her sahneye önbellek olarak veriliyor.
const PLATE = '34'
let vakitJson = null
try {
  const u = 'https://raw.githubusercontent.com/saatleriayarlamaenstitusu'
    + `/data-diyanet-namaz-vakitleri/main/data/namaz/${PLATE}.json`
  vakitJson = await (await fetch(u)).json()
} catch {
  console.warn('! vakit tablosu indirilemedi; vakit widget\'ı boş görünecek')
}

/** Hava durumu da önbellekten: tanıtımda hep aynı hava görünsün. */
const HAVA = {
  plate: PLATE,
  at: Date.now(),
  data: {
    temp: 14, feels: 12, code: 2, min: 8, max: 17,
    days: [
      { iso: '2026-01-02', name: 'Cum', code: 3, min: 7, max: 15 },
      { iso: '2026-01-03', name: 'Cmt', code: 61, min: 6, max: 13 },
      { iso: '2026-01-04', name: 'Paz', code: 0, min: 4, max: 12 },
    ],
  },
}

// ── 4. Chromium ──
const CDP_PORT = 9415
const PROFILE = join(tmpdir(), `nt-shots-${process.pid}`)
await rm(PROFILE, { recursive: true, force: true })
const BIN = ['/usr/bin/chromium', '/usr/bin/google-chrome', '/usr/bin/chromium-browser']
  .find((b) => existsSync(b))
if (!BIN) { console.error('Chromium bulunamadı.'); process.exit(1) }

const chrome = spawn(BIN, [
  '--headless=new', `--remote-debugging-port=${CDP_PORT}`,
  '--hide-scrollbars', '--no-first-run', `--user-data-dir=${PROFILE}`,
  '--force-color-profile=srgb', '--disable-lcd-text', 'about:blank',
], { stdio: 'ignore' })

async function firstPage() {
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
      const p = list.find((t) => t.type === 'page')
      if (p) return p
    } catch { /* henüz açılmadı */ }
    await sleep(250)
  }
  throw new Error('Chromium bağlantısı kurulamadı')
}
const page = await firstPage()
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r) => { ws.onopen = r })
let msgId = 0
const pending = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
}
const send = (method, params = {}) => new Promise((res) => {
  const id = ++msgId
  pending.set(id, res)
  ws.send(JSON.stringify({ id, method, params }))
})
await send('Page.enable')
await send('Runtime.enable')
await mkdir(OUT, { recursive: true })

/**
 * Görüntü alanı: ölçü pencereden değil emülasyondan.
 *
 * `scale` kesirli olabiliyor ve mağaza görüntüleri bunu gerektiriyor:
 * mağaza tam 1280×800 istiyor ama sayfa o boyda 962px'e uzayıp alttaki
 * widget'ı kesiyordu (ölçüldü). 1600×1000 CSS pikselde çizip 0.8 ile
 * küçültmek hem tam ölçüyü veriyor hem de kompozisyona nefes payı
 * bırakıyor — yazılar küçülüyor ama 1280px'lik bir kapakta zaten
 * okunur kalıyorlar.
 */
const viewport = (w, h, scale = 1) =>
  send('Emulation.setDeviceMetricsOverride',
    { width: w, height: h, deviceScaleFactor: scale, mobile: false })

/** Mağaza kapağı: 1600×1000 çiz, 1280×800 bas. */
const SHOT_W = 1600
const SHOT_H = 1000
const SHOT_SCALE = 0.8

let injected = null
async function seed(settings) {
  // Her belgeye, uygulamanın kendi betikleri çalışmadan ÖNCE.
  if (injected) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: injected })
  const script = `(() => { try {
    localStorage.setItem('alaturka-newtab', ${JSON.stringify(JSON.stringify(settings))});
    ${vakitJson ? `localStorage.setItem('alaturka-newtab-vakit', ${JSON.stringify(JSON.stringify({ plate: PLATE, json: vakitJson, at: Date.now() }))});` : ''}
    localStorage.setItem('alaturka-newtab-hava', ${JSON.stringify(JSON.stringify(HAVA))});
  } catch {} })()`
  const r = await send('Page.addScriptToEvaluateOnNewDocument', { source: script })
  injected = r.result?.identifier
}

async function shot(url, file, w, h, waitMs = 2600) {
  await viewport(w, h, SHOT_SCALE)
  await send('Page.navigate', { url })
  await sleep(waitMs)
  // Mağaza 1280×800 İSTİYOR; içerik taşarsa alttaki widget yarım
  // kalıyor ve tanıtımda yarım bir kutu kötü duruyor.
  const over = await send('Runtime.evaluate', {
    expression: 'document.body.scrollHeight', returnByValue: true,
  })
  const got = over.result?.result?.value ?? 0
  if (got > h + 2) console.warn(`  ! ${file}: içerik ${got}px, kutu ${h}px — alt kenar kesiliyor`)
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  await writeFile(join(OUT, file), Buffer.from(r.result.data, 'base64'))
  console.log('✓', file, `${Math.round(w * SHOT_SCALE)}×${Math.round(h * SHOT_SCALE)}`)
}

/** Ortak taban: şehir İstanbul, tanıtımda boş bir not durmasın. */
const base = (over = {}) => ({
  city: { plate: PLATE, name: 'İSTANBUL' },
  note: 'Cuma: ikindiden sonra Kehf.\nAkşam — hatimden 4 sayfa.',
  noteHeight: 0,
  ...over,
})

// ── 5. Mağaza ekran görüntüleri (1280×800) ──
// `--film` yalnızca videoyu basar: durağan görseller değişmediğinde
// hepsini yeniden üretmek bir dakikayı boşa harcıyor.
const filmOnly = want('--film')
const SCENES = [
  {
    file: '01-genel.png',
    s: base({
      theme: 'dark', palette: 'klasik', surface: 'cizgi',
      bg: { image: '29524511', mode: 'foto', dim: 45, blur: 8, grid: false, grain: true },
      clock: { style: 'nokta', main: 'vasati', side: 'alaturka', weight: 200 },
      layout: { sol: ['analog', 'takvim', 'vakit'], sag: ['sistem', 'hava', 'ayet'], alt: [] },
    }),
  },
  {
    file: '02-acik-tema.png',
    s: base({
      theme: 'light', palette: 'mesh', surface: 'mat',
      bg: { image: '39258975', mode: 'foto', dim: 10, blur: 0, grid: false, grain: false },
      clock: { style: 'sade', main: 'alaturka', side: 'vasati', weight: 300 },
      calendar: { view: 'hicri', main: 'hicri' },
      layout: { sol: ['takvim', 'vakit'], sag: ['hava', 'yapayzeka'], alt: ['not'] },
    }),
  },
  {
    file: '03-mesh-izgara.png',
    s: base({
      theme: 'dark', palette: 'mono', surface: 'buzlu',
      bg: { image: '33797168', mode: 'mesh', dim: 25, blur: 0, grid: true, grain: true },
      clock: { style: 'mono', main: 'vasati', side: 'alaturka', weight: 400 },
      layout: { sol: ['vakit', 'takvim'], sag: ['hava', 'ayet', 'sistem'], alt: ['not'] },
    }),
  },
  {
    file: '04-widgetlar.png',
    s: base({
      theme: 'dark', palette: 'canli', surface: 'mat',
      bg: { image: '35586639', mode: 'foto', dim: 55, blur: 14, grid: false, grain: true },
      layout: { sol: ['analog', 'hava', 'sistem'], sag: ['takvim', 'vakit', 'ayet'], alt: [] },
    }),
  },
]

if (!filmOnly) for (const sc of SCENES) {
  await seed(sc.s)
  await shot(BASE, sc.file, SHOT_W, SHOT_H)
}

// Ayarlar paneli açık: tıklayarak açılır, çünkü panel bir ayar değil
// geçici bir durum.
if (!filmOnly) {
await seed(SCENES[0].s)
await viewport(SHOT_W, SHOT_H, SHOT_SCALE)
await send('Page.navigate', { url: BASE })
await sleep(2600)
await send('Runtime.evaluate', {
  expression: `(async () => {
    document.querySelector('.personalize').click()
    await new Promise(r => setTimeout(r, 450))
    const h = [...document.querySelectorAll('.grp-head')].find(x => /Yerleşim/i.test(x.textContent))
    h?.click()
  })()`,
  awaitPromise: true,
})
await sleep(1200)
{
  const r = await send('Page.captureScreenshot', { format: 'png' })
  await writeFile(join(OUT, '05-ayarlar.png'), Buffer.from(r.result.data, 'base64'))
  console.log('✓ 05-ayarlar.png 1280×800')
}
}

// ── 6. Tanıtım kutuları ve sosyal kareler ──
// Şablon aynı tarayıcıda çiziliyor: yazı tipi ve renkler uygulamayla
// birebir aynı olsun diye paketin fontu kullanılıyor.
/**
 * Ekran görüntüsü karta DATA URI olarak gömülür.
 *
 * `<img src="/01-genel.png">` denendi ve kırık geldi: sunucu yalnızca
 * `dist/`i yayınlıyor, görseller ise `magaza/` altında ve bilinmeyen
 * yollar index.html'e düşüyor — yani kart sessizce boş çıkıyordu.
 */
const shots = new Map()
async function shotUri(file) {
  if (!shots.has(file)) {
    const buf = await readFile(join(OUT, file))
    const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg'
    shots.set(file, `data:${mime};base64,${buf.toString('base64')}`)
  }
  return shots.get(file)
}

// Kart metinleri mağaza açıklamasıyla AYNI ağızdan konuşur
// (`docs/magaza.md` §3.3): orada "siz", burada "sen" olsaydı iki ayrı
// ürün gibi okunurdu.
/* Metinler TEK dosyadan gelir: `alaturkavakitler/brand/social/metinler.txt`.
   Üç deponun tanıtım yazıları orada duruyor ve bir cümleyi düzeltmek
   için burayı açmak gerekmiyor. Depolar yan yana değilse yol ortamdan
   verilir: `METINLER=/yol/metinler.txt npm run magaza`.
   Dosya yoksa aşağıdaki yedek metinler kullanılır. */
function readMetin(file) {
  const out = {}
  let key = null
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const head = line.match(/^\[([^\]]+)\]$/)
    if (head) { key = head[1].includes('/') ? head[1] : null; if (key) out[key] = {} ; continue }
    const eq = line.indexOf('=')
    if (eq === -1 || !key) continue
    out[key][line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
  }
  return out
}

const METIN_FILE = process.env.METINLER
  ?? join(ROOT, '..', 'alaturkavakitler', 'brand', 'social', 'metinler.txt')
const METIN = existsSync(METIN_FILE) ? readMetin(METIN_FILE) : {}
if (!Object.keys(METIN).length) console.warn('! metinler.txt okunamadı:', METIN_FILE)

/** Kartın yazılarını dosyadan alır; `title` iki satırdır. */
const txt = (key, def) => {
  const m = METIN[key]
  if (!m) return def
  return {
    ...def,
    title: [m.baslik1, m.baslik2].filter(Boolean).join('\n') || def.title,
    sub: m.aciklama ?? '',
  }
}

const CARDS = [
  txt('eklenti/promo-kucuk', { file: 'promo-440x280.jpg', w: 440, h: 280, kind: 'kucuk', shot: '01-genel.png',
    title: 'Alaturka Vakitler', sub: 'Yeni Sekme' }),
  txt('eklenti/promo-genis', { file: 'promo-1400x560.jpg', w: 1400, h: 560, kind: 'genis', shot: '01-genel.png',
    title: 'Yeni sekmeniz\ngüne açılsın',
    sub: 'Alaturka saat · namaz vakitleri · hicri takvim · günün ayeti · hava durumu' }),
  // Rozet ilk karede: akışta önce o görünüyor ve "nereden kurulur"
  // sorusu ilk karşılaşmada soruluyor.
  txt('eklenti/ig-1', { file: 'ig-1-1080x1350.jpg', w: 1080, h: 1350, kind: 'dikey', shot: '01-genel.png', badge: true,
    title: 'Boş sekme yerine\ngünün panosu', sub: 'Alaturka Vakitler · Yeni Sekme' }),
  txt('eklenti/ig-2', { file: 'ig-2-1080x1350.jpg', w: 1080, h: 1350, kind: 'dikey', shot: '02-acik-tema.png',
    title: 'Her şey\nsizin kurduğunuz yerde', sub: 'Widget’ları sürükleyin, arka planı değiştirin, kendi fotoğrafınızı yükleyin' }),
  txt('eklenti/ig-3', { file: 'ig-3-1080x1350.jpg', w: 1080, h: 1350, kind: 'dikey', shot: '03-mesh-izgara.png',
    title: 'Gününüz,\nvaktiyle birlikte', sub: 'Vakitler, hicri takvim ve günün ayeti · Diyanet verisiyle, 81 il' }),
  txt('eklenti/ig-4', { file: 'ig-4-1080x1350.jpg', w: 1080, h: 1350, kind: 'dikey', shot: '05-ayarlar.png',
    title: 'Sade, reklamsız\nve gizlilik dostu', sub: 'Hesap yok, giriş yok, izleme yok' }),
  txt('eklenti/kolaj', { file: 'kolaj-1280x800.jpg', w: 1280, h: 800, kind: 'kolaj', shot: '04-widgetlar.png',
    title: 'Ekranınızda ne varsa\nsiz koydunuz', sub: 'Vakitler · takvim · hava · sistem · ayet · not · kendi kısayol gruplarınız' }),
]

/* Inter Tight — İKİ ALT KÜME birden.
Yalnızca latin-ext yüklenmişti ve o altküme
     TEMEL LATİN harflerini taşımıyor: başlıkların neredeyse tamamı
     sessizce sistem yazı tipine düşüyordu (kalınlık değişiyordu ama
     harfler Inter Tight değildi). Aralıklar base.css'ten birebir.
 */
/* Mağaza rozeti + desteklenen tarayıcılar.
   İki kartta birden kullanılıyor (ilk Instagram karesi ve widget
   tahtası), bu yüzden tek yerde duruyor. Google'ın mağaza logosu
   KULLANILMAZ — marka; yalnızca adı yazar. Samsung Internet listede
   yok: Chromium tabanlı ama kendi mağazasını kullanıyor. */
const STORE_LINE = {
  pill: 'Chrome Web Store’dan indirin',
  works: 'Chromium tabanlı tarayıcılarda çalışır',
  browsers: 'Chrome · Edge · Brave · Vivaldi · Arc · Opera · Yandex · Chromium',
}

const storeCss = (k = 1) => `
.store { display: flex; flex-direction: column; align-items: flex-start; gap: ${Math.round(10 * k)}px; }
.store .pill { font-size: ${Math.round(21 * k)}px; font-weight: 600; padding: ${Math.round(11 * k)}px ${Math.round(20 * k)}px;
  border-radius: 999px; background: #fff; color: #0b0c0e; }
.store .works { font-size: ${Math.round(17 * k)}px; font-weight: 500; color: rgba(255,255,255,.72); }
.store .browsers { font-size: ${Math.round(15 * k)}px; letter-spacing: 0.04em; color: rgba(255,255,255,.4); }`

const storeHtml = (o = STORE_LINE) => `<div class="store">
  <span class="pill">${o.pill}</span>
  <span class="works">${o.works}</span>
  <span class="browsers">${o.browsers}</span>
</div>`

const FONT_FACE = `@font-face {
    font-family: 'Inter Tight'; font-style: normal; font-weight: 200 700;
    font-display: block;
    src: url('/fonts/inter-tight-latin.woff2') format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
      U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122,
      U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
  @font-face {
    font-family: 'Inter Tight'; font-style: normal; font-weight: 200 700;
    font-display: block;
    src: url('/fonts/inter-tight-latin-ext.woff2') format('woff2');
    unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7,
      U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F,
      U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F,
      U+A720-A7FF;
  }`

/* Punto metne uyar, metin puntoya değil: ilk turda açıklamalara 110
   karakterlik bir sınır konmuştu ve metinler o sınıra sıkıştırıldıkları
   için cılız kalmıştı. Sınır kalktı, kart küçülüyor. */
const fit = (text, steps) => {
  const n = String(text ?? '').replace(/<[^>]*>/g, '').length
  for (const [limit, k] of steps) if (n <= limit) return k
  return steps[steps.length - 1][1]
}
const cardHtml = (c, uri) => `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<style>
  ${FONT_FACE}
  ${storeCss(1)}
  * { margin: 0; box-sizing: border-box; }
  html, body { width: ${c.w}px; height: ${c.h}px; overflow: hidden; }
  body {
    font-family: 'Inter Tight', system-ui, sans-serif;
    color: #fff;
    background: #0b0c0e;
    display: flex;
    ${c.kind === 'genis' ? 'flex-direction: row; align-items: center;' : 'flex-direction: column;'}
    position: relative;
  }
  /* Zemin: ekran görüntüsünün kendisi, bulanık ve karanlık — kartın
     havası uygulamanın havası olsun. */
  .veil { position: absolute; inset: -40px; background: url('${uri}') center/cover; filter: blur(34px) saturate(130%) brightness(0.5); }
  .tint { position: absolute; inset: 0; background: linear-gradient(160deg, rgba(10,11,13,.55), rgba(10,11,13,.9)); }
  .inner { position: relative; display: flex; width: 100%; height: 100%; }
  .txt { position: relative; z-index: 2; }
  /* Başlık KALIN: 300 ağırlık uygulamanın içinde (saatin yanında,
     widget başlıklarıyla) doğruydu ama bir kapakta zayıf kalıyor —
     tanıtım görseli küçültülerek listelenebiliyor ve ince bir
     başlık orada eriyor. Inter Tight değişken, 600 gerçekten
     çiziliyor (yapay kalınlaştırma değil). */
  h1 { font-weight: 600; letter-spacing: -0.035em; line-height: 1.04; white-space: pre-line; }
  /* Alt satır başlığın tersine hafif: ikisi de kalın olsa kart
     bağırıyor, hiyerarşi kayboluyor. */
  p { color: rgba(255,255,255,.66); letter-spacing: .01em; font-weight: 400; }
  .mark { display: flex; align-items: center; gap: .5em; color: rgba(255,255,255,.75); }
  .mark svg { display: block; }
  .shot { position: relative; z-index: 2; border-radius: 10px; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,.6); border: 1px solid rgba(255,255,255,.12); }
  .shot img { display: block; width: 100%; }
</style></head><body>
<div class="veil"></div><div class="tint"></div>
${c.kind === 'kucuk' ? `
  <div class="inner" style="align-items:center;padding:0 0 0 30px;gap:18px">
    <div class="txt" style="flex:0 0 48%">
      <h1 style="font-size:${Math.round(31 * fit(c.title.split('\n').sort((a, b) => b.length - a.length)[0], [[18, 1], [26, 0.85], [999, 0.7]]))}px">${c.title}</h1>
      <p style="font-size:15px;margin-top:7px;line-height:1.4">${c.sub}</p>
    </div>
    <!-- Küçük kutu yalnız yazıyken bir kapak gibi duruyordu; uygulamadan
         bir parça görünmeli. Görsel kenardan taşar: kutu dar, tamamını
         sığdırmak onu okunmaz bir pula çeviriyor. -->
    <div class="shot" style="flex:1;align-self:stretch;margin:26px -70px 26px 0;border-radius:10px 0 0 10px">
      <img src="${uri}" style="width:215%;max-width:none">
    </div>
  </div>` : ''}
${c.kind === 'genis' ? `
  <div class="inner" style="align-items:center;padding:0 72px;gap:64px">
    <div class="txt" style="flex:0 0 46%">
      <h1 style="font-size:${Math.round(58 * fit(c.title.split('\n').sort((a, b) => b.length - a.length)[0], [[16, 1], [22, 0.86], [30, 0.72], [999, 0.6]]))}px">${c.title}</h1>
      <p style="font-size:${Math.round(23 * fit(c.sub, [[90, 1], [140, 0.9], [190, 0.82], [999, 0.74]]))}px;margin-top:18px;line-height:1.5">${c.sub}</p>
    </div>
    <div class="shot" style="flex:1"><img src="${uri}"></div>
  </div>` : ''}
${c.kind === 'dikey' ? `
  <!-- Kapak KIRPILMAZ. Bir ara %124'e büyütülüp iki yandan taşırılmıştı
       (yazının altındaki boşluğu yemek için) ama o zaman da ekranın
       kenarındaki widget'lar kesiliyordu — eklentinin anlattığı şey
       tam da o widget'lar. Şimdi kapak kartın enini tam kaplıyor ve
       kendi oranında duruyor; artan boşluk yazının ALTINA değil,
       yazının etrafına dağıtılıyor (metin kalan alanda ortalanır). -->
  <div class="inner" style="flex-direction:column;padding:84px 0 0">
    <div class="txt" style="margin:auto 72px">
      <h1 style="font-size:${Math.round(76 * fit(c.title.split('\n').sort((a, b) => b.length - a.length)[0], [[16, 1], [22, 0.84], [30, 0.68], [999, 0.56]]))}px">${c.title}</h1>
      <p style="font-size:${Math.round(30 * fit(c.sub, [[90, 1], [140, 0.9], [190, 0.82], [999, 0.74]]))}px;margin-top:26px;line-height:1.45">${c.sub}</p>
    </div>
    ${c.badge ? `<div style="margin:0 72px 34px">${storeHtml()}</div>` : ''}
    <div class="shot" style="border-radius:16px 16px 0 0;border-bottom:0">
      <img src="${uri}">
    </div>
  </div>` : ''}
${c.kind === 'kolaj' ? `
  <div class="inner" style="flex-direction:column;justify-content:center;align-items:center;padding:48px;gap:24px">
    <div class="txt" style="align-self:flex-start"><h1 style="font-size:42px">${c.title}</h1>
    <p style="font-size:19px;margin-top:8px">${c.sub}</p></div>
    <!-- Genişlik ELLE verilir: esnek kutuda görsel kalan yüksekliği
         aşıp alttan kırpılıyordu (ayet kartının son satırı gidiyordu).
         912×570, kalan alana tam oturan 1.6:1. -->
    <div class="shot" style="width:912px;flex:0 0 auto"><img src="${uri}"></div>
  </div>` : ''}
</body></html>`

/* ── Widget tahtası (4:5) ──
 *
 * Ekran görüntüsü DEĞİL: her widget tek tek, kendi kutusuyla kesilip
 * bir tahtaya diziliyor. Bütün ekranın kapağı "şuna benziyor" diyor,
 * bu kare "içinde şunlar var" diyor — eklentinin satır satır
 * anlatılacak tarafı widget listesi ve bir kapakta onlar küçücük
 * kalıyor.
 *
 * Kesitler saydam zeminle alınıyor: sayfanın arka planı gizlenip
 * tarayıcının varsayılan zemini saydama çekiliyor, böylece kutuların
 * yuvarlatılmış köşelerinden kartın kendi zemini görünüyor. Zemin
 * gizlenmezse her kesitin köşesinde bir parça fotoğraf kalıyor ve
 * tahta kolaj gibi değil, kırpılmış ekran görüntüleri gibi duruyor.
 */
async function widgetBoard() {
  const meta = METIN['eklenti/widgetler'] ?? {}
  await seed(base({
    theme: 'dark', palette: 'klasik', surface: 'mat',
    bg: { image: '29524511', mode: 'foto', dim: 60, blur: 10, grid: false, grain: false },
    clock: { style: 'nokta', main: 'vasati', side: 'alaturka', weight: 200 },
    // Not kutusu varsayılan boyunda bir satırlık bir şerit kalıyor;
    // tahtada bir widget olarak okunması için biraz boy veriliyor.
    noteHeight: 150,
    layout: {
      sol: ['vakit', 'takvim', 'analog', 'dini'],
      sag: ['hava', 'ayet', 'sistem', 'yapayzeka'],
      alt: ['not', 'google', 'sosyal'],
    },
  }))
  // Yüksek bir görüntü alanı: bütün widget'lar aynı anda yerleşsin,
  // kesit alınırken sayfanın dışında kalan olmasın.
  await viewport(1600, 2600, 1)
  await send('Page.navigate', { url: BASE })
  await sleep(3000)

  await send('Runtime.evaluate', {
    expression: `(() => {
      // Saat ve arama kutusu GİZLENMEZ: ikisi de ekranın parçası ve
      // tahtada kendi kutularıyla duruyorlar. Gizlenen yalnızca zemin
      // ve kart dışı denetimler.
      for (const sel of ['canvas', '.bg', '.bg-layer', '.personalize', '.mini']) {
        document.querySelectorAll(sel).forEach(el => { el.style.visibility = 'hidden' })
      }
      document.documentElement.style.background = 'transparent'
      document.body.style.background = 'transparent'
    })()`,
  })
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })
  await sleep(500)

  const boxes = await send('Runtime.evaluate', {
    returnByValue: true,
    // `.ck` saat, `.search` arama kutusu; ikisi widget değil ama
    // ekranın parçası ve tahtada görünmeleri gerekiyor. Ayrı
    // işaretleniyorlar çünkü ızgaraya değil, üstteki tam genişlikte
    // şeride giriyorlar.
    expression: `[...document.querySelectorAll('.ck, .search, .w')].map(el => {
      const r = el.getBoundingClientRect()
      return {
        hero: el.classList.contains('ck') || el.classList.contains('search'),
        x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height,
      }
    }).filter(b => b.w > 40 && b.h > 24)`,
  })
  const list = boxes.result?.result?.value ?? []
  if (!list.length) { console.warn('! widget bulunamadı, tahta atlandı'); return }

  const grabbed = []
  for (const b of list) {
    const r = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 2 },
    })
    grabbed.push({ uri: `data:image/png;base64,${r.result.data}`, w: b.w, h: b.h, ratio: b.h / b.w, hero: b.hero })
  }
  const heroes = grabbed.filter((g) => g.hero)
  const tiles = grabbed.filter((g) => !g.hero)
  await send('Emulation.setDefaultBackgroundColorOverride', {})

  /* Dizim ELDE hesaplanır, CSS kolonlarıyla değil.
     `column-count: 2` denendi: kolonlar dolunca tarayıcı üçüncü,
     dördüncü kolonu yana açıyor ve kartın dışında kalan widget'lar
     sessizce kayboluyordu (on bir widget'ın yedisi görünmüyordu).
     Burada her kutunun boyu oranından biliniyor; en kısa kolona
     yerleştirip toplam boyu ölçmek ve gerekirse tahtanın tamamını
     küçültmek mümkün. */
  const GAP = 18
  const BOARD_W = 1080 - 128
  /* Saat ve arama kutusu üstte, tam genişlikte bir şerit; ızgaraya
     girselerdi üç yüz piksellik bir kolona sıkışıp okunmaz kalırlardı.
     Doğal enlerinden büyütülmüyorlar ve bir tavanları var — şerit
     uzadıkça aşağıdaki widget'lara kalan yer daralıyor. */
  const heroW = Math.min(620, BOARD_W, Math.max(0, ...heroes.map((h) => h.w)))
  const heroH = heroes.reduce((sum, h) => sum + heroW * h.ratio + 14, 0)
  const BOARD_H = 828 - heroH

  /* Kolon sayısı ÖLÇÜLEREK seçilir, elle değil. Aynı widget'lar üç
     kolonda uzun ve ince, dört kolonda kısa ve bol bir yığın veriyor;
     hangisinin daha büyük bir ölçek bıraktığı kutuların boylarına
     bağlı ve o boylar widget listesi değiştikçe değişiyor. Üç aday
     denenip kutuların ekranda en büyük göründüğü seçiliyor. */
  const pack = (cols) => {
    const colW = (BOARD_W - GAP * (cols - 1)) / cols
    const colH = Array(cols).fill(0)
    const placed = tiles.map((t) => {
      let c = 0
      for (let i = 1; i < cols; i++) if (colH[i] < colH[c]) c = i
      const top = colH[c]
      const h = colW * t.ratio
      colH[c] = top + h + GAP
      return { uri: t.uri, left: c * (colW + GAP), top, w: colW, h }
    })
    const total = Math.max(...colH) - GAP
    const fitK = Math.min(1, BOARD_H / total)
    return { colW, placed, fitK, shown: fitK * colW }
  }
  const best = [2, 3, 4].map(pack).reduce((a, b) => (b.shown > a.shown ? b : a))
  const { placed, fitK } = best
  const title = [meta.baslik1, meta.baslik2].filter(Boolean).join('\n')
    || 'Alaturka Yeni Sekme'
  const sub = meta.aciklama
    ?? 'Namaz vakitleri · hicri takvim · hava · günün ayeti · sistem · not · kendi kısayol gruplarınız'
  // Üst etiket isteğe bağlı: başlık zaten eklentinin adı olduğunda
  // ikisi üst üste aynı şeyi söylüyor.
  const eyebrow = meta.ustbaslik ?? ''
  const works = meta.uyum ?? 'Chromium tabanlı tarayıcılarda çalışır'
  // Yalnızca Web Store'dan eklenti kurulabilen tarayıcılar. Samsung
  // Internet listede YOK: Chromium tabanlı ama kendi mağazasını
  // kullanıyor, buraya yazmak yanlış olurdu.
  const browsers = meta.tarayicilar
    ?? 'Chrome · Edge · Brave · Vivaldi · Arc · Opera · Yandex · Chromium'

  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>
${FONT_FACE}
* { margin: 0; box-sizing: border-box; }
html, body { width: 1080px; height: 1350px; overflow: hidden; }
body {
  font-family: 'Inter Tight', system-ui, sans-serif; color: #fff;
  background: radial-gradient(120% 80% at 50% 0%, #1b2430 0%, #0b0c0e 60%);
  padding: 72px 64px 56px; display: flex; flex-direction: column;
}
h1 { font-weight: 600; font-size: ${Math.round(66 * fit(title.split('\n').sort((a, b) => b.length - a.length)[0], [[16, 1], [22, 0.84], [30, 0.68], [999, 0.56]]))}px;
  letter-spacing: -0.035em; line-height: 1.04; white-space: pre-line; }
p { margin-top: 18px; font-weight: 400; font-size: ${Math.round(25 * fit(sub, [[90, 1], [140, 0.9], [190, 0.82], [999, 0.74]]))}px;
  line-height: 1.45; color: rgba(255,255,255,.6); }
.eyebrow { font-size: 20px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(255,255,255,.55); margin-bottom: 16px; }
.hero { margin-top: 30px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.hero img { display: block; }
.board { margin-top: 24px; flex: 1; min-height: 0; position: relative; }
.board-in { position: absolute; left: 50%; top: 0; transform-origin: top center; }
.board img { position: absolute; display: block; border-radius: 14px; }
/* Alt şerit: nereden kurulacağı ve nerede çalıştığı. Rozet dolgulu,
   uyum satırı soluk — biri çağrı, öbürü dipnot. Google'ın mağaza
   logosu KULLANILMAZ (marka), yalnızca adı yazar. */
${storeCss()}
.store { padding-top: 6px; }
</style></head><body>
${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}
<h1>${title}</h1>
<p>${sub}</p>
<div class="hero">${heroes.map(h => `<img src="${h.uri}" style="width:${heroW}px">`).join('')}</div>
<div class="board"><div class="board-in" style="width:${BOARD_W}px;margin-left:${-BOARD_W / 2}px;transform:scale(${fitK})">
${placed.map(t => `<img src="${t.uri}" style="left:${t.left}px;top:${t.top}px;width:${t.w}px;height:${t.h}px">`).join('')}
</div></div>
${storeHtml({ pill: STORE_LINE.pill, works, browsers })}
</body></html>`

  await viewport(1080, 1350, 1)
  await send('Page.navigate', { url: `${BASE}/__card` })
  await sleep(300)
  await send('Runtime.evaluate', {
    expression: `document.open(); document.write(${JSON.stringify(html)}); document.close();`,
  })
  await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true })
  await sleep(600)
  const out = await send('Page.captureScreenshot', { format: 'jpeg', quality: 92 })
  await writeFile(join(OUT, 'ig-5-widgetler-1080x1350.jpg'), Buffer.from(out.result.data, 'base64'))
  console.log('✓ ig-5-widgetler-1080x1350.jpg 1080×1350 ·', tiles.length, 'widget')
}

if (!filmOnly) await widgetBoard()

if (!filmOnly) for (const c of CARDS) {
  const uri = await shotUri(c.shot)
  const html = cardHtml(c, uri)
  await viewport(c.w, c.h)
  // Sayfa SUNUCUDAN açılır (font `/fonts/...` ile oradan geliyor),
  // içerik sonra yazılır.
  await send('Page.navigate', { url: `${BASE}/__card` })
  await sleep(300)
  await send('Runtime.evaluate', {
    expression: `document.open(); document.write(${JSON.stringify(html)}); document.close();`,
  })
  await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true })
  // Yazı tipi GERÇEKTEN yüklendi mi: yedeğe düşmek görselde en zor
  // fark edilen hata, kart basıldıktan sonra anlaşılmıyor.
  // İki ölçüt: font yüklü mü VE başlık gerçekten onunla mı çiziliyor.
  // `check()` tek başına yetmiyor — yüklü bir font kullanılmıyor da
  // olabilir. Aynı metin iki ailede ölçülüp genişlikleri
  // karşılaştırılıyor; eşitse yedeğe düşülmüş demektir.
  const probe = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const c = document.createElement('canvas').getContext('2d')
      c.font = '600 60px "Inter Tight", sans-serif'
      const a = c.measureText('Her yeni sekmede alaturka saat').width
      c.font = '600 60px sans-serif'
      const b = c.measureText('Her yeni sekmede alaturka saat').width
      return { loaded: document.fonts.check('600 60px "Inter Tight"'), a: Math.round(a), b: Math.round(b) }
    })()`,
  })
  const v = probe.result?.result?.value ?? {}
  if (!v.loaded || v.a === v.b)
    console.warn(`  ! ${c.file}: Inter Tight uygulanmıyor (yüklü:${v.loaded} ölçü:${v.a}/${v.b})`)
  else if (c.file.startsWith('promo-1400'))
    console.log(`  · yazı tipi doğrulandı — Inter Tight ${v.a}px, sistem sans ${v.b}px`)
  await sleep(900)
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 92 })
  await writeFile(join(OUT, c.file), Buffer.from(r.result.data, 'base64'))
  console.log('✓', c.file, `${c.w}×${c.h}`)
}

// ── 7. Mağaza simgesi (128×128) ──
// Eklentinin kendi simgesi: marka işareti + "yeni sekme" çerçevesi.
// Kutu ÖLÇÜLEREK kuruldu (`getBBox()`: x 30.05–51.35, y 474.36–486.53),
// kaynaktan kopyalanmadı: oradaki kutu işaretin solundan 6.5 birim
// kesiyor. Yollar birebir aynı; değişen yalnızca çerçeve.
const MARK = `<svg viewBox="29.7 474 22 12.7" fill="currentColor" aria-hidden="true">
  <g transform="scale(-1)"><path d="M-31.986-482.68q-.782 0-1.344-.563-.563-.562-.563-1.343 0-.813.563-1.376.562-.562 1.344-.562.812 0 1.375.562.562.563.562 1.344 0 .813-.562 1.375-.563.563-1.375.563zm-2.47 2.688q.407.844.407 1.719 0 .5-.125 1.031-.375 1.438-1.594 2.25l-5.814-11.532h3.845q1.094 2.188 3.281 6.532z"/></g>
  <path d="M49.414 478.203q-.781 0-1.344-.563-.562-.563-.562-1.344 0-.813.562-1.375.563-.563 1.344-.563.813 0 1.375.563.563.562.563 1.344 0 .812-.563 1.375-.562.563-1.375.563zm-2.47 2.687q.407.844.407 1.72 0 .5-.125 1.03-.375 1.439-1.594 2.251l-5.813-11.533h3.844q1.094 2.188 3.282 6.532z"/>
</svg>`

/**
 * Mağaza simgesi.
 *
 * İşaret UYDURULMAZ, kaynağından alınır: `components/LogoMark.vue`
 * ile birebir aynı yollar (sitede bir kez elle üçgen çizilmiş ve
 * logoya hiç benzememişti). Zemin koyu bir daire: mağaza ızgarasında
 * ve sekme çubuğunda kare bir kutu kenarlara yapışıyor.
 */
const ICON = `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0;width:128px;height:128px;overflow:hidden}
  body{display:grid;place-items:center;background:transparent}
  .disc{
    width:128px;height:128px;border-radius:28px;display:grid;place-items:center;
    background: radial-gradient(130% 130% at 28% 12%, #2d3340 0%, #0b0c0e 72%);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.10);
  }
  svg{width:88px;height:51px;color:#fff}
</style><div class="disc">${MARK}</div>`
if (!filmOnly) {
await viewport(128, 128)
await send('Runtime.evaluate', { expression: `document.open(); document.write(${JSON.stringify(ICON)}); document.close();` })
await sleep(600)
{
  const r = await send('Page.captureScreenshot', { format: 'png' })
  await writeFile(join(OUT, 'simge-128.png'), Buffer.from(r.result.data, 'base64'))
  console.log('✓ simge-128.png 128×128')
}
}


/**
 * Film sahnesi — sayfanın içine kurulan tek fonksiyon.
 *
 * `__film(t)` çağrıldığında SAHNENİN O ANKİ HÂLİNİ kurar; ara durum
 * tutmaz. Böylece kareler birbirinden bağımsız ve koşu tekrarlanabilir
 * (aynı t hep aynı görüntü). CSS geçişi kullanılmıyor: geçiş süresi
 * gerçek zamana bağlı, biz zamanı kendimiz sürüyoruz.
 */
function filmScript() {
  return `(() => {
  const S = document.createElement('style')
  S.textContent = \`
    .w, .ck, .search, .sc, .foot { will-change: transform, opacity }
    /* Kapak kartı sayfayı ÖRTER. Yarı saydam denendi ve kapanışta
       başlık saatin, alt yazı arama kutusunun üstüne biniyordu —
       iki katman birden okunmaya çalışılınca ikisi de okunmuyor. */
    #film-cap {
      position: fixed; inset: 0; z-index: 90; display: grid; place-items: center;
      background: radial-gradient(130% 130% at 50% 42%, rgba(9,10,12,.93), rgba(7,8,10,.985));
      backdrop-filter: blur(8px);
      pointer-events: none; text-align: center; padding: 0 8vw;
    }
    #film-cap h2 {
      margin: 0; font-family: var(--font1); font-weight: 600; font-size: 64px;
      letter-spacing: -0.035em; line-height: 1.08; color: #fff; white-space: pre-line;
    }
    #film-cap p {
      margin: 20px 0 0; font-family: var(--font1); font-weight: 400; font-size: 26px;
      letter-spacing: .01em; color: rgba(255,255,255,.82);
    }
    /* Alt şerit: sahne boyunca duran küçük başlık. Üstteki kapak
       kartları sahneyi ÖRTÜYOR, bu örtmüyor — ikisi farklı iş. */
    #film-bar {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 80;
      padding: 28px 56px 34px; pointer-events: none;
      background: linear-gradient(transparent, rgba(8,9,11,.82));
      font-family: var(--font1); color: #fff;
    }
    #film-bar b { display: block; font-weight: 600; font-size: 34px; letter-spacing: -0.02em; }
    #film-bar span { font-weight: 400; font-size: 19px; color: rgba(255,255,255,.62); }
  \`
  document.head.appendChild(S)

  const cap = document.createElement('div')
  cap.id = 'film-cap'
  cap.innerHTML = '<div><h2></h2><p></p></div>'
  document.body.appendChild(cap)
  const bar = document.createElement('div')
  bar.id = 'film-bar'
  bar.innerHTML = '<b></b><span></span>'
  document.body.appendChild(bar)

  const BG = (id) => 'https://cdn.alaturkavakitler.com/gorsel/bg/' + id + '.jpg'
  const el = (s) => document.querySelector(s)
  const clamp = (x) => Math.max(0, Math.min(1, x))
  // Yumuşatma: doğrusal giriş robot gibi duruyor.
  const ease = (x) => 1 - Math.pow(1 - clamp(x), 3)

  /** Widget'ların geliş sırası: önce saat, sonra arama, sonra kolonlar. */
  const order = () => [
    el('.ck'), el('.search'),
    ...document.querySelectorAll('.col.left .w'),
    ...document.querySelectorAll('.col.right .w'),
    ...document.querySelectorAll('.under .w'),
    el('.sc') || document.querySelector('.mid > :nth-child(3)'),
  ].filter(Boolean)

  let panelOpen = false
  const setPanel = (want) => {
    if (want === panelOpen) return
    panelOpen = want
    if (want) el('.personalize')?.click()
    else document.querySelector('[aria-label*="Kapat"]')?.click()
  }

  /** Arka plan DOM'dan sürülüyor: ayar nesnesi dışarıya açık değil. */
  const setBg = (id, dim, blur, grain) => {
    const img = el('.bg-img')
    if (img) {
      img.style.backgroundImage = 'url(' + BG(id) + ')'
      img.style.filter = blur ? 'blur(' + blur + 'px)' : 'none'
      img.style.inset = blur ? (-blur * 2) + 'px' : '0'
    }
    const d = el('.bg-dim')
    if (d) d.style.opacity = String(dim)
    const g = el('.bg-grain')
    if (g) g.style.display = grain ? '' : 'none'
  }

  const caption = (t, h, p, a) => {
    cap.style.opacity = String(a)
    cap.querySelector('h2').textContent = h
    cap.querySelector('p').textContent = p
  }
  const label = (h, p, a) => {
    bar.style.opacity = String(a)
    bar.querySelector('b').textContent = h
    bar.querySelector('span').textContent = p
  }

  window.__film = (t) => {
    const list = order()

    // ── 0–2.4  Açılış kartı ──
    if (t < 2.4) {
      const a = t < 0.5 ? ease(t / 0.5) : (t > 2.0 ? 1 - ease((t - 2.0) / 0.4) : 1)
      caption(t, 'Boş sekme yerine\\ngünün panosu', 'Alaturka Vakitler · Yeni Sekme', a)
    } else {
      caption(t, '', '', 0)
    }

    // ── 2.0–6.4  Widget'lar tek tek ──
    // Her kutu 0.22 sn arayla, 26px aşağıdan ve hafif küçükten.
    const start = 2.0
    const step = 0.22
    list.forEach((n, i) => {
      const p = ease((t - (start + i * step)) / 0.55)
      n.style.opacity = String(p)
      n.style.transform = 'translateY(' + ((1 - p) * 26).toFixed(1) + 'px) scale(' + (0.97 + p * 0.03).toFixed(3) + ')'
    })

    // ── 6.4–11.2  Arka plan ve filtre montajı ──
    // Kesmeler HIZLI: her biri 0.8 sn. Burada anlatılan şey tek tek
    // görseller değil, değiştirilebilir olması.
    // Sıra RENGE göre: arka arkaya iki orman konunca değişim fark
    // edilmiyordu. Kızıl → mavi → açık → kar → turuncu.
    const cuts = [
      ['39618458', 0.40, 0, true],
      ['32801432', 0.32, 0, true],
      ['39258975', 0.55, 6, true],
      ['35586639', 0.42, 0, true],
      ['33797168', 0.30, 12, false],
      ['34794613', 0.35, 0, true],
    ]
    if (t >= 6.4 && t < 11.2) {
      const k = Math.min(cuts.length - 1, Math.floor((t - 6.4) / 0.8))
      setBg(...cuts[k])
      label('Arka planı siz seçin', 'Hazır görseller ya da kendi fotoğrafınız · karartma, bulanıklık, ızgara',
        ease((t - 6.5) / 0.4) * (t > 10.8 ? 1 - ease((t - 10.8) / 0.4) : 1))
    } else if (t >= 11.2) {
      setBg('29524511', 0.45, 8, true)
    }

    // ── 11.4–16.0  Kişiselleştirme paneli ──
    setPanel(t >= 11.4 && t < 16.0)
    if (t >= 11.6 && t < 16.0) {
      label('Düzeni siz kurun', 'Widget’ları sürükleyin, istemediğinizi kapatın · kendi kısayol gruplarınız',
        ease((t - 11.6) / 0.4) * (t > 15.6 ? 1 - ease((t - 15.6) / 0.4) : 1))
      // Panel içinde bölümler sırayla açılıyor: hareketsiz bir panel
      // ekran görüntüsünden farksız olurdu.
      const heads = [...document.querySelectorAll('.grp-head')]
      const want = Math.floor((t - 11.8) / 1.1)
      if (want >= 0 && heads[want] && !window.__opened?.has(want)) {
        (window.__opened ??= new Set()).add(want)
        heads[want].click()
      }
    }

    // ── 16.2–18.4  Vakitler ve ayet ──
    if (t >= 16.2 && t < 18.6) {
      label('Gününüz, vaktiyle birlikte', 'Vakitler, hicri takvim ve günün ayeti · Diyanet verisiyle, 81 il',
        ease((t - 16.2) / 0.4) * (t > 18.2 ? 1 - ease((t - 18.2) / 0.4) : 1))
    } else if (t >= 11.2 && t < 11.6) {
      label('', '', 0)
    } else if (t >= 18.6) {
      label('', '', 0)
    }

    // ── 18.8–21  Kapanış ──
    if (t >= 18.8) {
      const a = ease((t - 18.8) / 0.6)
      caption(t, 'Alaturka Vakitler', 'Chrome Web Store’da — ücretsiz, reklamsız, izlemesiz', a)
    }
  }
})()`
}

// ── 8. YouTube filmi (isteğe bağlı) ──
//
// Slayt gösterisi DEĞİL. Önce beş durağan kareye yavaş yakınlaşma
// verildi ve ortaya bir ekran koruyucu çıktı: uygulamanın ne yaptığı
// değil, nasıl durduğu görünüyordu. Şimdi film kare kare uygulamanın
// ÜSTÜNDE oynuyor — widget'lar tek tek geliyor, arka plan ve filtreler
// arka arkaya değişiyor, ayarlar paneli açılıyor. Zaman Node'dan
// sürülüyor (`__film(t)`), yani her çalıştırmada birebir aynı kareler
// çıkıyor; gerçek zamanlı ekran kaydı değil.
if (want('--video') || filmOnly) {
  const FPS = 30
  const DUR = 21
  const FRAMES = join(OUT, '_kare')
  await rm(FRAMES, { recursive: true, force: true })
  await mkdir(FRAMES, { recursive: true })

  await seed(base({
    theme: 'dark', palette: 'klasik', surface: 'cizgi',
    bg: { image: '29524511', mode: 'foto', dim: 45, blur: 8, grid: false, grain: true },
    clock: { style: 'nokta', main: 'vasati', side: 'alaturka', weight: 200 },
    layout: { sol: ['analog', 'takvim', 'vakit'], sag: ['sistem', 'hava', 'ayet'], alt: [] },
  }))
  // 16:9: 1600×900 çizilip 1.2 ile 1920×1080 basılıyor.
  await viewport(1600, 900, 1.2)
  await send('Page.navigate', { url: BASE })
  await sleep(3000)

  // Sahne yönetimi SAYFADA: kare başına Node'dan JS göndermek her
  // karede bir tur gidiş-dönüş demek; tek bir fonksiyon kurulup
  // yalnızca zaman geçiliyor.
  await send('Runtime.evaluate', { expression: filmScript(), awaitPromise: true })

  const total = DUR * FPS
  for (let f = 0; f < total; f++) {
    const t = f / FPS
    await send('Runtime.evaluate', { expression: `window.__film(${t})` })
    const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 })
    await writeFile(join(FRAMES, `k${String(f).padStart(4, '0')}.jpg`), Buffer.from(r.result.data, 'base64'))
    if (f % 60 === 0) process.stdout.write(`  film ${Math.round((f / total) * 100)}%\r`)
  }

  const out = join(OUT, 'tanitim-1920x1080.mp4')
  const r = spawnSync('ffmpeg', ['-y', '-framerate', String(FPS),
    '-i', join(FRAMES, 'k%04d.jpg'),
    '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-crf', '18',
    '-movflags', '+faststart', out], { stdio: ['ignore', 'ignore', 'inherit'] })
  if (r.status === 0) {
    await rm(FRAMES, { recursive: true, force: true })
    console.log('✓ tanitim-1920x1080.mp4')
  }
}

// ── Kapat ──
ws.close()
chrome.kill()
server.close()
console.log(`\nHepsi: ${OUT}`)
