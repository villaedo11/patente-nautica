"use client"

import Link from "next/link"
import { useState } from "react"
import Runner from "@/components/Runner"
import { Caricamento, Errore } from "@/components/Stato"
import { useQuestions } from "@/lib/data"
import {
  COMPOSIZIONE_ESAME,
  DOMANDE_ESAME,
  ERRORI_AMMESSI,
  MINUTI_ESAME,
  componiEsame,
  siglaTema,
} from "@/lib/quiz"
import type { Item } from "@/lib/types"

export default function Esame() {
  const { stato, domande, errore } = useQuestions()
  const [items, setItems] = useState<Item[] | null>(null)

  if (stato === "errore") return <Errore messaggio={errore} />
  if (stato === "carico") return <Caricamento cosa="la simulazione" />

  if (items) {
    return (
      <Runner
        iniziali={items}
        modo="esame"
        onRicomincia={() => setItems(componiEsame(domande))}
      />
    )
  }

  // Il cronometro parte al tocco, non al caricamento della pagina: trenta
  // minuti non devono scorrere mentre il telefono scarica i quesiti.
  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-10">
      <Link href="/" className="text-sm text-tenue hover:text-inchiostro">
        ← Esci
      </Link>
      <h1 className="titolo mt-2 text-3xl">Simulazione d&apos;esame</h1>

      <dl className="mt-6 divide-y divide-secca border-y border-secca">
        {[
          ["Quesiti", `${DOMANDE_ESAME}, nella ripartizione ufficiale`],
          ["Tempo", `${MINUTI_ESAME} minuti, poi la prova si chiude da sola`],
          ["Soglia", `idoneo fino a ${ERRORI_AMMESSI} errori`],
          ["Risposte in bianco", "contano come errate"],
          ["Correzione", "alla consegna, non durante"],
        ].map(([voce, valore]) => (
          <div key={voce} className="flex gap-4 py-2.5">
            <dt className="etichetta-carta w-40 shrink-0 text-sm text-tenue">
              {voce}
            </dt>
            <dd className="text-sm">{valore}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 text-sm text-tenue">
        Puoi tornare indietro sulle domande e cambiare risposta finché non
        consegni. La barra in alto ti porta a qualsiasi quesito:{" "}
        {COMPOSIZIONE_ESAME.map(({ tema }) => siglaTema(tema)).join(", ")}.
      </p>

      <button
        type="button"
        onClick={() => setItems(componiEsame(domande))}
        className="titolo mt-8 w-full bg-magenta px-4 py-4 text-lg text-su-magenta"
      >
        Avvia la prova e il cronometro
      </button>
    </div>
  )
}
