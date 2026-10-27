"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import Figura from "./Figura"
import ScalaLatitudini from "./ScalaLatitudini"
import Esito from "./Esito"
import { chiudiSessione, registraRisposta } from "@/lib/progress"
import { ERRORI_AMMESSI, MINUTI_ESAME, formatTempo, siglaTema } from "@/lib/quiz"
import type { Item, Mode } from "@/lib/types"

export default function Runner({
  iniziali,
  modo,
  onRicomincia,
}: {
  iniziali: Item[]
  modo: Mode
  /** Rilancia una sessione nuova dello stesso tipo. */
  onRicomincia: () => void
}) {
  const esame = modo === "esame"
  const [items, setItems] = useState<Item[]>(iniziali)
  const [i, setI] = useState(0)
  const [consegnato, setConsegnato] = useState(false)
  const [restano, setRestano] = useState(MINUTI_ESAME * 60)
  const inizio = useRef(0)
  const registrato = useRef(false)
  const testa = useRef<HTMLDivElement>(null)

  // Allo scadere del tempo la prova si chiude da sola con le risposte date
  // fino a quel momento, come in commissione. Lo stato "finita" si ricava,
  // non si pilota: cosi' il timer non deve far scattare un altro render.
  const finito = consegnato || (esame && restano <= 0)
  const item = items[i]
  const rivelato = !esame && item.given !== null
  const ultima = i === items.length - 1

  // Il cronometro della sessione parte al montaggio, non durante il render.
  useEffect(() => {
    inizio.current = Date.now()
  }, [])

  useEffect(() => {
    if (!esame || finito) return
    const t = setInterval(() => setRestano((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [esame, finito])

  // La sessione si archivia una volta sola, qualunque sia il motivo per cui
  // e' finita.
  useEffect(() => {
    if (!finito || registrato.current) return
    registrato.current = true
    chiudiSessione(items, modo, (Date.now() - inizio.current) / 1000)
  }, [finito, items, modo])

  // Cambiando domanda si torna in cima: il testo lungo lascia la pagina
  // scrollata a meta' e la domanda nuova parte invisibile.
  useEffect(() => {
    testa.current?.scrollIntoView({ block: "start" })
  }, [i])

  function rispondi(scelta: number) {
    if (!esame && item.given !== null) return // in allenamento la risposta e' definitiva
    setItems((prev) =>
      prev.map((it, k) => (k === i ? { ...it, given: scelta } : it)),
    )
    // Fuori dall'esame si salva subito: uscire a meta' sessione non deve
    // buttare via le domande gia' fatte.
    if (!esame) registraRisposta(item.question.id, scelta === item.correct)
  }

  function avanti() {
    if (ultima) setConsegnato(true)
    else setI(i + 1)
  }

  if (finito) {
    return <Esito items={items} modo={modo} onRicomincia={onRicomincia} />
  }

  const senzaRisposta = items.filter((it) => it.given === null).length

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <header
        ref={testa}
        className="sticky top-0 z-10 border-b border-secca bg-carta/95 px-4 pb-3 pt-3 backdrop-blur"
      >
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <Link
            href="/"
            className="shrink-0 text-sm text-tenue hover:text-inchiostro"
          >
            ← Esci
          </Link>
          <span className="etichetta-carta truncate text-sm text-tenue">
            {siglaTema(item.question.tema)}
          </span>
          <span className="tabular shrink-0 font-mono text-sm">
            {esame ? (
              <span className={restano <= 120 ? "text-sinistra" : ""}>
                {formatTempo(restano)}
              </span>
            ) : (
              <>
                {i + 1}/{items.length}
              </>
            )}
          </span>
        </div>

        <ScalaLatitudini
          items={items}
          corrente={i}
          riveleEsito={!esame}
          onVai={esame ? setI : undefined}
        />
      </header>

      <main className="flex-1 px-4 pb-40 pt-5">
        <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-tenue">
          {item.question.id}
        </p>
        <h1 className="text-[1.3rem] leading-snug">{item.question.q}</h1>

        {item.question.img && (
          <div className="mt-4">
            <Figura
              file={item.question.img}
              alt={`Figura della domanda ${item.question.id}`}
            />
          </div>
        )}

        <ul className="mt-5 space-y-2.5">
          {item.order.map((orig, pos) => {
            const testo = item.question.a[orig]
            const scelta = item.given === pos
            const giusta = item.correct === pos

            let stile = "border-secca bg-foglio"
            if (rivelato && giusta) stile = "border-dritta bg-dritta/10"
            else if (rivelato && scelta) stile = "border-sinistra bg-sinistra/10"
            else if (rivelato) stile = "border-secca bg-foglio opacity-55"
            else if (scelta) stile = "border-inchiostro bg-sabbia"

            let cerchio = "border-tenue"
            if (rivelato && giusta) cerchio = "border-dritta bg-dritta text-white"
            else if (rivelato && scelta)
              cerchio = "border-sinistra bg-sinistra text-white"
            else if (scelta) cerchio = "border-inchiostro"

            return (
              <li key={pos}>
                <button
                  type="button"
                  onClick={() => rispondi(pos)}
                  disabled={rivelato}
                  aria-pressed={scelta}
                  className={`flex w-full items-start gap-3 border p-3.5 text-left transition-colors ${stile} disabled:cursor-default`}
                >
                  <span
                    className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm leading-none ${cerchio} ${
                      rivelato && (giusta || scelta) ? "fanale" : ""
                    }`}
                  >
                    {/* Sul foglio d'esame la risposta si contrassegna con una X
                        dentro il cerchio: qui il gesto e' lo stesso. */}
                    {rivelato && giusta ? "✓" : scelta ? "✕" : ""}
                  </span>
                  <span className="pt-0.5 text-[0.98rem] leading-snug">{testo}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {rivelato && (
          <p className="mt-4 text-sm text-tenue">
            {item.given === item.correct ? (
              <span className="text-dritta">Esatto.</span>
            ) : (
              <span className="text-sinistra">
                Sbagliata. La risposta esatta è evidenziata in verde.
              </span>
            )}{" "}
            <span className="etichetta-carta">{item.question.voce}</span>
          </p>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-secca bg-carta/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-xl items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          {esame && (
            <button
              type="button"
              onClick={() => setI(Math.max(0, i - 1))}
              disabled={i === 0}
              className="titolo shrink-0 border border-secca px-4 py-3 text-base disabled:opacity-40"
            >
              Indietro
            </button>
          )}

          {esame && ultima ? (
            <button
              type="button"
              onClick={() => setConsegnato(true)}
              className="titolo flex-1 bg-magenta px-4 py-3 text-base text-su-magenta"
            >
              Consegna
              {senzaRisposta > 0 && (
                <span className="ml-2 font-normal opacity-80">
                  ({senzaRisposta} in bianco)
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={avanti}
              disabled={!esame && item.given === null}
              className="titolo flex-1 bg-inchiostro px-4 py-3 text-base text-carta disabled:opacity-35"
            >
              {ultima ? "Vedi risultato" : "Avanti"}
            </button>
          )}
        </div>
      </footer>

      {esame && (
        <p className="sr-only" aria-live="polite">
          Prova superata con un massimo di {ERRORI_AMMESSI} errori.
        </p>
      )}
    </div>
  )
}
