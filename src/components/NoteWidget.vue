<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { settings, state } from '@/lib/settings'

/**
 * Not.
 *
 * Tek bir metin kutusu; kaydet düğmesi yok — yazdığın an ayarlarla
 * birlikte saklanıyor. "Kaydet"e basmayı unutup kaybetmek, bir yeni
 * sekme defterinde olabilecek en kötü şey.
 *
 * Kutunun BOYU da ayarın parçası: köşesinden çekip büyüttüğün yükseklik
 * bir sonraki sekmede de aynı geliyor. Tarayıcı `resize` için olay
 * vermiyor, bu yüzden kutu kendi `ResizeObserver`ıyla izleniyor.
 */
const box = ref(null)
let ro = null
let save = 0
/** Kayıtlı boyu UYGULAMAK da gözlemciyi tetikliyor; o tik sayılmaz. */
let selfSet = false

function apply() {
  if (!box.value || !settings.noteHeight) return
  if (Math.round(box.value.getBoundingClientRect().height) === settings.noteHeight) return
  selfSet = true
  box.value.style.height = `${settings.noteHeight}px`
}

/**
 * Kayıtlı boy İZLENEREK uygulanır, bir kez okunarak değil.
 *
 * Ayarlar depodan EŞZAMANSIZ geliyor (`loadSettings`) ve uygulamanın
 * `onMounted`ı çocuklarınkinden SONRA çalışıyor: bu bileşen
 * kurulurken `noteHeight` hâlâ varsayılan 0 oluyordu.
 */
watch(() => settings.noteHeight, apply)

onMounted(() => {
  apply()
  ro = new ResizeObserver(([e]) => {
    // Ayarlar henüz gelmeden gelen ilk ölçüm VARSAYILAN boydur;
    // kaydedilirse kullanıcının kayıtlı boyunu eziyor (ölçüldü: 260
    // kaydedildi, sayfa 82 ile açıldı ve 82'yi geri yazdı).
    if (!state.ready) return
    if (selfSet) { selfSet = false; return }
    const h = Math.round(e.contentRect.height)
    if (!h || h === settings.noteHeight) return
    // Yazarken de tetikleniyor (içerik uzayınca); yazma bitene kadar
    // beklemek hem yazmayı hem depoyu rahat bırakıyor.
    clearTimeout(save)
    save = setTimeout(() => { settings.noteHeight = h }, 400)
  })
  ro.observe(box.value)
})

onBeforeUnmount(() => { ro?.disconnect(); clearTimeout(save) })
</script>

<template>
  <textarea
    ref="box"
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
