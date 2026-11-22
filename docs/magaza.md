# Chrome Web Store'a yükleme

Bu dosya iki şey içeriyor: **nasıl yükleneceği** ve **mağaza sayfasının
metinleri**. Metinler olduğu gibi kopyalanabilir; incelemede en çok
takılınan yer metin değil **izin gerekçeleri**, o yüzden onlar da hazır.

## Yayında

Eklenti **22 Kasım 2026**'da yayımlandı:

- Mağaza sayfası: <https://chromewebstore.google.com/detail/hknlkhdhepllicappjmgcliepnlljdcf/>
- Öğe kimliği: `hknlkhdhepllicappjmgcliepnlljdcf` → `CWS_EXTENSION_ID`
- Mağazadaki ad: **Alaturka Yeni Sekme**

İlk yayın elle yapıldığı için aşağıdaki 1–3. bölümler artık bir kayıt;
bundan sonraki sürümler §4'teki akışla (etiket → GitHub Actions)
gidiyor. Metinler değiştiğinde yine buradan kopyalanır.

---

## 0. Önce bilinmesi gerekenler

- **Tek seferlik 5 USD geliştirici kaydı** var; hesap başına, eklenti
  başına değil.
- İlk yayın **elle** yapılır: API yeni bir öğe OLUŞTURAMIYOR. İlk zip
  panelden yüklenir, mağaza sayfası ve gizlilik sekmesi doldurulur.
  Sonraki sürümler GitHub Actions ile otomatik gidebilir (bkz. §4).
- İnceleme temiz bir başvuruda genelde birkaç iş günü; **ilk** yayın ve
  geniş izinler elle incelemeye düşürüp süreyi uzatıyor. Güncellemeler
  daha hızlı.
- **Gizlilik politikası URL'si zorunlu** (kullanıcı verisine dokunan her
  eklentide). Hazır ve yayında:

  ```
  https://alaturkavakitler.com/gizlilik/yeni-sekme
  ```

  **Site ve eklenti AYRI politikalara sahip** ve bu bilinçli: iki ürünün
  veri resmi farklı (sitede kıble için konum izni ve ayet vekili var,
  eklentide sık ziyaret edilen siteler ve işlemci/bellek ölçümü). Tek
  belge yazılsaydı mağaza incelemesi "burada anlatılan ürün bu değil"
  derdi — Chrome Web Store EKLENTİYİ anlatan bir belge istiyor. Sitenin
  politikası `alaturkavakitler.com/gizlilik` adresinde, ikisi birbirine
  bağlantı veriyor. Metinler site deposunda `src/data/privacy.js`.

---

## 1. Paketi üret

```bash
npm install
npm run build
npm run zip        # alaturka-newtab.zip
```

Zip'in **kökünde** `manifest.json` olmalı (klasörün kendisi
zipleNMEmeli). `npm run zip` bunu zaten böyle yapıyor.

Her yüklemede `public/manifest.json` içindeki `version` ARTMALI; aynı
sürüm numarasıyla ikinci yükleme reddediliyor.

---

## 2. İlk yayın (elle, bir kez)

1. https://chrome.google.com/webstore/devconsole — Google hesabıyla gir,
   5 USD kaydı yap.
2. **Yeni öğe** → `alaturka-newtab.zip`'i yükle.
3. **Mağaza sayfası** sekmesini §3'teki metinlerle doldur.
4. **Gizlilik** sekmesinde tek amaç beyanı + izin gerekçeleri (§3.6) ve
   gizlilik politikası adresi.
5. **Dağıtım**: Herkese açık / Türkiye + tüm ülkeler, ücretsiz.
6. **İncelemeye gönder**.

Yayınlandıktan sonra **Paket** sekmesinden `Öğe kimliği`ni (32 harf) ve
**Yayıncı → Ayarlar**'dan `Yayıncı kimliği`ni not et; otomasyon bunları
istiyor.

---

## 3. Mağaza sayfası metinleri

### 3.1 Ad (45 karakter sınırı)

```
Alaturka Vakitler — Yeni Sekme
```

### 3.2 Kısa açıklama (132 karakter sınırı)

Mağaza listesinde adın hemen altında duran tek satır. Özellik SAYMAZ —
listeyi zaten uzun açıklama veriyor; burada anlatılması gereken sekmeyi
açtığında ne olduğu.

```
Yeni sekmeniz günün panosu olsun: saat, namaz vakitleri, hicri takvim, ayet ve hava — sizin kurduğunuz düzende.
```

