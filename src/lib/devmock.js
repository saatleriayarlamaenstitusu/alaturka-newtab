/**
 * Geliştirme sahtesi.
 *
 * `npm run dev` sırasında sayfa normal bir sekmede açılıyor ve orada
 * `chrome.system` / `chrome.topSites` YOK — sistem widget'ı ve sık
 * ziyaret listesi boş kalıyor, düzen de hiç denenemiyor. Bu dosya
 * yalnızca geliştirmede (`import.meta.env.DEV`) ve yalnızca uçlar
 * GERÇEKTEN yoksa devreye girer; eklenti olarak yüklendiğinde hiç
 * çalışmaz.
 */
export function installDevMocks() {
  if (!import.meta.env.DEV) return
  const g = globalThis
  g.chrome = g.chrome ?? {}
  let tick = 0
  if (!g.chrome.system) {
    g.chrome.system = {
      cpu: {
        getInfo: async () => {
          tick += 1
          return {
            processors: Array.from({ length: 8 }, () => ({
              usage: { kernel: 40000 * tick, user: 60000 * tick, idle: 400000 * tick, total: 1000000 * tick },
            })),
          }
        },
      },
      memory: {
        getInfo: async () => ({ capacity: 16 * 1024 ** 3, availableCapacity: 6.2 * 1024 ** 3 }),
      },
    }
  }
  if (!g.chrome.topSites) {
    g.chrome.topSites = {
      get: async () => [
        { url: 'https://github.com/', title: 'GitHub' },
        { url: 'https://www.youtube.com/', title: 'YouTube' },
        { url: 'https://mail.google.com/', title: 'Gmail' },
        { url: 'https://news.ycombinator.com/', title: 'Hacker News' },
        { url: 'https://alaturkavakitler.com/', title: 'Alaturka Vakitler' },
      ],
    }
  }
}
