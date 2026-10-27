export type Question = {
  /** Progressivo ministeriale, es. "1.1.1-10". Chiave stabile fra revisioni. */
  id: string
  /** Numero d'ordine nell'allegato, 1..1472. */
  n: number
  q: string
  a: [string, string, string] | string[]
  /** Indice della risposta esatta nell'ordine originale dell'allegato. */
  correct: number
  tema: string
  voce: string
  /** File dentro /figure, oppure null. */
  img: string | null
}

export type Taxonomy = {
  tema: string
  n: number
  voci: { voce: string; n: number }[]
}[]

export type Mode = "allenamento" | "esame" | "ripasso"

/** Una domanda preparata per la sessione: le risposte sono gia' mescolate. */
export type Item = {
  question: Question
  /** order[i] = indice originale della risposta mostrata in posizione i. */
  order: number[]
  /** Posizione della risposta esatta dopo il mescolamento. */
  correct: number
  /** Posizione scelta dall'utente, null se non ha ancora risposto. */
  given: number | null
}
