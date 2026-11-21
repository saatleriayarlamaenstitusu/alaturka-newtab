# alaturka-newtab

Chrome yeni sekme eklentisi: her yeni sekmede alaturka saat, namaz
vakitleri ve hicri takvim.

## Kurulum (geliştirme)

```bash
npm install
npm run dev      # normal sekmede, hızlı geliştirme için
npm run build    # dist/ üretir
```

Chrome'a yüklemek: `chrome://extensions` → Geliştirici modu →
**Paketlenmemiş öğe yükle** → `dist/` klasörünü seç.

## Kararlar

- **Hesaplar `@alaturkavakitler/core`'dan.** Vakit tablosu, alaturka
  saat, hicri takvim ve dinî günler sitede ne ise burada da o. İkinci
  bir kopya kural tutulmuyor; sitede kuralların iki yerde yaşayıp
  ayrışması bir kez yaşandı.
- **Yeni sekme ağ beklemez.** Vakit tablosu `chrome.storage`dan okunup
  hemen gösteriliyor, tazeleme arka planda. Sekme her açılışta ağa
  çıksaydı bir an boş görünürdü.
- **Depo katmanı iki yerde çalışır** (`src/lib/storage.js`): eklentide
  `chrome.storage.local`, `npm run dev`de `localStorage`. Böylece
  eklentiyi her değişiklikte yeniden yüklemek gerekmiyor.
- **Ayarlar ayrı bir sayfa değil**, yeni sekmenin üstüne açılan bir
  panel: yapılan ayarın sonucu aynı ekranda görünmeli.
- **Tema sitenin kalıbı**: `data-theme` × `data-palette` × `data-vakit`
  özniteliklerine yazılır, arayüz vurguları `--primary` değil
  `--accent-ui` kullanır.
- Arama kutusuna adres benzeri bir metin girilirse (nokta var, boşluk
  yok) arama yerine doğrudan o adrese gidilir.

## Düzen

