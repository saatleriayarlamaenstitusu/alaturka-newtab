<script setup>
/**
 * İkon seti — tek dosya, satır içi SVG.
 *
 * Hepsi 24'lük ızgarada, KONTUR tabanlı (1.5 birim), yuvarlak uçlu ve
 * rengini `currentColor`dan alır. Tek bir dil: karışık setler yan yana
 * gelince arayüz iki ayrı uygulamadan toplanmış gibi duruyor.
 */
defineProps({ name: { type: String, required: true }, size: { type: [Number, String], default: 16 } })

const P = {
  saat: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  vakit: 'M4 18h16M6 18a6 6 0 0 1 12 0M12 3v2M4.5 7.5 6 9M19.5 7.5 18 9M3 21h18',
  takvim: 'M4 7h16v13H4zM4 7V5h16v2M8 3v4M16 3v4M8 12h2M14 12h2M8 16h2M14 16h2',
  sistem: 'M4 6h16v9H4zM9 19h6M12 15v4M7 10v2M11 8v4M15 9v3',
  kuran: 'M4 5c3 0 5 .7 8 2 3-1.3 5-2 8-2v13c-3 0-5 .7-8 2-3-1.3-5-2-8-2zM12 7v13',
  ai: 'm12 4 1.8 4.7L18.5 10l-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.3zM18 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z',
  sosyal: 'M7 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM22 6.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM22 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM7 11l10-4M7 13l10 4',
  ayet: 'M5 4h11l3 3v13H5zM16 4v3h3M8 12h8M8 16h5',
  not: 'M5 4h14v16H5zM9 8h6M9 12h6M9 16h3',
  analog: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2M12 3v1M21 12h-1M12 21v-1M3 12h1',
  hava: 'M7 18h9a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6 1.2A3.4 3.4 0 0 0 7 18Z',
  arama: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  arkaplan: 'M4 5h16v14H4zM4 15l4-4 3 3 4-4 5 5',
  sehir: 'M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  gorunum: 'M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM12 5v14',
  kisayol: 'M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z',
  yerlesim: 'M4 4h6v16H4zM12 4h8v7h-8zM12 13h8v7h-8z',
  bildirim: 'M6 16h12l-1.2-2V10a4.8 4.8 0 0 0-9.6 0v4zM10 19a2 2 0 0 0 4 0',
  kapat: 'M6 6l12 12M18 6 6 18',
  arti: 'M12 5v14M5 12h14',
  sabit: 'M9 4h6l-1 6 3.5 3H6.5L10 10zM12 13v7',
}
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  ><path :d="P[name] ?? P.kisayol" /></svg>
</template>