### 3.3 Ayrıntılı açıklama

```
Alaturka Vakitler Yeni Sekme (New Tab), tarayıcınızın yeni sekmesini günün
panosuna çevirir: saat, namaz vakitleri, hicri takvim, günün
ayeti, hava durumu, sistem kullanımı ve kendi kısayollarınız. Hepsi tek
ekranda, modern ve kişiselleştirilebilir bir tasarımla.

NELER VAR

• Alaturka saat: Son akşam ezanından geçen süre. Birincil ve ikincil
  saati seçebilirsiniz (alaturka / vasati), üç ayrı görünüm: sade,
  daktilo ve nokta matris.
• Namaz vakitleri: Diyanet verisiyle, 81 il. Geçen ve kalan süre,
  içinde bulunulan vakit.
• Vakit hatırlatması: Her vakte AYRI süre verilebilir. Yatsıya bir saat
  kala haber alıp öğle için başka bir süre seçebilirsiniz.
• Hicri takvim: Ay başlangıçları Diyanet'in yayımladığı tablodan; hicri
  gün akşam ezanıyla başlar (isteğe bağlı). Miladi, hicri ve birleşik
  görünüm.
• Günün ayeti: Nesih hattıyla birlikte Elmalılı Hamdi Yazır ve Pickthall
  meali.
• Hava durumu: Seçtiğiniz şehrin sıcaklığı ve üç günlük tahmin.
• Sistem kullanımı: Pil, işlemci ve bellek kullanımını yeni sekmenizde
  görün.
• Analog saat, not defteri, dinî / yapay zekâ / sosyal medya
  kısayolları: her biri ayrı widget.
• Kendi kısayol gruplarınız: Kendi başlığınız, kendi ikonunuz ve kendi
  bağlantılarınızla yeni bir grup oluşturun; o da ayrı bir widget olur.
• Arama: Google, Yandex, DuckDuckGo, Bing ya da Brave.
• Kısayollar: Sık ziyaret ettikleriniz otomatik gelir; kendi
  bağlantılarınızı ekleyip sıralayabilirsiniz.

ESNEK KİŞİSELLEŞTİRME İMKANI

Widget'ları sürükleyerek sola, sağa ya da aramanın altına taşıyın;
istemediğinizi kapatın. Hazır arka plan resimlerinden birini seçin ya da
kendi fotoğrafınızı yükleyin. Karartma, bulanıklık, ızgara ve gren gibi
ince ayarlar yapın. Görseli "mesh" kipine alırsanız arka plan,
fotoğrafın kendi renklerinden üretilmiş bir gradyana dönüşür: havası
kalır, ayrıntısı gider, yazı her zaman okunur.

Bütün ayarlarınızı tek dosyaya yedekleyip başka bir cihazda geri
yükleyebilirsiniz.

SADE, REKLAMSIZ VE GİZLİLİK DOSTU

Hesap yok, giriş yok, izleme yok, reklam yok. Ayarlarınız tarayıcının
kendi deposunda durur. Eklenti yalnızca iki adrese çıkar: namaz vakti
tablosu için GitHub, hava durumu için Open-Meteo. İkisine de kişisel
bilgi gönderilmez.

Alaturka Vakitler açık kaynaklıdır. Yaşadığınız sorunlar, destek ve
önerileriniz için GitHub'dan ya da info@alaturkavakitler.com adresinden
ulaşabilirsiniz.

https://github.com/saatleriayarlamaenstitusu/alaturka-newtab
Site: https://alaturkavakitler.com
```

### 3.4 Kategori ve dil

- Kategori: **Yaşam tarzı** (ikinci seçenek: Araçlar)
- Dil: **Türkçe**

### 3.5 Görseller

**Hepsi tek komutla üretiliyor:**

```bash
npm run magaza              # bütün görseller → magaza/
node scripts/magaza-gorseller.mjs --video   # ayrıca YouTube filmi
```

Görseller ELLE ÇİZİLMİYOR: her karede uygulamanın kendisi headless
Chromium'da çalışıyor (sitedeki `brand/social/render.mjs` ile aynı
gerekçe — taklit edilen bir arayüz, uygulama değiştikçe sessizce yalan
söylemeye başlıyor). Vakit tablosu ve hava durumu önbellek olarak
enjekte ediliyor, yani tanıtımda hep aynı hava ve aynı vakitler
görünüyor.

