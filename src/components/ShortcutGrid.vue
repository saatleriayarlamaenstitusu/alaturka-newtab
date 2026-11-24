<script setup>
import { computed, ref } from 'vue'
import { settings } from '@/lib/settings'
import { top, keyOf, pin, unpin, move, add } from '@/lib/sites'
import Icon from '@/ui/Icon.vue'

/**
 * Kişisel kısayollar.
 *
 * Önce kendi eklediklerin (sürüklenerek sıralanır, sabitlenmiş
 * sayılırlar), sonra tarayıcının sık ziyaret listesi. Sık ziyaret
 * edilen bir siteyi SABİTLEMEK onu birinci gruba taşır: o liste her
 * gün değişiyor, sabitlenen değişmiyor.
 *
 * Aynı site iki listede birden çıkmasın diye adrese göre eleniyor
 * (`keyOf`: şema, `www.` ve sondaki eğik çizgi sayılmaz).
 */
const adding = ref(false)
const name = ref('')
const url = ref('')
const dragFrom = ref(-1)
const over = ref(-1)

const mine = computed(() => settings.shortcuts)
const auto = computed(() => {
  if (settings.shortcutMode !== 'oto') return []
  const have = new Set(mine.value.map((s) => keyOf(s.url)))
  return top.value.filter((s) => !have.has(keyOf(s.url))).slice(0, 10)
})

const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' } }
const icon = (u) => `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host(u))}`

/**
 * Faviconu GELMEYEN adresler.
 *
 * `error` olayı YETMİYOR: servis favicon bulamadığında 404 dönüyor
 * ama gövdesinde 16×16'lık bir yer tutucu küre gönderiyor ve tarayıcı
 * onu BAŞARIYLA yüklüyor (ölçüldü: example.com ve olmayan bir alan
 * adı → `complete: true`, `naturalWidth: 16`). Yani kırık görsel
 * diye bir şey yok, ekranda servisin bulanık küçük küresi duruyordu.
 *
 * Ayırt eden ölçü BOY: yer tutucu istenen boydan bağımsız hep 16×16
 * (sz=64 ve sz=128'de de 16 ölçüldü), gerçek faviconlar 18–128
 * geliyor (github 32, HN 18, youtube 64/128). Bu yüzden 16 ve altı
 * "favicon yok" sayılıp yerine bizim KÜRE çiziliyor.
 *
 * Bilinen sınır: gerçek faviconu 16×16 olan bir site de küreye
 * düşer. 16px'lik bir görsel 22px'lik kutuda zaten bulanık duruyor;
 * vektör küre ondan net. CORS kapalı olduğu için piksel karşılaştırması
 * yapılamıyor (tuval kirleniyor), host izni eklemek de mağazada yeni
 * bir izin uyarısı demek — ikisi de bu takasa değmez.
 */
const broken = ref({})
const markBroken = (u) => { broken.value = { ...broken.value, [u]: true } }
const onIconLoad = (u, e) => { if ((e.target?.naturalWidth ?? 0) <= 16) markBroken(u) }

function submit() {
  if (add(name.value, url.value)) { name.value = ''; url.value = ''; adding.value = false }
}

function onDrop(to) {
  const from = dragFrom.value
  over.value = -1
  dragFrom.value = -1
  move(from, to)
}
</script>

<template>
  <section class="sc">
    <div class="sc-row">
      <a
        v-for="(s, i) in mine"
        :key="s.id"
        class="tile"
        :class="{ over: over === i }"
        :href="s.url"
        :title="s.name"
        draggable="true"
        @dragstart="dragFrom = i"
        @dragover.prevent="over = i"
        @dragleave="over === i && (over = -1)"
        @drop.prevent="onDrop(i)"
        @dragend="dragFrom = -1; over = -1"
      >
        <span class="ico">
          <img
            v-if="!broken[s.url]"
            :src="icon(s.url)"
            alt=""
            width="22"
            height="22"
            loading="lazy"
            @load="onIconLoad(s.url, $event)"
            @error="markBroken(s.url)"
          />
          <Icon v-else name="dunya" :size="18" class="ico-fallback" />
        </span>
        <span class="name">{{ s.name }}</span>
        <button class="act" title="Kaldır" @click.prevent.stop="unpin(s.id)">×</button>
      </a>

      <a
        v-for="s in auto"
        :key="s.id"
        class="tile auto"
        :href="s.url"
        :title="s.name"
      >
        <span class="ico">
          <img
            v-if="!broken[s.url]"
            :src="icon(s.url)"
            alt=""
            width="22"
            height="22"
            loading="lazy"
            @load="onIconLoad(s.url, $event)"
            @error="markBroken(s.url)"
          />
          <Icon v-else name="dunya" :size="18" class="ico-fallback" />
        </span>
        <span class="name">{{ s.name }}</span>
        <button class="act" title="Sabitle" @click.prevent.stop="pin(s)">⌁</button>
      </a>

      <button class="tile add" title="Kısayol ekle" @click="adding = !adding">
        <span class="ico"><span class="letter">+</span></span>
        <span class="name">Ekle</span>
      </button>
    </div>

    <form v-if="adding" class="sc-add" @submit.prevent="submit">
      <input v-model="name" placeholder="Ad" aria-label="Kısayol adı" />
      <input v-model="url" placeholder="adres.com" aria-label="Kısayol adresi" />
      <button type="submit">Kaydet</button>
    </form>
  </section>
</template>

<style scoped>
.sc { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }

.sc-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem; }

.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  width: 5rem;
  padding: 0.55rem 0.3rem;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.tile:hover { border-color: var(--border); background: color-mix(in srgb, var(--text) 6%, transparent); }
.tile.over { border-color: var(--accent-ui); }
/* Sık ziyaret edilenler biraz soluk: kalıcı olmadıkları okunsun. */
.tile.auto .name { opacity: 0.75; }

.ico {
  position: relative;
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 10px;
  background-color: var(--bg);
  background-image: linear-gradient(var(--surface), var(--surface));
  border: 1px solid var(--border);
}

/* Favicon gelmeyince küre: soluk, kutunun kendi dilinde. */
.ico-fallback { color: var(--text-muted); opacity: 0.75; }
.letter { position: absolute; font-size: 0.85rem; color: var(--text-muted); }

.name {
  max-width: 100%;
  font-size: 0.6rem;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tile:hover .name { color: var(--text); }

/* Kaldır/sabitle düğmesi yalnızca üstüne gelince: sürekli görünse
   ızgara düğme tarlasına dönüyor. */
.act {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 1.1rem;
  height: 1.1rem;
  display: none;
  place-items: center;
  font-size: 0.7rem;
  line-height: 1;
  border: 1px solid var(--border);
  border-radius: 50%;
  background-color: var(--bg);
  color: var(--text-muted);
  cursor: pointer;
}

.tile:hover .act { display: grid; }
.act:hover { color: var(--text); border-color: var(--accent-ui); }

.sc-add { display: flex; gap: 0.35rem; }

.sc-add input {
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  color: var(--text);
  font-size: 0.78rem;
}

.sc-add button {
  padding: 0.35rem 0.7rem;
  font-size: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.sc-add button:hover { color: var(--text); border-color: var(--text); }
</style>
