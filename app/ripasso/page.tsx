"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import Runner from "@/components/Runner"
import { Caricamento, Errore } from "@/components/Stato"
import { useQuestions } from "@/lib/data"
import { idAperti, useProgressi } from "@/lib/progress"
import { pick, toItem } from "@/lib/quiz"
import type { Item } from "@/lib/types"

/** Un ripasso non dovrebbe essere una maratona: meglio tornarci spesso. */
const MAX_PER_GIRO = 25

export default function Ripasso() {
  const { stato, domande, errore } = useQuestions()
  const progressi = useProgressi()
  const [items, setItems] = useState<Item[] | null>(null)

  const aperte = useMemo(() => {
    if (!domande) return []
    const apertiSet = new Set(idAperti(progressi))
    return domande.filter((q) => apertiSet.has(q.id))
  }, [domande, progressi])

  if (stato === "errore") return <Errore messaggio={errore} />
  if (stato === "carico") return <Caricamento cosa="i tuoi errori" />

  if (items) {
    return (
      <Runner
        iniziali={items}
        modo="ripasso"
        onRicomincia={() => setItems(null)}
      />
    )
  }

  if (aperte.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-20">
        <h1 className="titolo text-3xl">Nessun errore in sospeso</h1>
        <p className="mt-2 text-tenue">
          Le domande sbagliate finiscono qui e ci restano finché non le
          risolvi. Al momento non ce n’è nessuna.
        </p>
        <Link
          href="/allenamento"
          className="titolo mt-6 inline-block bg-inchiostro px-5 py-3 text-carta"
        >
          Vai all&apos;allenamento
        </Link>
      </div>
    )
  }

  const quante = Math.min(MAX_PER_GIRO, aperte.length)

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-10">
      <Link href="/" className="text-sm text-tenue hover:text-inchiostro">
        ← Esci
      </Link>
      <h1 className="titolo mt-2 text-3xl">Ripassa gli errori</h1>
      <p className="mt-2 text-tenue">
        <span className="tabular font-mono">{aperte.length}</span> domande
        sbagliate e non ancora recuperate. Una domanda esce da questa lista
        quando la risolvi.
      </p>

      <button
        type="button"
        onClick={() => setItems(pick(aperte, quante).map(toItem))}
        className="titolo mt-8 w-full bg-inchiostro px-4 py-4 text-lg text-carta"
      >
        Ripassane <span className="tabular font-mono">{quante}</span>
      </button>
    </div>
  )
}
