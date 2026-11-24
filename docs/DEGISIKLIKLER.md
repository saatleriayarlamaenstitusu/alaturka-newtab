# Değişiklik günlüğü (mühendislik)

En yeni en üstte. Şablon ve gerekçe için
`alaturkavakitler/docs/DEGISIKLIKLER.md`e bak; aynı biçim.

## Devam eden

Yok.

---

### 2026-11-24 — Sürüm 0.4.0 ve GitHub Release adımı
**Ne:** Manifest sürümü 0.4.0. Etiket itilince akış artık GitHub Release de oluşturuyor (zip ekli), sonra mağazaya yükleyip yayına gönderiyor.
**Dosyalar:** public/manifest.json, .github/workflows/magaza.yml, docs/magaza.md
**Neden:** Akış yalnızca mağazaya yüklüyor ve artifact bırakıyordu — GitHub'da release oluşmuyordu (ölçüldü: `git tag` boş, `gh release list` boş, akış hiç çalışmamış). Beş CWS sırrı tanımlı (`gh secret list` ile ölçüldü) ama yükleme yolu hiç denenmemiş durumda; ilk etiket gerçek sınav.
**Etkisi:** Release adımı mağaza adımlarından ÖNCE ve yalnızca etiket itildiğinde çalışıyor (`workflow_dispatch`te dal adı release adı olamaz). `permissions: contents: write` eklendi. Etiket ile manifest sürümü birebir eşleşmeli, yoksa akış duruyor.

### 2026-11-24 — Hazır bağlantı listeleri kısaltıldı
**Ne:** Varsayılan gruplar dörder bağlantı: Sosyal → X, Instagram, YouTube, WhatsApp. Google → Gmail, Docs, Drive, Maps. Yapay zekâ → Claude, ChatGPT, Gemini, Perplexity.
**Dosyalar:** src/lib/settings.js, README.md
**Neden:** İlk açılışta gelen liste katalog gibi duruyordu (Google 9, sosyal 6, yapay zekâ 6 bağlantı) ve yan kolonda fazladan satırlar tutuyordu. Google araması ile YouTube iki yerde birden duruyordu: arama ortadaki kutuda, YouTube sosyal medyada.
**Etkisi:** Yalnızca VARSAYILAN değişti; kayıtlı ayarlar varsayılanların üstüne oturduğu için kurulu kullanıcıların listesi olduğu gibi kalır. Görmek için ayarlarda grubun "Hazır listeye dön" düğmesi. Çıkan bağlantıların ikonları `ui/brands.js`te bırakıldı — kullanıcı elle eklerse ikonu yine gelsin. Mağaza görselleri bu listelerle basılıyor (`npm run magaza`), yeniden basılmadı.

### 2026-11-24 — Takvim başlığı sabit genişlikte
**Ne:** Ay adı/yılı sabit genişlikte bir alanda ortalanıyor; ay değiştikçe oklar yerinde duruyor.
**Dosyalar:** src/components/MonthWidget.vue, README.md
**Neden:** Başlık kendi genişliğindeydi ve ay adına göre uzayıp kısalıyordu (ölçüldü: "Kasım 2026" 68.7px, "Cemaziyelevvel 1448" 122.2px) — oklar kayıyor, uzun hicri adlarda görünüm anahtarının üstüne taşıyordu. Gezinti kalan yerin tamamını alıp üç sütunlu ızgara oldu (ok | başlık | ok), punto 0.78 → 0.7rem, anahtar dolgusu 0.45 → 0.35rem.
**Etkisi:** Ölçüldü: üç ayrı ayda (Cemaziyelahir, Cemaziyelevvel, Rebiülahir 1448) oklar hep 235.8 ve 400px'te, başlık kutusu hep aynı, taşma yok. Sığmayan ad üç noktalı kısalır (güvenlik ağı).