Omurga ORTADADIR: saat ve tarih tek blok (telefon widget'ları gibi),
altında arama, altında kişisel kısayollar ve isteğe bağlı widget'lar.
Yanlardaki iki kolon widget içindir ve hangi widget'ın nerede
duracağı ayardan gelir — her widget `sol`, `sağ`, `aramanın altı` ya
da `kapalı` olabilir (`settings.layout`). 900px altında tek kolona
iner.

Widget'ın üstüne gelince sağ üstünde bir **×** çıkar: kapatmak onu
`kapalı` yapar, ayarlara gitmeye gerek kalmaz. Sürekli görünen bir
düğme sayfayı düğme tarlasına çeviriyordu.

İlk açılışta bu düzen hazır gelir: solda analog saat, hicri takvim,
vakitler ve hava; sağda sistem, sosyal medya, yapay zekâ ve günün
ayeti; aramanın altında not. Şehir Düzce, saat nokta matris biçiminde
ve ana saat vasati. Kayıtlı ayarlar varsayılanların ÜSTÜNE oturur;
yani bu düzen yalnızca ilk kurulumda görünür, sonradan değiştirilen
ayarlar korunur.

Marka işareti üstte ortada, **Kişiselleştir** düğmesi (ikon + yazı)
altta ortada durur; ikisi de sabittir ve widget kolonlarına karışmaz.

## Widget'lar

- **Vakitler** — altı vakit YAN YANA, her sütunda ad üstte saat
  altta; üstte bir sonraki vakte sayaç. Alt alta liste denendi:
  okunuyordu ama widget'ı gereksiz uzatıyor, yanındaki takvimle
  birlikte sol kolon ekranı dolduruyordu. İçinde bulunulan vakit
  üstündeki aksan çizgisiyle, geçmişler soluklukla işaretlenir.
- **Takvim** — rakamlı ızgara; **miladi/hicri** seçilebilir. Nokta
  ızgarası denendi ve bırakıldı: ay bir bakışta okunuyordu ama
  "bugün ayın kaçı", "cuma hangi gün" sorularına cevap vermiyordu —
  noktalar güzeldi, takvim değildi.
- **Sistem** — pil, işlemci, bellek; çentikli ölçekler. Halka
  denendi ve bırakıldı: yüzdeyi ortadaki rakamdan okumak gerekiyordu,
  yani halka süstü. `chrome.system.cpu` **anlık yüzde vermez**,
  biriken kene sayılarını verir; yüzde iki ölçümün farkından çıkar.
- **Günün ayeti** — elle seçilmiş 43 ayet (`src/data/ayahs.js`,
  `scripts/export-ayahs.js` ile quran.com'dan üretildi, meal Diyanet).
  Gösterilen ayet GÜNE göre belirlenir, rastgele değil. Metin NESİH
  hattıyla (Scheherazade New, eklentiye paketli): sistemin Arapça
  yazı tipi kûfi-grotesk karakterde ve ayet orada arayüz etiketine
  benziyor. İki bağlantı var — ayetin mushaftaki sayfası
  (`alaturkavakitler.com/kuran?a=sure:ayet`) ve Açık Kuran. Açık
  Kuran'ın kalıbı `/{sure}/{ayet}`; `/sure/2/152` 404 veriyor
  (ölçüldü).
- **Not** — tek metin kutusu, kaydet düğmesi yok (yazdığın an saklanır).
- **Analog saat** — ayrı widget; kadran alaturka da olabilir.
- **Dinî**, **Yapay zekâ**, **Sosyal medya** — üçü de tek bileşenden
  (`LinkWidget`); fark veride ve `compact` kipinde.
- **Hava durumu** — ölçüm değil BAĞLANTI: gerçek veri bir API anahtarı
  ve her açılışta bir istek demek, eklentinin kuralı ise "yeni sekme
  ağ beklemez".
- **Kişisel kısayollar** iki kaynaktan birleşir: kendi eklediklerin
  (başta, sürüklenerek sıralanır) ve `chrome.topSites`. **Sabitlemek**,
  tarayıcıdan geleni kendi listene taşımaktır.

## Saat

Üç biçim: `sade` (ince grotesk), `mono` (daktilo), `nokta` (nokta
matris — rakamlar 5×7 ızgarada noktalarla çizilir, eklentiye font
paketlemeden). Büyük saat ve yanındaki ikincil saat ayrı ayrı seçilir
(alaturka/vasati), ikincisi kapatılabilir. Tarih satırları saatin
altında: hicri önce, miladi soluk, dinî gün varsa aksan rozetiyle.

## Arka plan

Hazır görseller kendi CDN'imizden (`src/data/backgrounds.js`; aynı
kütük sitede de var, biri değişirse öbürü de değişmeli). Üç biçim:
**fotoğraf**, **mesh gradyan** (görselin KENDİ renklerinden; renkler
kütükte önceden duruyor, çalışma anında tuvale çizip okumak eklenti
kökeni CDN'in CORS listesinde olmadığı için çalışmıyor) ve **yok**.
Üstünde karartma, bulanıklık, ızgara, gren. Sıra önemli: gren ve
ızgara karartmanın ÜSTÜNDE, yoksa karartma onları da söndürüyor.

Widget zemini ayrı bir ayar: buzlu cam / mat / yalnız çerçeve /
zeminsiz.

Fotoğraf açıkken renk belirteçleri koyuya sabitlenir: açık temada
beyaz yazı beyaz karta düşüyordu.

## Arayüz kuralları

- **Yerel `select` ve `checkbox` kullanılmıyor** (`ui/Select.vue`,
  `ui/Switch.vue`). Yerelinin açılır listesi işletim sisteminin kendi
  penceresidir: koyu arayüzde beyaz yazı beyaz zemine düşüp
  okunmuyordu, bir de her platformda başka göründüğü için düzenin
  içinde yamalı duruyordu. Seçicide liste 12'yi geçince arama alanı
  kendiliğinden açılır (81 il bir listede taranmıyor).
- **Ayarlar gruplu ve ikonlu**, sağdan açılan bir sütun: ayar
  değiştikçe sayfanın kendisi görünür kalır. Gruplar katlanır.
- Mikro tipografi: 10–11px, büyük harf, geniş harf aralığı, yanında
  ince çizgi. İçerik büyük yazılır, etiket onunla yarışmaz.
- **Marka işareti uydurulmaz**: `LogoMark.vue` sitenin gerçek
  logosunun yollarını taşır (`ui/LogoMotion.vue` ile aynı), satır içi
  ve `currentColor` ile.
- Arama motoru kutunun İÇİNDE, sağ uçta.

## Vakit hatırlatması

`public/background.js` (MV3 servis çalışanı) + `chrome.alarms`:
bildirim tarayıcı başka sayfadayken de gelir. Tek alarm kurulur ve her
çalışmada bir SONRAKİ hatırlatmaya göre yeniden kurulur — altı vakit
için altı alarm, ayar değişince hepsini temizlemek demekti. Veri
sayfanın önbelleğinden okunur (`chrome.storage.local`), servis
çalışanı ağa çıkmaz.

## Çekirdekteki iki ad tuzağı

`nowHijri('object')` günü **`date`** alanında, `toHijri()` ise
**`day`** alanında veriyor. `CITIES` bir dizi değil, plakaya göre
anahtarlanmış bir **nesne** (`Object.values(CITIES)`).

## Yapılacaklar

Ana depodaki `ROADMAP.md` içinde "Chrome yeni sekme eklentisi"
maddesine bakınız: arka plan görselleri (Pexels), palet seçimi,
mağazaya gönderim.
