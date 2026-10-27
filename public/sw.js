/* Service worker per usare l'app senza rete.
 *
 * I contenuti qui dentro non cambiano mai da soli: le domande sono un
 * decreto del 2022 e le figure sono le sue tavole. Quindi domande e immagini
 * vanno in cache "prima la cache", e non si riscaricano mai.
 * Le pagine invece vanno "prima la rete", cosi' un deploy nuovo arriva subito
 * e la cache serve solo da rete di sicurezza quando si e' offline.
 */

const VERSIONE = "pn-v1"
const GUSCIO = `${VERSIONE}-guscio`
const CONTENUTI = `${VERSIONE}-contenuti`

const ROTTE = ["/", "/allenamento", "/esame", "/ripasso", "/statistiche"]

async function precarica() {
  const cache = await caches.open(CONTENUTI)
  // Domande e figure sono ~1,4 MB in tutto: si scaricano subito, mentre la
  // rete c'e' ancora, altrimenti offline mancherebbero proprio le domande
  // con la figura, che sono quelle che conviene studiare guardando.
  await cache.addAll(["/data/questions.json", "/data/figure.json"])
  const figure = await cache
    .match("/data/figure.json")
    .then((r) => (r ? r.json() : []))
  await Promise.allSettled(
    figure.map((f) => cache.add(`/figure/${f}`)),
  )
}

self.addEventListener("install", (e) => {
  e.waitUntil(precarica().then(() => self.skipWaiting()))
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((chiavi) =>
        Promise.all(
          chiavi
            .filter((k) => !k.startsWith(VERSIONE))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

/** Immutabile: se c'e' in cache si usa quella, altrimenti si scarica e si tiene. */
async function primaLaCache(req, nomeCache) {
  const cache = await caches.open(nomeCache)
  const salvata = await cache.match(req)
  if (salvata) return salvata
  const risposta = await fetch(req)
  if (risposta.ok) cache.put(req, risposta.clone())
  return risposta
}

/** Aggiornabile: si prova la rete, e la cache resta come riserva offline. */
async function primaLaRete(req, nomeCache) {
  const cache = await caches.open(nomeCache)
  try {
    const risposta = await fetch(req)
    if (risposta.ok) cache.put(req, risposta.clone())
    return risposta
  } catch (err) {
    const salvata = await cache.match(req)
    if (salvata) return salvata
    // Una rotta mai visitata, da offline: si serve la home, che e' sempre
    // in cache, invece dell'errore del browser.
    if (req.mode === "navigate") {
      const home = await cache.match("/")
      if (home) return home
    }
    throw err
  }
}

self.addEventListener("fetch", (e) => {
  const { request } = e
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  const immutabile =
    url.pathname.startsWith("/figure/") ||
    url.pathname.startsWith("/data/") ||
    url.pathname.startsWith("/_next/static/")

  if (immutabile) {
    e.respondWith(primaLaCache(request, CONTENUTI))
  } else if (request.mode === "navigate" || ROTTE.includes(url.pathname)) {
    e.respondWith(primaLaRete(request, GUSCIO))
  }
})
