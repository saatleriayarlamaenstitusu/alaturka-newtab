/**
 * Widget kütüğü — tek kaynak.
 *
 * Hem ekrandaki yerleşim hem ayarlardaki liste buradan okunuyor; iki
 * ayrı listede yaşasalardı biri eklenip öbüründe unutulurdu (sitede
 * ikincil gezinmede yaşandı, `data/secondaryNav.js` o yüzden var).
 */
export const WIDGETS = [
  // Başlığı OLMAYANLAR: ne olduğu içeriğinden okunuyor. Altı vaktin
  // adı ve saati yan yana duruyorsa üstüne "VAKİTLER" yazmak, bir ay
  // ızgarasının üstüne "TAKVİM" ya da kadranın üstüne "ANALOG" yazmak
  // gibi — şerit yer kaplıyor ve hiçbir şey söylemiyor.
  { id: 'vakit', label: 'Namaz vakitleri', icon: 'vakit', title: '' },
  { id: 'takvim', label: 'Aylık takvim', icon: 'takvim', title: '' },
  { id: 'sistem', label: 'Sistem', icon: 'sistem', title: 'Sistem' },
  { id: 'analog', label: 'Analog saat', icon: 'analog', title: '' },
  { id: 'ayet', label: 'Günün ayeti', icon: 'ayet', title: 'Günün ayeti' },
  { id: 'not', label: 'Not', icon: 'not', title: 'Not' },
  { id: 'dini', label: 'Dinî bağlantılar', icon: 'kuran', title: 'Dinî' },
  { id: 'yapayzeka', label: 'Yapay zekâ', icon: 'ai', title: 'Yapay zekâ' },
  { id: 'sosyal', label: 'Sosyal medya', icon: 'sosyal', title: 'Sosyal' },
  { id: 'google', label: 'Google', icon: 'kisayol', title: 'Google' },
  { id: 'hava', label: 'Hava durumu', icon: 'hava', title: '' },
]

import { computed } from 'vue'
import { settings } from '@/lib/settings'

/**
 * Kullanıcının kendi grupları da birer widget.
 *
 * Kütük sabit olamıyor: grup eklemek yeni bir widget eklemek demek.
 * Hazır olanlar `WIDGETS`ten, kullanıcınınkiler `groupMeta`dan geliyor
 * ve ikisi aynı biçimde (`{ id, label, icon, title }`) — yerleşim
 * düzenleyici ve sayfa ikisini ayırt etmek zorunda kalmıyor.
 */
export const allWidgets = computed(() => [
  ...WIDGETS,
  ...(settings.groupMeta ?? []).map((g) => ({
    id: g.key, label: g.title, icon: g.icon || 'kisayol', title: g.title, custom: true,
  })),
])

export const widgetById = (id) =>
  allWidgets.value.find((w) => w.id === id) ?? null
