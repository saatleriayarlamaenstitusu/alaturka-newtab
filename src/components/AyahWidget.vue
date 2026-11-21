<script setup>
import { computed } from 'vue'
import { ayahOfDay } from '@/data/ayahs'

/**
 * Günün ayeti.
 *
 * Meal Elmalılı Hamdi Yazır, İngilizcesi Pickthall — ikisi de
 * `data/ayahs.js` içinde, üretim betiğiyle quran.com'dan alındı.
 *
 * Ayetler ELLE seçilmiş bir listeden geliyor (`data/ayahs.js`) ve
 * gösterilen ayet GÜNE göre belirleniyor — rastgele değil: aynı gün
 * açılan her sekmede aynı ayet durur, ertesi gün değişir. Rastgele
 * seçim hem bağlamından kopmuş bir metin basma riski taşıyordu hem de
 * her sekmede değişen bir şey okunmuyor.
 */
const a = computed(() => ayahOfDay(new Date()))

/**
 * İki bağlantı: ayetin bizdeki sayfası ve Açık Kuran'daki sayfası.
 *
 * Açık Kuran'ın adres kalıbı `/{sure}/{ayet}` — `/sure/2/152` 404
 * veriyor (ölçüldü). Bizim adresimiz ayeti sayfasından hesaplıyor
 * (`?a=sure:ayet`), yani mushaf doğrudan o ayette açılıyor.
 */
const links = computed(() => [
  { id: 'av', label: 'Mushafta aç', url: `https://alaturkavakitler.com/kuran?a=${a.value.surah}:${a.value.verse}` },
  { id: 'ak', label: 'Açık Kuran', url: `https://acikkuran.com/${a.value.surah}/${a.value.verse}` },
])
</script>

<template>
  <div class="ay">
    <p class="ay-ar" dir="rtl" lang="ar">{{ a.ar }}</p>
    <p class="ay-tr">{{ a.tr }}</p>
    <!-- İngilizcesi ikincil: Türkçe meali okuyan için gürültü
         olmasın diye küçük ve soluk, ama paylaşırken elde dursun. -->
    <p v-if="a.en" class="ay-en" lang="en">{{ a.en }}</p>
    <div class="ay-foot">
      <span class="ay-ref">{{ a.name }} · {{ a.verse }}</span>
      <a v-for="l in links" :key="l.id" class="ay-link" :href="l.url">{{ l.label }}</a>
    </div>
  </div>
</template>

<style scoped>
.ay { display: flex; flex-direction: column; gap: 0.5rem; color: inherit; }

.ay-ar {
  margin: 0;
  /* Nesih: mushafın hattı. Sistem Arapça yazı tipi (Noto Sans
     Arabic) kûfi-grotesk karakterde ve ayet metni orada bir arayüz
     etiketine benziyor. */
  font-family: 'Scheherazade New', 'Amiri', serif;
  font-size: 1.45rem;
  line-height: 1.9;
  text-align: right;
  color: var(--text);
}

.ay-tr { margin: 0; font-size: 0.78rem; line-height: 1.6; color: var(--text-muted); }

.ay-en {
  margin: 0;
  font-size: 0.68rem;
  line-height: 1.55;
  color: var(--text-muted);
  opacity: 0.62;
}

.ay-foot {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
}

.ay-ref {
  flex: 1;
  font-size: 0.52rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted);
  opacity: 0.75;
}

.ay-link {
  font-size: 0.6rem;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}

.ay-link:hover { color: var(--text); border-color: var(--accent-ui); }
</style>
