<script setup>
import { computed } from 'vue'
import { settings } from '@/lib/settings'
import Icon from '@/ui/Icon.vue'

/**
 * Hava durumu — ÖLÇÜM DEĞİL, bağlantı.
 *
 * Gerçek hava verisi bir API anahtarı ve her açılışta bir istek
 * demek; eklentinin kuralı "yeni sekme ağ beklemez". Bu yüzden
 * widget, seçili şehrin hava durumu sayfasını tek dokunuşla açan bir
 * kısayol — sayısını merak eden zaten oraya gidiyor.
 */
const city = computed(() => settings.city.name)
const links = computed(() => [
  { id: 'mgm', label: 'Meteoroloji', url: `https://www.mgm.gov.tr/?il=${encodeURIComponent(toTitle(city.value))}` },
  { id: 'goog', label: 'Google', url: `https://www.google.com/search?q=${encodeURIComponent(city.value + ' hava durumu')}` },
])

function toTitle(s) {
  return s.toLocaleLowerCase('tr').replace(/(^|\s|-)([a-zçğıöşü])/g, (m) => m.toLocaleUpperCase('tr'))
}
</script>

<template>
  <div class="we">
    <Icon name="hava" :size="26" />
    <div class="we-body">
      <span class="we-city">{{ city }}</span>
      <div class="we-links">
        <a v-for="l in links" :key="l.id" :href="l.url">{{ l.label }}</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.we { display: flex; align-items: center; gap: 0.7rem; color: var(--text-muted); }
.we-body { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }

.we-city {
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text);
}

.we-links { display: flex; gap: 0.5rem; }

.we-links a {
  font-size: 0.62rem;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}

.we-links a:hover { color: var(--text); border-color: var(--accent-ui); }
</style>
