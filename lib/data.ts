"use client"

import { useEffect, useState } from "react"
import type { Question } from "./types"

/** Le domande si scaricano una sola volta per sessione del browser e poi
 *  restano nella cache HTTP: il file e' immutabile finche' non cambia il DD. */
let pending: Promise<Question[]> | null = null

export function loadQuestions(): Promise<Question[]> {
  if (!pending) {
    pending = fetch("/data/questions.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<Question[]>
      })
      .catch((err) => {
        pending = null // un nuovo tentativo deve poter riprovare davvero
        throw err
      })
  }
  return pending
}

type State =
  | { stato: "carico"; domande: null; errore: null }
  | { stato: "pronto"; domande: Question[]; errore: null }
  | { stato: "errore"; domande: null; errore: string }

export function useQuestions(): State {
  const [state, setState] = useState<State>({
    stato: "carico",
    domande: null,
    errore: null,
  })

  useEffect(() => {
    let vivo = true
    loadQuestions().then(
      (domande) => vivo && setState({ stato: "pronto", domande, errore: null }),
      (err: Error) =>
        vivo && setState({ stato: "errore", domande: null, errore: err.message }),
    )
    return () => {
      vivo = false
    }
  }, [])

  return state
}
