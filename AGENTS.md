# Bu depoda çalışan yapay zekâ ajanları için

Chrome yeni sekme eklentisi (MV3 + Vue 3). Yayında:
<https://chromewebstore.google.com/detail/hknlkhdhepllicappjmgcliepnlljdcf/>

**Kurallar `alaturkavakitler/AGENTS.md`de** ve burada da geçerli:
commit atma (GPG), `npm ci` değil `npm install`, ölçmeden iddia etme,
sebebi koda yaz, iş bitince günlüğe yaz.

| Dosya | İçinde ne var |
|---|---|
| `README.md` | Mimari ve ölçülmüş kararlar (sitedeki `CLAUDE.md`nin karşılığı) |
| `docs/DEGISIKLIKLER.md` | Zaman sıralı mühendislik günlüğü — **her iş sonunda** |
| `docs/magaza.md` | Mağaza sayfası metinleri, izin gerekçeleri, yayın akışı |

## Bu depoya özel

- **Vakit ve hicri takvim kuralı burada değiştirilmez**; `alaturka-core`
  paketindedir. Site, masaüstü ve eklenti aynı paketi kullanıyor.
- **Arka plan kütüğü iki depoda birden duruyor**
  (`src/data/backgrounds.js` ve sitede aynısı). Biri değişirse öbürü de
  değişmeli.
- **Tanıtım metinleri bu depoda değil**:
  `alaturkavakitler/brand/social/metinler.txt`. Üretici
  (`scripts/magaza-gorseller.mjs`) oradan okuyor; depolar yan yana
  değilse yol `METINLER` ortam değişkeniyle verilir.
- Mağaza görsellerini basmak: `npm run magaza` (yalnız video için
  `--film`, derlemeyi atlamak için `--no-build`).
