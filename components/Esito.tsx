"use client"

import Link from "next/link"
import { useState } from "react"
import Figura from "./Figura"
import { ERRORI_AMMESSI, esito, siglaTema } from "@/lib/quiz"
import type { Item, Mode } from "@/lib/types"

export default function Esito({
  items,
  modo,
  onRicomincia,
}: {
  items: Item[]
  modo: Mode
  onRicomincia: () => void
}) {
  const [apertaId, setApertaId] = useState<string | null>(null)
  const r = esito(items)
  const esame = modo === "esame"
  const sbagliate = items.filter((it) => it.given !== it.correct)

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-8">
      <p className="etichetta-carta text-sm text-tenue">
        {esame ? "Simulazione d'esame" : modo === "ripasso" ? "Ripasso" : "Allenamento"}
      </p>

      <h1 className="titolo mt-1 text-4xl">
        {esame ? (r.idoneo ? "Idoneo" : "Non idoneo") : "Sessione chiusa"}
      </h1>

      <p className="mt-2 text-lg">
        <span className="tabular font-mono">
          {r.giuste}/{items.length}
        </span>{" "}
        risposte esatte
        {r.omesse > 0 && (
          <span className="text-tenue"> · {r.omesse} lasciate in bianco</span>
        )}
      </p>

      {esame && (
        <p className="mt-1 text-sm text-tenue">
          {r.sbagliate} errori su {ERRORI_AMMESSI} ammessi. Le risposte omesse
          contano come errate.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRicomincia}
          className="titolo bg-inchiostro px-5 py-3 text-base text-carta"
        >
          {esame ? "Nuova simulazione" : "Altre domande"}
        </button>
        <Link
          href="/"
          className="titolo border border-secca px-5 py-3 text-base"
        >
          Torna all&apos;inizio
        </Link>
      </div>

      {sbagliate.length > 0 && (
        <section className="mt-10">
          <h2 className="titolo border-b border-secca pb-2 text-xl">
            Da rivedere ({sbagliate.length})
          </h2>
          <ul className="divide-y divide-secca">
            {sbagliate.map((it) => {
              const aperta = apertaId === it.question.id
              return (
                <li key={it.question.id} className="py-3">
                  <button
                    type="button"
                    onClick={() => setApertaId(aperta ? null : it.question.id)}
                    aria-expanded={aperta}
                    className="w-full text-left"
                  >
                    <span className="etichetta-carta text-xs text-tenue">
                      {siglaTema(it.question.tema)}
                    </span>
                    <span className="mt-0.5 block leading-snug">
                      {it.question.q}
                    </span>
                  </button>

                  {aperta && (
                    <div className="mt-3 space-y-2">
                      {it.question.img && (
                        <Figura
                          file={it.question.img}
                          alt={`Figura della domanda ${it.question.id}`}
                        />
                      )}
                      <p className="border-l-2 border-dritta bg-dritta/10 px-3 py-2 text-sm">
                        <span className="titolo block text-xs uppercase tracking-wide text-dritta">
                          Esatta
                        </span>
                        {it.question.a[it.question.correct]}
                      </p>
                      {it.given !== null && (
                        <p className="border-l-2 border-sinistra bg-sinistra/10 px-3 py-2 text-sm">
                          <span className="titolo block text-xs uppercase tracking-wide text-sinistra">
                            La tua
                          </span>
                          {it.question.a[it.order[it.given]]}
                        </p>
                      )}
                      <p className="etichetta-carta text-xs text-tenue">
                        {it.question.voce}
                      </p>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-sm text-tenue">
            Queste domande restano in &ldquo;Ripassa gli errori&rdquo; finche&apos; non le
            risolvi.
          </p>
        </section>
      )}
    </div>
  )
}
