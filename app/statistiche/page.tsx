"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Caricamento, Errore } from "@/components/Stato"
import taxonomy from "@/data/taxonomy.json"
import { useQuestions } from "@/lib/data"
import { azzera, useProgressi } from "@/lib/progress"
import { formatTempo, siglaTema } from "@/lib/quiz"

type Conteggio = { viste: number; errori: number; domande: number; toccate: number }

const ZERO = (): Conteggio => ({ viste: 0, errori: 0, domande: 0, toccate: 0 })

function percento(c: Conteggio): number | null {
  return c.viste === 0 ? null : Math.round(((c.viste - c.errori) / c.viste) * 100)
}

/** Barra di precisione nello stesso linguaggio della scala delle latitudini:
 *  contorno a filetto, riempimento pieno. */
function Barra({ valore }: { valore: number | null }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-[2px] border border-inchiostro/60">
      {valore !== null && (
        <div
          className={valore >= 80 ? "h-full bg-dritta" : valore >= 60 ? "h-full bg-inchiostro/60" : "h-full bg-sinistra"}
          style={{ width: `${valore}%` }}
        />
      )}
    </div>
  )
}

export default function Statistiche() {
  const { stato, domande, errore } = useQuestions()
  const [progressi, ricarica] = useProgressi()
  const [aperto, setAperto] = useState<string | null>(null)

  const { perTema, perVoce, totale } = useMemo(() => {
    const perTema = new Map<string, Conteggio>()
    const perVoce = new Map<string, Conteggio>()
    const totale = ZERO()
    for (const q of domande ?? []) {
      const t = perTema.get(q.tema) ?? ZERO()
      const v = perVoce.get(q.voce) ?? ZERO()
      t.domande++
      v.domande++
      const s = progressi.schede[q.id]
      if (s) {
        for (const c of [t, v, totale]) {
          c.viste += s.viste
          c.errori += s.errori
          c.toccate++
        }
      }
      totale.domande++
      perTema.set(q.tema, t)
      perVoce.set(q.voce, v)
    }
    return { perTema, perVoce, totale }
  }, [domande, progressi])

  if (stato === "errore") return <Errore messaggio={errore} />
  if (stato === "carico") return <Caricamento cosa="le statistiche" />

  const complessiva = percento(totale)

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-8">
      <Link href="/" className="text-sm text-tenue hover:text-inchiostro">
        ← Esci
      </Link>
      <h1 className="titolo mt-2 text-3xl">Statistiche</h1>

      {totale.viste === 0 ? (
        <p className="mt-4 text-tenue">
          Qui compariranno le percentuali per tema e per voce. Fai una prima
          esercitazione e torna.
        </p>
      ) : (
        <>
          <p className="mt-3 text-lg">
            <span className="tabular font-mono text-2xl">{complessiva}%</span>{" "}
            di risposte esatte su{" "}
            <span className="tabular font-mono">{totale.viste}</span> tentativi
          </p>
          <p className="text-sm text-tenue tabular">
            {totale.toccate} domande incontrate su {totale.domande}
          </p>

          <section className="mt-8">
            <h2 className="titolo border-b border-secca pb-2 text-xl">Per tema</h2>
            <ul className="divide-y divide-secca">
              {taxonomy.map((t) => {
                const c = perTema.get(t.tema) ?? ZERO()
                const p = percento(c)
                const espanso = aperto === t.tema
                return (
                  <li key={t.tema} className="py-3">
                    <button
                      type="button"
                      onClick={() => setAperto(espanso ? null : t.tema)}
                      aria-expanded={espanso}
                      className="w-full text-left"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="titolo">{siglaTema(t.tema)}</span>
                        <span className="tabular font-mono text-sm">
                          {p === null ? (
                            <span className="text-tenue">—</span>
                          ) : (
                            `${p}%`
                          )}
                          <span className="ml-2 text-xs text-tenue">
                            {c.toccate}/{c.domande}
                          </span>
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <Barra valore={p} />
                      </div>
                    </button>

                    {espanso && (
                      <ul className="mt-3 space-y-2 border-l border-secca pl-3">
                        {t.voci.map((v) => {
                          const cv = perVoce.get(v.voce) ?? ZERO()
                          const pv = percento(cv)
                          return (
                            <li key={v.voce}>
                              <div className="flex items-baseline justify-between gap-3">
                                <span className="flex-1 text-sm leading-snug">
                                  {v.voce}
                                </span>
                                <span className="tabular font-mono text-xs">
                                  {pv === null ? (
                                    <span className="text-tenue">—</span>
                                  ) : (
                                    `${pv}%`
                                  )}
                                  <span className="ml-1.5 text-tenue">
                                    {cv.toccate}/{cv.domande}
                                  </span>
                                </span>
                              </div>
                              <div className="mt-1">
                                <Barra valore={pv} />
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          {progressi.sessioni.length > 0 && (
            <section className="mt-10">
              <h2 className="titolo border-b border-secca pb-2 text-xl">
                Sessioni
              </h2>
              <ul className="divide-y divide-secca text-sm">
                {progressi.sessioni.slice(0, 20).map((s, k) => (
                  <li key={k} className="flex items-baseline gap-3 py-2">
                    <span className="tabular font-mono text-xs text-tenue">
                      {s.t.replace("T", " ")}
                    </span>
                    <span className="etichetta-carta flex-1 truncate">
                      {s.modo}
                    </span>
                    <span className="tabular font-mono">
                      {s.giuste}/{s.n}
                    </span>
                    <span className="tabular font-mono text-xs text-tenue">
                      {formatTempo(s.secondi)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <button
            type="button"
            onClick={() => {
              if (confirm("Cancello statistiche, sessioni ed errori in sospeso?")) {
                azzera()
                ricarica()
              }
            }}
            className="titolo mt-10 border border-sinistra px-4 py-2.5 text-sm text-sinistra"
          >
            Azzera tutto
          </button>
        </>
      )}
    </div>
  )
}
