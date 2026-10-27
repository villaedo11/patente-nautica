"use client"

import Link from "next/link"
import { useCallback, useMemo, useState } from "react"
import Runner from "@/components/Runner"
import { Caricamento, Errore } from "@/components/Stato"
import taxonomy from "@/data/taxonomy.json"
import { useQuestions } from "@/lib/data"
import { pick, siglaTema, toItem } from "@/lib/quiz"
import type { Item } from "@/lib/types"

const TAGLI = [10, 20, 40]

export default function Allenamento() {
  const { stato, domande, errore } = useQuestions()
  // Insieme vuoto = nessun filtro. Evita di dover pre-selezionare 45 voci.
  const [temi, setTemi] = useState<Set<string>>(new Set())
  const [voci, setVoci] = useState<Set<string>>(new Set())
  const [quante, setQuante] = useState(20)
  const [apriVoci, setApriVoci] = useState(false)
  const [items, setItems] = useState<Item[] | null>(null)

  const vociDisponibili = useMemo(
    () =>
      taxonomy
        .filter((t) => temi.size === 0 || temi.has(t.tema))
        .flatMap((t) => t.voci.map((v) => ({ ...v, tema: t.tema }))),
    [temi],
  )

  const pool = useMemo(() => {
    if (!domande) return []
    return domande.filter(
      (q) =>
        (temi.size === 0 || temi.has(q.tema)) &&
        (voci.size === 0 || voci.has(q.voce)),
    )
  }, [domande, temi, voci])

  function commutaTema(tema: string) {
    setTemi((prev) => {
      const next = new Set(prev)
      if (!next.delete(tema)) next.add(tema)
      // le voci di un tema deselezionato non devono restare attive
      setVoci((vp) => {
        const ammesse = new Set(
          taxonomy
            .filter((t) => next.size === 0 || next.has(t.tema))
            .flatMap((t) => t.voci.map((v) => v.voce)),
        )
        return new Set([...vp].filter((v) => ammesse.has(v)))
      })
      return next
    })
  }

  function commutaVoce(voce: string) {
    setVoci((prev) => {
      const next = new Set(prev)
      if (!next.delete(voce)) next.add(voce)
      return next
    })
  }

  const avvia = useCallback(() => {
    setItems(pick(pool, Math.min(quante, pool.length)).map(toItem))
  }, [pool, quante])

  if (stato === "errore") return <Errore messaggio={errore} />
  if (items) {
    return (
      <Runner
        iniziali={items}
        modo="allenamento"
        onRicomincia={() => setItems(null)}
      />
    )
  }
  if (stato === "carico") return <Caricamento />

  const massimo = pool.length

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-36 pt-8">
      <Link href="/" className="text-sm text-tenue hover:text-inchiostro">
        ← Esci
      </Link>
      <h1 className="titolo mt-2 text-3xl">Allenamento</h1>
      <p className="mt-1 text-sm text-tenue">
        Senza timer, con la correzione subito dopo ogni risposta.
      </p>

      <section className="mt-7">
        <h2 className="etichetta-carta text-sm text-tenue">
          Tema {temi.size === 0 && "· tutti"}
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {taxonomy.map((t) => {
            const on = temi.has(t.tema)
            return (
              <button
                key={t.tema}
                type="button"
                onClick={() => commutaTema(t.tema)}
                aria-pressed={on}
                className={`border px-3 py-2 text-sm ${
                  on
                    ? "border-inchiostro bg-inchiostro text-carta"
                    : "border-secca bg-foglio"
                }`}
              >
                {siglaTema(t.tema)}{" "}
                <span className="tabular font-mono text-xs opacity-60">{t.n}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-7">
        <button
          type="button"
          onClick={() => setApriVoci(!apriVoci)}
          aria-expanded={apriVoci}
          className="flex w-full items-center justify-between border-b border-secca pb-2"
        >
          <span className="etichetta-carta text-sm text-tenue">
            Voce {voci.size === 0 ? "· tutte" : `· ${voci.size} scelte`}
          </span>
          <span aria-hidden className="text-tenue">
            {apriVoci ? "−" : "+"}
          </span>
        </button>

        {apriVoci && (
          <ul className="mt-2 space-y-1.5">
            {vociDisponibili.map((v) => {
              const on = voci.has(v.voce)
              return (
                <li key={`${v.tema}·${v.voce}`}>
                  <button
                    type="button"
                    onClick={() => commutaVoce(v.voce)}
                    aria-pressed={on}
                    className={`flex w-full items-start gap-2.5 border p-2.5 text-left text-sm ${
                      on ? "border-inchiostro bg-sabbia" : "border-secca bg-foglio"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs leading-none ${
                        on ? "border-inchiostro" : "border-tenue"
                      }`}
                    >
                      {on ? "✕" : ""}
                    </span>
                    <span className="flex-1 leading-snug">{v.voce}</span>
                    <span className="tabular font-mono text-xs text-tenue">
                      {v.n}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="mt-7">
        <h2 className="etichetta-carta text-sm text-tenue">Quante domande</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {TAGLI.filter((n) => n < massimo).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQuante(n)}
              aria-pressed={quante === n}
              className={`tabular border px-4 py-2 font-mono text-sm ${
                quante === n
                  ? "border-inchiostro bg-inchiostro text-carta"
                  : "border-secca bg-foglio"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setQuante(massimo)}
            aria-pressed={quante >= massimo}
            className={`border px-4 py-2 text-sm ${
              quante >= massimo
                ? "border-inchiostro bg-inchiostro text-carta"
                : "border-secca bg-foglio"
            }`}
          >
            Tutte <span className="tabular font-mono text-xs opacity-60">{massimo}</span>
          </button>
        </div>
      </section>

      <footer className="fixed inset-x-0 bottom-0 border-t border-secca bg-carta/95 backdrop-blur">
        <div className="mx-auto w-full max-w-xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            onClick={avvia}
            disabled={massimo === 0}
            className="titolo w-full bg-inchiostro px-4 py-3.5 text-lg text-carta disabled:opacity-35"
          >
            {massimo === 0 ? (
              "Nessuna domanda con questi filtri"
            ) : (
              <>
                Inizia con{" "}
                <span className="tabular font-mono">
                  {Math.min(quante, massimo)}
                </span>{" "}
                domande
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  )
}