Üretilenler:

| Dosya | Ölçü | Nereye |
|---|---|---|
| `simge-128.png` | 128×128 | Mağaza simgesi |
| `01-genel.png` | 1280×800 | Ekran görüntüsü 1 — varsayılan düzen, fotoğraf arka plan |
| `02-acik-tema.png` | 1280×800 | Ekran görüntüsü 2 — açık tema, sade saat, hicri takvim |
| `03-mesh-izgara.png` | 1280×800 | Ekran görüntüsü 3 — mesh arka plan + ızgara, buzlu cam |
| `04-widgetlar.png` | 1280×800 | Ekran görüntüsü 4 — başka bir yerleşim, canlı palet |
| `05-ayarlar.png` | 1280×800 | Ekran görüntüsü 5 — kişiselleştirme paneli açık |
| `promo-440x280.jpg` | 440×280 | Küçük tanıtım kutusu |
| `promo-1400x560.jpg` | 1400×560 | Afiş (marquee) |
| `kolaj-1280x800.jpg` | 1280×800 | Widget kolajı |
| `ig-1…4-1080x1350.jpg` | 1080×1350 | Instagram 4:5 |
| `tanitim-1920x1080.mp4` | 1920×1080 | YouTube (yalnızca `--video`) — 19 sn, sessiz |

Film sessizdir; müzik ve seslendirme sonradan bindirilir. Kareler
kırpılmaz, yüksekliğe oturtulup iki yanı koyu zeminle doldurulur:
1280×800 (1.6:1) bir kareyi 16:9'a kırpmak üstteki ve alttaki
widget'ı yiyor.

`magaza/` gitignore'da: üretilen dosyalar depoda durmaz, komut her
çalıştığında tazelenir.

### 3.5.1 Görsellerin ölçü listesi

| Ne | Ölçü | Zorunlu mu |
|---|---|---|
| Mağaza simgesi | 128×128 PNG | evet |
| Ekran görüntüsü | 1280×800 (ya da 640×400) | en az 1, en çok 5 |
| Küçük tanıtım karesi | 440×280 | hayır ama öne çıkmak için gerekli |
| Marquee | 1400×560 | hayır |

Ekran görüntüsü önerisi (beşi de 1280×800):
1. Varsayılan düzen, fotoğraflı arka plan — her şeyin bir arada hâli.
2. Vakitler + sayaç yakın plan.
3. Takvim + günün ayeti.
4. Kişiselleştirme paneli açık (widget yerleşimi sürüklenirken).
5. Mesh arka plan + ızgara açık (farklı bir görünüm olduğu anlaşılsın).

### 3.6 Gizlilik sekmesi — hazır cevaplar

**Tek amaç beyanı:**

```
Tarayıcının yeni sekme sayfasını, alaturka saati, namaz vakitlerini ve
hicri takvimi gösteren kişiselleştirilebilir bir panele dönüştürmek.
```

**İzin gerekçeleri** (her biri ayrı kutuya):

| İzin                                          | Gerekçe                                                                                                                                                              |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                     | Kullanıcının ayarlarını (şehir, widget yerleşimi, arka plan, notu) ve namaz vakti tablosunu cihazda saklamak için. Hiçbir veri dışarı gönderilmez.                   |
| `topSites`                                    | Kişisel kısayol ızgarasında kullanıcının en sık ziyaret ettiği siteleri göstermek için. Liste yalnızca yeni sekme sayfasında görüntülenir, saklanmaz ve gönderilmez. |
| `system.cpu`                                  | İsteğe bağlı "Sistem" widget'ında işlemci kullanımını göstermek için. Widget kapatıldığında ölçüm de durur.                                                          |
| `system.memory`                               | Aynı widget'ta bellek kullanımını göstermek için.                                                                                                                    |
| `alarms`                                      | Namaz vakti hatırlatmalarını zamanlamak için. Yeni sekme sayfası yalnızca açıkken çalıştığından zamanlama arka plan hizmetinde yapılıyor.                            |
| `notifications`                               | Kullanıcının kendi açtığı vakit hatırlatmalarını göstermek için. Varsayılan olarak kapalıdır.                                                                        |

**Ana makine izni gerekçesi** formda AYRI bir kutudur ve iki adres için
TEK metin ister (her host'a ayrı alan verilmiyor; sınır 1000 karakter,
aşağıdaki metin 841). Olduğu gibi kopyala:

