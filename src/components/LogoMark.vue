<script setup>
/**
 * Marka işareti.
 *
 * Sitenin GERÇEK logosu — iki aynalı parçadan oluşan işaret
 * (`src/components/ui/LogoMotion.vue` ile aynı yollar). Önce elle
 * çizilmiş bir üçgen konmuştu ve logoya hiç benzemiyordu; marka
 * işareti uydurulmaz, kaynağından alınır.
 *
 * YALNIZCA işaret — yazısız. "Alaturka Vakitler" yazısı yeni sekmede
 * bir şey anlatmıyor; işaret zaten markayı taşıyor ve sayfanın üstünde
 * ortada sessiz duruyor.
 *
 * Satır içi SVG ve `currentColor`: dosyadan gelen beyaz SVG açık
 * temada görünmez oluyor, filtreyle boyamak da bu kadar küçük bir
 * işarette kenarları bozuyor.
 *
 * `scale(-1)` taşıyan parça AYRI bir grupta durur — sitedeki
 * animasyonda bu grup birleştirildiğinde sol parça kaybolmuştu.
 */
</script>

<template>
  <a class="lm" href="https://alaturkavakitler.com" title="Alaturka Vakitler">
    <svg class="mark" viewBox="36.5 474 15.5 12.2" fill="currentColor" aria-hidden="true">
      <g transform="scale(-1)"><path d="M-31.986-482.68q-.782 0-1.344-.563-.563-.562-.563-1.343 0-.813.563-1.376.562-.562 1.344-.562.812 0 1.375.562.562.563.562 1.344 0 .813-.562 1.375-.563.563-1.375.563zm-2.47 2.688q.407.844.407 1.719 0 .5-.125 1.031-.375 1.438-1.594 2.25l-5.814-11.532h3.845q1.094 2.188 3.281 6.532z" /></g>
      <path d="M49.414 478.203q-.781 0-1.344-.563-.562-.563-.562-1.344 0-.813.562-1.375.563-.563 1.344-.563.813 0 1.375.563.563.562.563 1.344 0 .812-.563 1.375-.562.563-1.375.563zm-2.47 2.687q.407.844.407 1.72 0 .5-.125 1.03-.375 1.439-1.594 2.251l-5.813-11.533h3.844q1.094 2.188 3.282 6.532z" />
    </svg>
  </a>
</template>

<style scoped>
.lm {
  color: var(--text-muted);
  padding: 10px;
  padding-left: 20px;
  display: block;
  padding-right: 0;
  border-radius: 1em;
}

.lm:hover { background: color-mix(in srgb, var(--text) 10%, transparent); }

.mark {    
  width: 4.8rem;
  height: 2rem;
  object-position: center;
  margin: auto;
  display: inline-block;
}

.lm:hover { color: var(--text); }
</style>
