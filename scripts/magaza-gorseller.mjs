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
import { createReadStream, existsSync } from 'node:fs'
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
const CARDS = [
  { file: 'promo-440x280.jpg', w: 440, h: 280, kind: 'kucuk', shot: '01-genel.png',
    title: 'Alaturka Vakitler', sub: 'Yeni Sekme' },
  { file: 'promo-1400x560.jpg', w: 1400, h: 560, kind: 'genis', shot: '01-genel.png',
    title: 'Yeni sekmeniz\ngüne açılsın',
    sub: 'Alaturka saat · namaz vakitleri · hicri takvim · günün ayeti · hava durumu' },
  { file: 'ig-1-1080x1350.jpg', w: 1080, h: 1350, kind: 'dikey', shot: '01-genel.png',
    title: 'Boş sekme yerine\ngünün panosu', sub: 'Alaturka Vakitler · Yeni Sekme' },
  { file: 'ig-2-1080x1350.jpg', w: 1080, h: 1350, kind: 'dikey', shot: '02-acik-tema.png',
    title: 'Her şey\nsizin kurduğunuz yerde', sub: 'Widget’ları sürükleyin, arka planı değiştirin, kendi fotoğrafınızı yükleyin' },
  { file: 'ig-3-1080x1350.jpg', w: 1080, h: 1350, kind: 'dikey', shot: '03-mesh-izgara.png',
    title: 'Gününüz,\nvaktiyle birlikte', sub: 'Vakitler, hicri takvim ve günün ayeti · Diyanet verisiyle, 81 il' },
  { file: 'ig-4-1080x1350.jpg', w: 1080, h: 1350, kind: 'dikey', shot: '05-ayarlar.png',
    title: 'Sade, reklamsız\nve gizlilik dostu', sub: 'Hesap yok, giriş yok, izleme yok' },
  { file: 'kolaj-1280x800.jpg', w: 1280, h: 800, kind: 'kolaj', shot: '04-widgetlar.png',
    title: 'Ekranınızda ne varsa\nsiz koydunuz', sub: 'Vakitler · takvim · hava · sistem · ayet · not · kendi kısayol gruplarınız' },
]

const cardHtml = (c, uri) => `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<style>
  /* İKİ ALT KÜME birden. Yalnızca latin-ext yüklenmişti ve o altküme
     TEMEL LATİN harflerini taşımıyor: başlıkların neredeyse tamamı
     sessizce sistem yazı tipine düşüyordu (kalınlık değişiyordu ama
     harfler Inter Tight değildi). Aralıklar base.css'ten birebir. */
  @font-face {
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
  }
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
      <h1 style="font-size:31px">${c.title}</h1>
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
      <h1 style="font-size:58px">${c.title}</h1>
      <p style="font-size:23px;margin-top:18px;line-height:1.5">${c.sub}</p>
    </div>
    <div class="shot" style="flex:1"><img src="${uri}"></div>
  </div>` : ''}
${c.kind === 'dikey' ? `
  <div class="inner" style="flex-direction:column;justify-content:space-between;padding:84px 72px 72px">
    <div class="txt">
      <h1 style="font-size:76px">${c.title}</h1>
      <p style="font-size:30px;margin-top:26px;line-height:1.45">${c.sub}</p>
    </div>
    <div class="shot" style="margin-top:56px"><img src="${uri}"></div>
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
