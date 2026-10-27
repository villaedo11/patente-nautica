"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
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
  const [progressi, ricaricaProgressi] = useProgressi()
  const [items, setItems] = useState<Item[] | null>(null)
  const [pronto, setPronto] = useState(false)

  const prepara = useCallback(() => {
    if (!domande) return
    const aperti = new Set(idAperti(progressi))
    const pool = domande.filter((q) => aperti.has(q.id))
    setItems(pick(pool, Math.min(MAX_PER_GIRO, pool.length)).map(toItem))
    setPronto(true)
  }, [domande, progressi])

  useEffect(prepara, [prepara])

  const ricomincia = useCallback(() => {
    ricaricaProgressi()
    setItems(null)
    setPronto(false)
  }, [ricaricaProgressi])

  if (stato === "errore") return <Errore messaggio={errore} />
  if (!pronto || !items) return <Caricamento cosa="i tuoi errori" />

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-20">
        <h1 className="titolo text-3xl">Nessun errore in sospeso</h1>
        <p className="mt-2 text-tenue">
          Le domande sbagliate finiscono qui e ci restano finche&apos; non le
          risolvi. Al momento non ce n&apos;e&apos; nessuna.
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

  return <Runner iniziali={items} modo="ripasso" onRicomincia={ricomincia} />
}
