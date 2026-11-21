<script setup>
import { settings } from '@/lib/settings'

/**
 * Not.
 *
 * Tek bir metin kutusu; kaydet düğmesi yok — yazdığın an ayarlarla
 * birlikte saklanıyor. "Kaydet"e basmayı unutup kaybetmek, bir yeni
 * sekme defterinde olabilecek en kötü şey.
 */
</script>

<template>
  <textarea
    v-model="settings.note"
    class="nt"
    rows="4"
    spellcheck="false"
    placeholder="Bir şeyler yaz…"
    aria-label="Not"
  />
</template>

<style scoped>
.nt {
  width: 100%;
  resize: vertical;
  min-height: 4.5rem;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 0.8rem;
  line-height: 1.6;
  outline: none;
}

.nt::placeholder { color: var(--text-muted); opacity: 0.7; }
</style>
