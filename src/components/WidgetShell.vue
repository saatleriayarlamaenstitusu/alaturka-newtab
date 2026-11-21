<script setup>
import { settings } from '@/lib/settings'
import Icon from '@/ui/Icon.vue'

/**
 * Widget kabuğu.
 *
 * Üç şeyi tek yerde tutar: yüzey biçimi (buzlu / mat / çizgi / yok),
 * başlık şeridi ve ÜSTÜNE GELİNCE çıkan kapatma düğmesi. Kapatma
 * düğmesi sürekli görünse sayfa düğme tarlasına dönüyor; widget'lar
 * okunacak şeyler, tıklanacak değil.
 *
 * Başlık Swiss mikro tipografisi: 10px, büyük harf, geniş harf
 * aralığı, yanında ince bir çizgi. İçeriğin kendisi büyük yazılır;
 * başlık onu etiketler, onunla yarışmaz.
 */
defineProps({
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
  /** Kapatma düğmesi için widget kimliği; verilmezse düğme çıkmaz. */
  id: { type: String, default: '' },
})
const emit = defineEmits(['close'])
</script>

<template>
  <section class="w" :data-surface="settings.surface">
    <header v-if="title" class="w-head">
      <Icon v-if="icon" :name="icon" :size="12" />
      <span class="w-title">{{ title }}</span>
      <span class="w-rule" aria-hidden="true" />
    </header>
    <slot />

    <!-- Kapatma düğmesi başlık şeridinin İÇİNDE değil kartın köşesinde:
         başlıksız widget'larda (vakit, takvim, analog) şerit hiç
         çizilmiyor ve düğme onunla birlikte kayboluyordu. -->
    <button v-if="id" class="w-close" aria-label="Widget'ı kapat" @click="emit('close', id)">
      <Icon name="kapat" :size="12" />
    </button>
  </section>
</template>

<style scoped>
.w {
  position: relative;
  padding: 0.7rem 0.8rem 0.8rem;
  border-radius: 14px;
}

/* Yüzey biçimleri. "Buzlu" varsayılan: fotoğrafın üstünde yazı
   okunmalı ama fotoğraf da tamamen kapanmamalı. */
.w[data-surface='buzlu'] {
  border: 1px solid var(--border);
  background-color: color-mix(in srgb, var(--bg) 55%, transparent);
  backdrop-filter: blur(14px) saturate(120%);
}

.w[data-surface='mat'] {
  border: 1px solid var(--border);
  background-color: var(--bg);
  background-image: linear-gradient(var(--surface), var(--surface));
}

/* Çizgi: zemin yok, yalnızca ince bir çerçeve — fotoğrafı hiç
   örtmeyen en hafif biçim. */
.w[data-surface='cizgi'] {
  border: 1px solid var(--border);
  background: transparent;
}

.w[data-surface='yok'] { border: 1px solid transparent; background: transparent; padding-inline: 0; }

.w-head {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.55rem;
  color: var(--text-muted);
}

.w-title {
  font-size: 0.56rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.w-rule { flex: 1; height: 1px; background: var(--border); }

.w-close {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  display: grid;
  place-items: center;
  width: 1.1rem;
  height: 1.1rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.12s ease;
}

.w:hover .w-close, .w-close:focus-visible { opacity: 1; }
/* Zeminsiz biçimde kart dolgusuz; düğme içeri taşmasın. */
.w[data-surface='yok'] .w-close { right: 0; }

.w-close:hover {
  color: var(--text);
  background: color-mix(in srgb, var(--bg) 70%, transparent);
}
</style>
