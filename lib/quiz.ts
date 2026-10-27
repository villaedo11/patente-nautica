import type { Item, Question } from "./types"

/** Composizione ufficiale del quiz base: 20 quesiti cosi' ripartiti.
 *  Fonte: allegato al DD 131/2022, tabella "TEMI QUIZ BASE". */
export const COMPOSIZIONE_ESAME: { tema: string; n: number }[] = [
  { tema: "TEORIA DELLO SCAFO", n: 1 },
  { tema: "MOTORI", n: 1 },
  { tema: "SICUREZZA DELLA NAVIGAZIONE", n: 3 },
  { tema: "MANOVRA E CONDOTTA", n: 4 },
  { tema: "COLREG E SEGNALAMENTO MARITTIMO", n: 2 },
  { tema: "METEOROLOGIA", n: 2 },
  { tema: "NAVIGAZIONE CARTOGRAFICA ED ELETTRONICA", n: 4 },
  { tema: "NORMATIVA DIPORTISTICA E AMBIENTALE", n: 3 },
]

export const DOMANDE_ESAME = 20
export const ERRORI_AMMESSI = 4
export const MINUTI_ESAME = 30

/** Abbreviazioni per le etichette strette (scala, legenda, statistiche). */
export const SIGLA_TEMA: Record<string, string> = {
  "TEORIA DELLO SCAFO": "Scafo",
  MOTORI: "Motori",
  "SICUREZZA DELLA NAVIGAZIONE": "Sicurezza",
  "MANOVRA E CONDOTTA": "Manovra",
  "COLREG E SEGNALAMENTO MARITTIMO": "COLREG",
  METEOROLOGIA: "Meteo",
  "NAVIGAZIONE CARTOGRAFICA ED ELETTRONICA": "Navigazione",
  "NORMATIVA DIPORTISTICA E AMBIENTALE": "Normativa",
}

export function siglaTema(tema: string): string {
  return SIGLA_TEMA[tema] ?? tema
}

function shuffle<T>(input: T[]): T[] {
  const out = input.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function pick<T>(pool: T[], n: number): T[] {
  return shuffle(pool).slice(0, n)
}

/** Prepara una domanda per la sessione mescolando le risposte.
 *  Nell'allegato la risposta esatta sta spesso nella stessa posizione per
 *  blocchi interi: senza mescolare si impara la posizione, non la materia. */
export function toItem(question: Question): Item {
  const order = shuffle(question.a.map((_, i) => i))
  return {
    question,
    order,
    correct: order.indexOf(question.correct),
    given: null,
  }
}

/** Estrae 20 domande rispettando la ripartizione ufficiale per tema. */
export function componiEsame(all: Question[]): Item[] {
  const perTema = new Map<string, Question[]>()
  for (const q of all) {
    const list = perTema.get(q.tema)
    if (list) list.push(q)
    else perTema.set(q.tema, [q])
  }
  const scelte: Question[] = []
  for (const { tema, n } of COMPOSIZIONE_ESAME) {
    scelte.push(...pick(perTema.get(tema) ?? [], n))
  }
  // L'ordine dei temi nel questionario reale non e' quello della tabella.
  return shuffle(scelte).map(toItem)
}

export function esito(items: Item[]): {
  giuste: number
  sbagliate: number
  omesse: number
  idoneo: boolean
} {
  let giuste = 0
  let omesse = 0
  for (const it of items) {
    if (it.given === null) omesse++
    else if (it.given === it.correct) giuste++
  }
  // "Le risposte omesse o rettificate equivalgono a una risposta errata."
  const sbagliate = items.length - giuste
  return { giuste, sbagliate, omesse, idoneo: sbagliate <= ERRORI_AMMESSI }
}

export function formatTempo(secondi: number): string {
  const s = Math.max(0, Math.floor(secondi))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}
