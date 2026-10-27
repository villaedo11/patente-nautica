"use client"

import { useCallback, useEffect, useState } from "react"
import Runner from "@/components/Runner"
import { Caricamento, Errore } from "@/components/Stato"
import { useQuestions } from "@/lib/data"
import { componiEsame } from "@/lib/quiz"
import type { Item } from "@/lib/types"

export default function Esame() {
  const { stato, domande, errore } = useQuestions()
  const [items, setItems] = useState<Item[] | null>(null)
  const [giro, setGiro] = useState(0)

  // Il cronometro parte appena le domande sono pronte: la scelta di fare
  // l'esame e' gia' stata confermata dalla home.
  useEffect(() => {
    if (domande) setItems(componiEsame(domande))
  }, [domande, giro])

  const ricomincia = useCallback(() => setGiro((g) => g + 1), [])

  if (stato === "errore") return <Errore messaggio={errore} />
  if (!items) return <Caricamento cosa="la simulazione" />

  return (
    <Runner key={giro} iniziali={items} modo="esame" onRicomincia={ricomincia} />
  )
}