### 2026-11-24 — Marka işareti ızgarayı deliyor
**Ne:** Izgara açıkken çizgiler marka işaretinin üstünden geçmiyor; işaret de öbür kutular gibi delik açıyor. İşaret ayrıca sayfa merkezine oturdu.
**Dosyalar:** src/components/BackgroundLayer.vue, src/components/LogoMark.vue, README.md
**Neden:** İşaret zeminsiz duruyor (hover'da bile zemin yok), bu yüzden çizgi doğrudan üstünden geçiyordu — öbür kutuların yarı saydam zemini çizgiyi bastırıyor. `.lm` dolgu listesi `HOLES`te yoktu. Ayrıca dolgu asimetrikti (sol 20px, sağ 0) ve işaret merkezden 10.5px sağda duruyordu (ölçüldü: işaret merkezi 650.5, sayfa merkezi 640).
**Etkisi:** Ölçüldü: delikten sonra işaretin merkez hattında tuvalde 0 çizgi pikseli, 120px altında aynı x aralığında 1; işaret merkezi artık 640.

### 2026-11-24 — Pilde uyarı yönü ters çevrildi
**Ne:** %100 pilde ölçeğin TAMAMI beyaz. Kırmızı artık pilde %15'in ALTINDA yanıyor (bitmek üzere), işlemci/bellekte eskisi gibi son %15'te (dolmak üzere).
**Dosyalar:** src/components/SystemWidget.vue, README.md
**Neden:** "Son %15 kırmızı" kuralı üç satıra da aynı uygulanıyordu; pilde dolmak İYİ bir şey, kırmızı "pil dolu, tehlike" diyordu. Kullanıcının asıl şikâyeti buydu (bir önceki maddedeki renk düzeltmesi yetmemişti). Ölçüldü: pil %100 → 20 yanan, 0 kırmızı; pil %8 → 2 yanan, 2 kırmızı; işlemci %95 → 2 kırmızı; bellek %95 → 2 kırmızı.
**Etkisi:** Satırda `low` bayrağı var; `isHot(r, i)` yönü oradan okuyor. Yeni bir gösterge eklenirken uyarı yönü seçilmeli.

### 2026-11-23 — Takvimde ay gezintisi, gün noktaları ve gün künyesi
**Ne:** Aylık takvimde ay ileri/geri değiştirilebiliyor ("Bugüne dön" ile geri geliniyor). Dinî günler ve millî bayram/tatiller günün altında NOKTA ile işaretli (yeşil dinî, kırmızı millî), ayın günleri ızgaranın altında listeleniyor; bir güne dokununca o günün künyesi ve etkinliği açılıyor.
**Dosyalar:** src/components/MonthWidget.vue, src/data/holidays.js (yeni), README.md
**Neden:** Takvim yalnızca içinde bulunulan ayı gösteriyordu; ileriye bakılamıyordu. Dinî gün işareti ince bir çizgiydi ve hangi gün olduğu hiç yazmıyordu. Millî tatil verisi hiçbir depoda yoktu (ölçüldü: core ve site grep'i boş).
**Etkisi:** Millî günler `data/holidays.js`te (yedi sabit miladi gün); dinî taraf çekirdekten `holyDaysBetween` ile geliyor, kural iki yerde yaşamıyor. Site de bu listeyi isterse çekirdeğe taşınmalı. Nokta renkleri SABİT (aksan değil): aksan yatsıda #2e3b83 ve koyu zeminde kayboluyor. Geçmişlik artık gün numarasından değil tarihten hesaplanıyor — gezintide başka ayın 3'i bugünün 23'ünden önce gelebiliyor. Ölçüldü: Ekim 2026'da 1 nokta (29 Ekim), Recep 1448'de 3 (Regaip 10 Aralık, Yılbaşı 1 Ocak, Miraç 4 Ocak) — hicri ayın içindeki miladi gün de yakalanıyor.

### 2026-11-23 — Açık/koyu tema ve arka plan aydınlatması
**Ne:** Sayfanın altında tema düğmesi (güneş/ay) var; açık temada arka plan örtüsü karartma yerine AYDINLATMA oluyor ve sürgünün adı da öyle. Fotoğraf açıkken açık tema artık gerçekten çalışıyor.
**Dosyalar:** src/lib/theme.js (yeni), src/App.vue, src/assets/base.css, src/components/BackgroundLayer.vue, src/components/SettingsPanel.vue, src/ui/Icon.vue, README.md
**Neden:** `data-photo='on'` renkleri HER temada koyuya sabitliyordu; açık tema fotoğraf açıkken hiç uygulanmıyordu. Örtü hep siyahtı, açık temada koyu yazı siyah örtüye düşüyordu. Etkin tema yalnızca App.vue'de hesaplanıyordu ve 'auto' modda sistem tercihi canlı izlenmiyordu. Ölçüldü: açık temada örtü rgb(255,255,255) opaklık 0.57, yazı #121214; koyuda örtü rgb(0,0,0) opaklık 0.45, yazı #fff.
**Etkisi:** Etkin tema tek kaynakta (`lib/theme.js` `isDark`); arka plan, ayarlar ve sistem göstergesi oradan okuyor. Örtünün taban puanı yöne bağlı: koyuda AÇIK görsel, açıkta KOYU görsel +12. Izgara çizgisi de temaya göre.

### 2026-11-23 — Favicon gelmeyince küre
**Ne:** Faviconu olmayan kısayollarda servisin bulanık yer tutucusu yerine uygulamanın kendi küre ikonu çiziliyor.
**Dosyalar:** src/components/ShortcutGrid.vue, src/ui/Icon.vue, README.md
**Neden:** `error` olayı hiç düşmüyordu: servis favicon bulamadığında 404 dönüyor ama gövdesinde 16×16 yer tutucu gönderiyor ve tarayıcı onu başarıyla yüklüyor (ölçüldü: example.com ve olmayan alan adı → `complete: true`, `naturalWidth: 16`). Arkadaki harf bu yüzden hiç görünmüyordu.
**Etkisi:** Ayırt eden ölçü BOY: yer tutucu istenen boydan bağımsız hep 16 (sz=64 ve 128'de de 16), gerçek faviconlar 18–128 (github 32, HN 18, youtube 64/128). 16 ve altı "yok" sayılıyor. Bilinen sınır: gerçek faviconu 16×16 olan site de küreye düşer; CORS kapalı olduğu için piksel karşılaştırması yapılamıyor, host izni eklemek mağazada yeni izin uyarısı demek.

### 2026-11-23 — Pil ölçeğinde "boş" görünen son üç çubuk
**Ne:** %100 pilde son üç çubuk artık görünüyor; renk sabit kırmızı.
**Dosyalar:** src/components/SystemWidget.vue
**Neden:** `.bar.hot` `var(--primary)` kullanıyordu; yatsıda bu #2e3b83 ve koyu kartta kontrast 1.9:1 (yanan beyaz çubuk 16:1) — çubuklar "renkli ama boş kutu" gibi okunuyordu. Yorum zaten "kırmızı" diyordu, kod aksanı kullanıyordu. Ölçüldü: önce rgb(46,59,131), sonra rgb(255,107,107).
**Etkisi:** Açık tema kırmızısı (#d92d20) yalnızca fotoğraf KAPALIYKEN: fotoğraf açıkken zemin koyuya sabitleniyor, tema etiketi 'light' olsa da.

### 2026-11-23 — Logo hover'da zemin yok
**Ne:** Marka işaretinin üstüne gelince arkasına şerit gelmiyor; yalnızca işaretin kendisi aydınlanıyor.
**Dosyalar:** src/components/LogoMark.vue
**Neden:** Hover zemini işareti bir düğmeye çeviriyordu; işaret sayfanın üstünde serbest duruyor.
**Etkisi:** —

### 2026-11-23 — Arama motoru seçicisi kısayolların altında kalıyordu
**Ne:** Açılır motor listesi artık kısayol ızgarasının üstünde.
**Dosyalar:** src/components/SearchBar.vue, README.md
**Neden:** `.search`teki `backdrop-filter` kendi yığılma bağlamını kuruyor; seçicinin `z-index: 20`si kutunun içinde hapsoluyordu ve kardeş ızgaranın konumlu çocukları (`z-index: 1`) üstüne boyanıyordu. Ölçüldü: 20 kısayolla `elementFromPoint` listenin ortasında favicon `<img>`, alt ucunda kısayol `<a>` döndürüyordu; düzeltmeden sonra üç noktada da `opt`.
**Etkisi:** `.search`e `position: relative; z-index: 3` verildi — ayarlar paneli 50, marka/alt düğme 5, ikisinin de altında.

### 2026-11-23 — Ajan belgeleri
**Ne:** `AGENTS.md` ve bu günlük eklendi.
**Dosyalar:** AGENTS.md (yeni), docs/DEGISIKLIKLER.md (yeni)
**Neden:** Depoda hiçbir ajan belgesi yoktu; kuralları göremeden
çalışılıyordu.
**Etkisi:** —

### 2026-11-22 — Mağaza ve sosyal görseller
**Ne:** Instagram kareleri kırpılmıyor; widget tahtası (`ig-5`) eklendi;
ilk kareye ve tahtaya mağaza rozeti + desteklenen tarayıcı listesi geldi.
**Dosyalar:** scripts/magaza-gorseller.mjs, docs/magaza.md
**Neden:** Kapak %124'e büyütülüp taşırılıyordu ve kenardaki widget'lar
kesiliyordu — eklentinin anlattığı şey tam da o widget'lar. Tahtada
`column-count` kolonlar dolunca yana yeni kolon açıyor ve on bir
widget'ın yedisi kartın dışında kalıyordu.
**Etkisi:** Tahtada kesitler saydam zeminle alınıyor (sayfa arka planı
gizlenip `setDefaultBackgroundColorOverride` saydama çekiliyor). Kolon
sayısı üç aday denenip ölçülerek seçiliyor. Metinler
`metinler.txt`teki `[eklenti/*]` bölümlerinden.

### 2026-11-22 — Mağazada yayın
**Ne:** Eklenti yayımlandı; öğe kimliği `hknlkhdhepllicappjmgcliepnlljdcf`.
**Dosyalar:** docs/magaza.md
**Neden:** —
**Etkisi:** Sonraki sürümler etiket → GitHub Actions akışıyla gidebilir;
`CWS_EXTENSION_ID` bu kimliktir.