```
Eklenti yalnızca iki adrese istek atar; ikisi de bir widget'ın verisini getirmek içindir.

raw.githubusercontent.com — Namaz vakitleri widget'ı, Diyanet vakitlerinin tutulduğu açık veri deposundan seçili ilin tablosunu indirir. İstek yalnızca il plaka numarasını içerir (örn. 34.json) ve tablo cihazda önbelleğe alınır; her sekmede yeniden indirilmez.

api.open-meteo.com — Hava durumu widget'ı, kullanıcının ayarlardan seçtiği ŞEHRİN sıcaklığını ve üç günlük tahminini alır. İstek yalnızca şehir merkezinin enlem/boylamını içerir; cihaz konumu istenmez, konum izni sorulmaz. Yanıt en çok 30 dakika önbellekte tutulur.

Her iki isteğe de kişisel veri, kimlik, çerez veya anahtar eklenmez; hiçbir veri gönderilmez, yalnızca okunur. Daha dar bir kalıp mümkün değildir: GitHub yolu il sayısınca dosyaya, Open-Meteo ise sorgu dizesine dayanıyor.
```


**Uzaktan kod:** Hayır — bütün kod pakete dahil. Kullanıcının kendi
kısayol grupları ve ayar yedeği de cihazda kalır; yedek dosyası
tarayıcıda üretilir, hiçbir yere gönderilmez.
**Veri kullanımı:** Hiçbir kullanıcı verisi toplanmıyor/gönderilmiyor;
üç beyanın (satılmaz, amaç dışı kullanılmaz, kredi için kullanılmaz)
üçü de işaretlenir.

---

## 4. GitHub ile otomatik yayın

**Kısa cevap: evet, ama ilk yayından SONRA.** Chrome Web Store'un bir
HTTP API'si var ve GitHub Actions oradan sürüm geçebiliyor; yeni bir
öğe OLUŞTURAMIYOR, yalnızca var olanı günceller.

Depoda hazır akış: `.github/workflows/magaza.yml`. Bir sürüm etiketi
itildiğinde (`v0.4.0` gibi) derliyor, zipliyor, yüklüyor ve yayına
gönderiyor.

### 4.1 Kimlik bilgileri (bir kez)

1. Yayıncı hesabında **iki adımlı doğrulama** açık olmalı.
2. Google Cloud Console → proje aç → **Chrome Web Store API**'yi etkinleştir.
3. OAuth onay ekranı: **Harici**, kendi e-postanı **test kullanıcısı**
   olarak ekle (uygulama doğrulaması gerekmez).
4. **OAuth istemci kimliği** oluştur, tür **Web uygulaması**, yetkili
   yönlendirme adresi: `https://developers.google.com/oauthplayground`.
   İstemci kimliği ve gizli anahtarı sakla.
5. OAuth Playground'da "Use your own OAuth credentials"ı işaretle,
   kapsam olarak `https://www.googleapis.com/auth/chromewebstore` ver,
   yetkilendir ve **yenileme anahtarını** (refresh token) al.

### 4.2 GitHub deposuna eklenecek sırlar

`Settings → Secrets and variables → Actions`:

| Sır                 | Nereden                     |
| ------------------- | --------------------------- |
| `CWS_CLIENT_ID`     | OAuth istemcisi             |
| `CWS_CLIENT_SECRET` | OAuth istemcisi             |
| `CWS_REFRESH_TOKEN` | OAuth Playground            |
| `CWS_PUBLISHER_ID`  | Panel → Yayıncı → Ayarlar   |
| `CWS_EXTENSION_ID`  | Panel → öğe → Paket sekmesi |

### 4.3 Sürüm çıkarmak

```bash
# public/manifest.json içindeki "version" artırılır
git commit -am "sürüm 0.4.0"
git tag v0.4.0
git push origin main --tags
```

Akış çalışır, zip'i yükler ve yayına gönderir. **İnceleme yine var** —
otomasyon gönderiyi hızlandırmaz, yalnızca elle zip yüklemeyi ortadan
kaldırır.

### 4.4 Tuzaklar

- Sürüm artmamışsa yükleme reddedilir.
- Erişim anahtarı 1 saatte doluyor; akış her çalışmada yenileme
  anahtarından taze bir tane alıyor.
- Panelden görünürlüğü elle değiştirdiysen, API yayınlamadan önce bir
  kez elle yayınlaman gerekiyor.
- Zip 2 GB'ı aşamaz (bizim paket ~1 MB).
