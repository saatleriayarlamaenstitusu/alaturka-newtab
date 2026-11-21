<script setup>
/**
 * Anahtar — kutucuk değil kaydıraç.
 *
 * Ayar panelinde onlarca kutucuk vardı ve hepsi işletim sisteminin
 * kendi çizimiyle geliyordu (koyu zeminde beyaz kare). Bu kendi
 * çizimimiz: açık/kapalı farkı hem konum hem renkle okunuyor.
 */
defineProps({ modelValue: { type: Boolean, default: false }, label: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <button
    type="button"
    class="sw"
    :class="{ on: modelValue }"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    @click="emit('update:modelValue', !modelValue)"
  ><span class="knob" /></button>
</template>

<style scoped>
.sw {
  flex: 0 0 auto;
  width: 2.1rem;
  height: 1.15rem;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--text) 8%, transparent);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.sw.on { background: color-mix(in srgb, var(--accent-ui) 55%, transparent); border-color: var(--accent-ui); }

.knob {
  display: block;
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: var(--text);
  transition: transform 0.15s ease;
}

.sw.on .knob { transform: translateX(0.95rem); background: #fff; }
</style>
