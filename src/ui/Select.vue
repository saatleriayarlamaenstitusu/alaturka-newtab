<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import Icon from './Icon.vue'

/**
 * Seçim kutusu — yerel `<select>` DEĞİL.
 *
 * Yerelinin iki sorunu ölçüldü: açılan liste işletim sisteminin
 * kendi penceresidir, koyu arayüzde beyaz yazı beyaz zemine düşüp
 * okunmuyordu; bir de her platformda başka göründüğü için Swiss
 * düzenin içinde yamalı duruyordu.
 *
 * 12'den uzun listelerde arama alanı kendiliğinden açılır (81 il bir
 * listede taranmıyor).
 */
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },   // { value, label, hint? }
  label: { type: String, default: '' },
  placeholder: { type: String, default: 'Seç' },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const q = ref('')
const root = ref(null)
const search = ref(null)

const current = computed(() =>
  props.options.find((o) => String(o.value) === String(props.modelValue)) ?? null)

const searchable = computed(() => props.options.length > 12)

const list = computed(() => {
  const s = q.value.trim().toLocaleLowerCase('tr')
  if (!s) return props.options
  return props.options.filter((o) => String(o.label).toLocaleLowerCase('tr').includes(s))
})

function toggle() {
  open.value = !open.value
  if (open.value) {
    q.value = ''
    nextTick(() => {
      search.value?.focus()
      // Seçili satır listenin ortasına gelsin: 81 ilin içinde
      // bulunduğun ili aramak gerekmesin.
      const el = root.value?.querySelector('.opt.on')
      const box = root.value?.querySelector('.list')
      if (el && box) box.scrollTop = el.offsetTop - box.clientHeight / 2 + 16
    })
  }
}

function pick(o) {
  emit('update:modelValue', o.value)
  open.value = false
}

function onDocDown(e) {
  if (open.value && root.value && !root.value.contains(e.target)) open.value = false
}
document.addEventListener('pointerdown', onDocDown)
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocDown))
</script>

<template>
  <div ref="root" class="sel" :class="{ open }">
    <button
      type="button"
      class="face"
      :aria-expanded="open"
      :aria-label="label || placeholder"
      @click="toggle"
    >
      <span class="val">{{ current?.label ?? placeholder }}</span>
      <span class="caret" aria-hidden="true">▾</span>
    </button>

    <div v-if="open" class="pop">
      <div v-if="searchable" class="find">
        <Icon name="arama" :size="13" />
        <input ref="search" v-model="q" type="text" placeholder="Ara" aria-label="Listede ara" />
      </div>
      <div class="list">
        <button
          v-for="o in list"
          :key="o.value"
          type="button"
          class="opt"
          :class="{ on: String(o.value) === String(modelValue) }"
          @click="pick(o)"
        >
          <span>{{ o.label }}</span>
          <span v-if="o.hint" class="hint">{{ o.hint }}</span>
        </button>
        <p v-if="!list.length" class="empty">Eşleşme yok</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sel { position: relative; min-width: 0; }

.face {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0.32rem 0.55rem;
  font: inherit;
  font-size: 0.74rem;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: color-mix(in srgb, var(--text) 5%, transparent);
  color: var(--text);
  cursor: pointer;
  text-align: left;
}

.face:hover, .open .face { border-color: var(--accent-ui); }
.val { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.caret { font-size: 0.6rem; color: var(--text-muted); }

/* Açılır liste SAYFANIN içinde çizilir: yerel listenin tersine
   temayı, yazı tipini ve kenarlığı paylaşır. */
.pop {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  right: 0;
  left: 0;
  min-width: 10rem;
  border: 1px solid var(--border);
  border-radius: 9px;
  background-color: var(--bg);
  background-image: linear-gradient(var(--surface), var(--surface));
  box-shadow: 0 12px 28px rgb(0 0 0 / 0.35);
  overflow: hidden;
}

.find {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--border);
  color: var(--text-muted);
}

.find input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 0.74rem;
  outline: none;
}

.list { max-height: 14rem; overflow-y: auto; padding: 0.2rem; }

.opt {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.32rem 0.45rem;
  font: inherit;
  font-size: 0.74rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  text-align: left;
}

.opt:hover { background: color-mix(in srgb, var(--text) 8%, transparent); color: var(--text); }
.opt.on { color: var(--text); background: color-mix(in srgb, var(--accent-ui) 22%, transparent); }
.hint { font-size: 0.62rem; opacity: 0.7; }
.empty { margin: 0; padding: 0.5rem; font-size: 0.7rem; color: var(--text-muted); }
</style>
