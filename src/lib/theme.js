import { ref, computed } from 'vue'
import { settings } from './settings'

/**
 * Etkin tema — TEK kaynak.
 *
 * Önce bu hesap App.vue'nin içindeydi ve yalnızca orada biliniyordu.
 * Arka plan katmanı (karartma mı aydınlatma mı), ayarlar paneli
 * (sürgünün adı) ve sistem göstergesi (hangi kırmızı) aynı soruyu
 * soruyor; üçü de aynı cevabı buradan alıyor.
 *
 * `auto` modda sistem tercihi CANLI izleniyor: önce yalnızca açılışta
 * okunuyordu, işletim sistemi gece moduna geçince sekme eski temada
 * kalıyordu.
 */
const mq = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-color-scheme: light)')
  : null

export const systemLight = ref(mq ? mq.matches : false)
mq?.addEventListener?.('change', (e) => { systemLight.value = e.matches })

/** Koyu mu? Ayar 'auto' ise sistem, değilse kullanıcının açık seçimi. */
export const isDark = computed(() =>
  settings.theme === 'auto' ? !systemLight.value : settings.theme === 'dark')
