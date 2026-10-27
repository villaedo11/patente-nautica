"use client"

import Link from "next/link"
import taxonomy from "@/data/taxonomy.json"
import { idAperti, useProgressi } from "@/lib/progress"
import {
  COMPOSIZIONE_ESAME,
  DOMANDE_ESAME,
  ERRORI_AMMESSI,
  MINUTI_ESAME,
  siglaTema,
} from "@/lib/quiz"

const TOTALE = taxonomy.reduce((s, t) => s + t.n, 0)

export default function Home() {
  const [progressi] = useProgressi()
  const aperti = idAperti(progressi)
  const viste = Object.keys(progressi.schede).length

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-10">
      <p className="etichetta-carta text-sm text-tenue">
        Decreto dirigenziale 131 · 31 maggio 2022
      </p>
      <h1 className="titolo mt-1 text-[2.6rem] leading-[1.05]">
        Patente nautica
      </h1>
      <p className="titolo text-[1.4rem] leading-tight text-magenta">
        entro 12 miglia · a motore
      </p>

      {/* La prova, nella sua composizione ufficiale: questo e' il documento,
          non un riassunto. */}
      <section className="mt-8 border border-inchiostro/70 bg-foglio">
        <div className="flex items-baseline justify-between border-b border-secca px-4 py-3">
          <h2 className="titolo text-lg">La prova</h2>
          <p className="tabular font-mono text-xs text-tenue">
            {DOMANDE_ESAME} quesiti · {MINUTI_ESAME}′ · max {ERRORI_AMMESSI} errori
          </p>
        </div>

        <ul className="divide-y divide-secca">
          {COMPOSIZIONE_ESAME.map(({ tema, n }) => (
            <li key={tema} className="flex items-center gap-3 px-4 py-2">
              <span className="flex-1 text-sm">{siglaTema(tema)}</span>
              <span className="flex gap-1" aria-hidden>
                {Array.from({ length: n }, (_, k) => (
                  <span
                    key={k}
                    className="h-2.5 w-2.5 rounded-full border border-inchiostro/70"
                  />
                ))}
              </span>
              <span className="tabular w-4 text-right font-mono text-sm text-tenue">
                {n}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-secca p-4">
          <Link
            href="/esame"
            className="titolo block bg-magenta px-4 py-3.5 text-center text-lg text-white"
          >
            Inizia la simulazione
          </Link>
        </div>
      </section>

      <nav className="mt-6 grid gap-2.5">
        <Link
          href="/allenamento"
          className="flex items-center justify-between border border-secca bg-foglio px-4 py-4"
        >
          <span>
            <span className="titolo block text-lg">Allenamento</span>
            <span className="text-sm text-tenue">
              Scegli tema, voce e quante domande
            </span>
          </span>
          <span aria-hidden className="text-tenue">
            →
          </span>
        </Link>

        <Link
          href="/ripasso"
          aria-disabled={aperti.length === 0}
          className={`flex items-center justify-between border border-secca bg-foglio px-4 py-4 ${
            aperti.length === 0 ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <span>
            <span className="titolo block text-lg">Ripassa gli errori</span>
            <span className="text-sm text-tenue">
              {aperti.length === 0
                ? "Nessun errore in sospeso"
                : `${aperti.length} domande ancora da risolvere`}
            </span>
          </span>
          <span aria-hidden className="text-tenue">
            →
          </span>
        </Link>

        <Link
          href="/statistiche"
          className="flex items-center justify-between border border-secca bg-foglio px-4 py-4"
        >
          <span>
            <span className="titolo block text-lg">Statistiche</span>
            <span className="tabular text-sm text-tenue">
              {viste} domande incontrate su {TOTALE}
            </span>
          </span>
          <span aria-hidden className="text-tenue">
            →
          </span>
        </Link>
      </nav>

      <p className="etichetta-carta mt-10 text-xs leading-relaxed text-tenue">
        {TOTALE} quesiti base trascritti dall&apos;allegato A. Le statistiche
        restano su questo dispositivo.
      </p>
    </div>
  )
}
