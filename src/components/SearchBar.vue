<script setup>
import { ref } from 'vue'
import { ENGINES, engineUrl, settings } from '@/lib/settings'
import Select from '@/ui/Select.vue'
import Icon from '@/ui/Icon.vue'

/**
 * Arama çubuğu.
 *
 * Tarayıcının kendi adres çubuğu zaten var; buradaki kutu, yeni
 * sekmede elin klavyede olduğu an için. Bu yüzden açılışta odaklanır.
 *
 * Girilen metin bir ADRESSE benziyorsa (nokta içeriyor, boşluk yok)
 * arama yapmak yerine doğrudan oraya gidilir — "github.com" yazıp
 * arama sonuçlarına düşmek can sıkıcı.
 *
 * Motor seçimi kutunun İÇİNDE: ayrı bir açılır kutu kutunun yanında
 * dururken arama alanının sınırı belirsizleşiyordu ve seçim, aramanın
 * bir parçası — ayarlara gömülecek bir tercih değil.
 */
const q = ref('')
const box = ref(null)

defineExpose({ focus: () => box.value?.focus() })

const looksLikeUrl = (s) =>
  /^https?:\/\//i.test(s) || (/^[^\s]+\.[a-z]{2,}([/?#].*)?$/i.test(s))

function go() {
  const s = q.value.trim()
  if (!s) return
  location.href = looksLikeUrl(s)
    ? (/^https?:\/\//i.test(s) ? s : `https://${s}`)
    : engineUrl(settings.engine) + encodeURIComponent(s)
}
</script>

<template>
  <form class="search" @submit.prevent="go">
    <Icon name="arama" :size="16" class="ic" />
    <input
      ref="box"
      v-model="q"
      class="box"
      type="text"
      autocomplete="off"
      spellcheck="false"
      placeholder="Ara ya da adres yaz"
      aria-label="Ara"
    />
    <Select
      v-model="settings.engine"
      :options="ENGINES.map(e => ({ value: e.id, label: e.label }))"
      label="Arama motoru"
      class="engine"
    />
  </form>
</template>

<style scoped>
.search {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  /* Sayfanın ana hareketi arama: kutu geniş ve yüksek, öbür her şeyden
     önce göze çarpsın. */
  width: min(100%, 44rem);
  height: 3.5rem;
  padding: 0 0.5rem 0 1.1rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background-color: color-mix(in srgb, var(--bg) 62%, transparent);
  backdrop-filter: blur(14px) saturate(120%);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.search:focus-within {
  border-color: var(--accent-ui);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent-ui) 14%, transparent);
}

.ic { flex: 0 0 auto; color: var(--text-muted); }

.box {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  font-size: 1rem;
  border: none;
  background: transparent;
  color: var(--text);
  outline: none;
}

.box::placeholder { color: var(--text-muted); }

/* Motor seçici kutunun içinde, sağ uçta: aramanın parçası ama
   ikincil — kenarlığı yok, yalnızca adı duruyor. */
.engine { flex: 0 0 auto; width: 7.5rem; }
.engine :deep(.face) { border-color: transparent; background: transparent; justify-content: flex-end; }
.engine :deep(.face:hover) { border-color: var(--border); }
.engine :deep(.val) { flex: 0 1 auto; font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); }
</style>
