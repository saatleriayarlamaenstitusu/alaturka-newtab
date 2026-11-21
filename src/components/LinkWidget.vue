<script setup>
/**
 * Bağlantı widget'ı — dinî bağlantılar ve yapay zekâ için ortak kabuk.
 *
 * İki ayrı bileşen yazmak, ikisinin zamanla ayrışması demekti: aynı
 * iş (ikon ızgarası), tek bileşen. Fark yalnızca veride ve `compact`
 * kipinde. Kart ve başlık `WidgetShell`in işi.
 */
defineProps({
  links: { type: Array, default: () => [] },
  /** Sıkışık düzen: ikon büyük, ad yok (yapay zekâ rafı böyle). */
  compact: { type: Boolean, default: false },
})

const host = (url) => { try { return new URL(url).hostname } catch { return '' } }
const icon = (url) => `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host(url))}`
const initial = (name) => (name || '?').trim().charAt(0).toLocaleUpperCase('tr')
</script>

<template>
  <nav class="lw-grid" :class="{ compact }">
      <a v-for="l in links" :key="l.id" class="lw-item" :href="l.url" :title="l.name">
        <span class="lw-ico">
          <img :src="icon(l.url)" alt="" width="20" height="20" loading="lazy" />
          <span class="lw-letter">{{ initial(l.name) }}</span>
        </span>
        <span v-if="!compact" class="lw-name">{{ l.name }}</span>
      </a>
  </nav>
</template>

<style scoped>
.lw-grid { display: flex; flex-direction: column; gap: 0.15rem; }
.lw-grid.compact { flex-direction: row; flex-wrap: wrap; gap: 0.4rem; }

.lw-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.35rem;
  border-radius: 8px;
  color: var(--text-muted);
}

.lw-item:hover { background: color-mix(in srgb, var(--text) 8%, transparent); color: var(--text); }

.lw-ico {
  position: relative;
  display: grid;
  place-items: center;
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 7px;
  background: color-mix(in srgb, var(--text) 8%, transparent);
}

/* Favicon gelmezse harf görünür: resim onun ÜSTÜNDE duruyor, yüklenmezse
   altındaki harf kalıyor — ayrı bir hata dinleyicisi gerekmiyor. */
.lw-ico img { position: relative; z-index: 1; }
.lw-letter { position: absolute; font-size: 0.72rem; color: var(--text-muted); }

.lw-name {
  font-size: 0.72rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
