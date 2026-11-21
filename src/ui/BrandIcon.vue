<script setup>
/**
 * Marka ikonları — `Icon.vue`den AYRI set.
 *
 * Path string veya `{ d, fill }` olabilir (YouTube üçgeni gibi).
 */
import { computed } from 'vue'
import { BRANDS, brandKey } from './brands.js'

const props = defineProps({
  id: { type: String, default: '' },
  url: { type: String, default: '' },
  size: { type: [Number, String], default: 18 },
})

const brand = computed(() => BRANDS[brandKey(props.id, props.url)] || null)

const parts = computed(() => {
  if (!brand.value) return []
  const baseFill = !!brand.value.fill
  return brand.value.paths.map((p) => {
    if (typeof p === 'string') {
      return { d: p, fill: baseFill, stroke: !baseFill }
    }
    const fill = p.fill ?? baseFill
    return { d: p.d, fill, stroke: !fill }
  })
})
</script>

<template>
  <svg
    v-if="brand"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="none"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      v-for="(p, i) in parts"
      :key="i"
      :d="p.d"
      :fill="p.fill ? 'currentColor' : 'none'"
      :stroke="p.stroke ? 'currentColor' : 'none'"
    />
  </svg>
</template>
