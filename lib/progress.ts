"use client"

import { useSyncExternalStore } from "react"
import type { Item, Mode } from "./types"

const CHIAVE = "pn.v1"

/** Per ogni domanda incontrata: viste, errori, e se e' ancora "aperta",
 *  cioe' sbagliata e non ancora recuperata. Solo le domande toccate finiscono
 *  qui, quindi il record resta piccolo anche dopo mesi. */
export type Scheda = { viste: number; errori: number; aperta: boolean }

export type Sessione = {
  /** ISO, troncato ai minuti. */
  t: string
  modo: Mode
  n: number
  giuste: number
  secondi: number
}

export type Progressi = {
  schede: Record<string, Scheda>
  sessioni: Sessione[]
}

const VUOTO: Progressi = { schede: {}, sessioni: [] }

/** Snapshot memorizzato: useSyncExternalStore richiede che fra una modifica
 *  e l'altra l'oggetto resti lo stesso, altrimenti rirenderizza all'infinito. */
let cache: Progressi | null = null
const ascoltatori = new Set<() => void>()

function invalida(): void {
  cache = null
  for (const f of ascoltatori) f()
}

function leggi(): Progressi {
  if (typeof window === "undefined") return VUOTO
  if (cache) return cache
  cache = analizza()
  return cache
}

function analizza(): Progressi {
  try {
    const raw = window.localStorage.getItem(CHIAVE)
    if (!raw) return VUOTO
    const p = JSON.parse(raw) as Partial<Progressi>
    return { schede: p.schede ?? {}, sessioni: p.sessioni ?? [] }
  } catch {
    // dati illeggibili (quota, navigazione privata, formato vecchio):
    // si riparte puliti invece di bloccare l'app
    return VUOTO
  }
}

function scrivi(p: Progressi): void {
  try {
    window.localStorage.setItem(CHIAVE, JSON.stringify(p))
  } catch {
    /* quota piena o storage negato: l'esercitazione continua comunque */
  }
  invalida()
}

/** Registra l'esito di una singola domanda. In allenamento e ripasso si
 *  chiama al tocco, perche' li' la risposta e' definitiva: cosi' una sessione
 *  interrotta a meta' non va persa. In esame si chiama solo alla consegna,
 *  perche' fino ad allora la risposta si puo' ancora cambiare. */
export function registraRisposta(id: string, giusta: boolean): void {
  const p = leggi()
  const s = p.schede[id] ?? { viste: 0, errori: 0, aperta: false }
  s.viste++
  if (giusta) s.aperta = false // recuperata
  else {
    s.errori++
    s.aperta = true
  }
  p.schede[id] = s
  scrivi(p)
}

export function chiudiSessione(items: Item[], modo: Mode, secondi: number): void {
  // In esame il conteggio per domanda si fa adesso, tutto insieme.
  if (modo === "esame") {
    for (const it of items) {
      registraRisposta(it.question.id, it.given !== null && it.given === it.correct)
    }
  }
  const p = leggi()
  const giuste = items.filter((it) => it.given !== null && it.given === it.correct).length
  p.sessioni.unshift({
    t: new Date().toISOString().slice(0, 16),
    modo,
    n: items.length,
    giuste,
    secondi: Math.round(secondi),
  })
  p.sessioni = p.sessioni.slice(0, 100)
  scrivi(p)
}

export function azzera(): void {
  try {
    window.localStorage.removeItem(CHIAVE)
  } catch {
    /* niente da azzerare */
  }
  invalida()
}

function sottoscrivi(f: () => void): () => void {
  ascoltatori.add(f)
  // "storage" arriva solo dalle altre schede: tiene allineate due finestre
  // aperte sullo stesso ripasso.
  const esterno = (e: StorageEvent) => {
    if (e.key === CHIAVE || e.key === null) invalida()
  }
  window.addEventListener("storage", esterno)
  return () => {
    ascoltatori.delete(f)
    window.removeEventListener("storage", esterno)
  }
}

/** I progressi stanno in localStorage, che per React e' una sorgente esterna:
 *  useSyncExternalStore evita il setState dentro un effect e fa combaciare il
 *  primo render con l'HTML statico (il server non ha localStorage). */
export function useProgressi(): Progressi {
  return useSyncExternalStore(sottoscrivi, leggi, () => VUOTO)
}

export function idAperti(p: Progressi): string[] {
  return Object.keys(p.schede).filter((id) => p.schede[id].aperta)
}
