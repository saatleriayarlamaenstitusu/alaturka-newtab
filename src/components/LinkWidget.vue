<script setup>
/**
 * Bağlantı widget'ı — dinî / yapay zekâ / sosyal medya için ortak kabuk.
 *
 * İkonlar `BrandIcon` setinden gelir (minimal kontur). Bilinmeyen
 * sitelerde harf yedek; Google favicon ağa ve kırık kayıtlara bağlı
 * olduğu için kullanılmıyor.
 */
import BrandIcon from '@/ui/BrandIcon.vue'
import { brandKey } from '@/ui/brands.js'

defineProps({
  links: { type: Array, default: () => [] },
  /** Sıkışık düzen: ikon büyük, ad yok (yapay zekâ / sosyal rafı). */
  compact: { type: Boolean, default: false },
})

const initial = (name) => (name || '?').trim().charAt(0).toLocaleUpperCase('tr')
const known = (l) => !!brandKey(l.id, l.url)
</script>

<template>
  <nav class="lw-grid" :class="{ compact }">
    <a v-for="l in links" :key="l.id" class="lw-item" :href="l.url" :title="l.name">
      <span class="lw-ico">
        <BrandIcon :id="l.id" :url="l.url" :size="compact ? 24 : 22" />
        <span v-if="!known(l)" class="lw-letter">{{ initial(l.name) }}</span>
      </span>
      <span class="lw-name">{{ l.name }}</span>
    </a>
  </nav>
</template>

<style scoped>
.lw-grid { display: flex; flex-direction: column; gap: 0.2rem; }
.lw-grid.compact {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.35rem 0.25rem;
}

.lw-item {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.35rem 0.4rem;
  border-radius: 9px;
  color: var(--text-muted);
}

.lw-grid.compact .lw-item {
  flex-direction: column;
  gap: 0.3rem;
  width: 4.1rem;
  padding: 0.4rem 0.2rem;
}

.lw-item:hover { background: color-mix(in srgb, var(--text) 8%, transparent); color: var(--text); }

.lw-ico {
  position: relative;
  display: grid;
  place-items: center;
  width: 2.3rem;
  height: 2.3rem;
  border-radius: 9px;
  background: color-mix(in srgb, var(--text) 8%, transparent);
  color: var(--text);
  flex-shrink: 0;
}

.lw-grid.compact .lw-ico {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 12px;
}

.lw-ico :deep(svg) { position: relative; z-index: 1; }
.lw-letter { position: absolute; font-size: 0.78rem; color: var(--text-muted); }

.lw-name {
  font-size: 0.78rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lw-grid.compact .lw-name {
  max-width: 100%;
  font-size: 0.58rem;
  letter-spacing: 0.02em;
  text-align: center;
}
</style>
