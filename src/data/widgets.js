/**
 * Widget kütüğü — tek kaynak.
 *
 * Hem ekrandaki yerleşim hem ayarlardaki liste buradan okunuyor; iki
 * ayrı listede yaşasalardı biri eklenip öbüründe unutulurdu (sitede
 * ikincil gezinmede yaşandı, `data/secondaryNav.js` o yüzden var).
 */
export const WIDGETS = [
  { id: 'vakit', label: 'Namaz vakitleri', icon: 'vakit', title: 'Vakitler' },
  { id: 'takvim', label: 'Aylık takvim', icon: 'takvim', title: 'Takvim' },
  { id: 'sistem', label: 'Sistem', icon: 'sistem', title: 'Sistem' },
  { id: 'analog', label: 'Analog saat', icon: 'analog', title: 'Analog' },
  { id: 'ayet', label: 'Günün ayeti', icon: 'ayet', title: 'Günün ayeti' },
  { id: 'not', label: 'Not', icon: 'not', title: 'Not' },
  { id: 'dini', label: 'Dinî bağlantılar', icon: 'kuran', title: 'Dinî' },
  { id: 'yapayzeka', label: 'Yapay zekâ', icon: 'ai', title: 'Yapay zekâ' },
  { id: 'sosyal', label: 'Sosyal medya', icon: 'sosyal', title: 'Sosyal' },
  { id: 'hava', label: 'Hava durumu', icon: 'hava', title: 'Hava' },
]

export const widgetById = (id) => WIDGETS.find((w) => w.id === id) ?? null
