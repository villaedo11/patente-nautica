"use client"

import { useCallback, useEffect, useState } from "react"
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

function leggi(): Progressi {
  if (typeof window === "undefined") return VUOTO
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
}

export function registraSessione(items: Item[], modo: Mode, secondi: number): void {
  const p = leggi()
  let giuste = 0
  for (const it of items) {
    const id = it.question.id
    const s = p.schede[id] ?? { viste: 0, errori: 0, aperta: false }
    s.viste++
    if (it.given !== null && it.given === it.correct) {
      giuste++
      s.aperta = false // recuperata
    } else {
      s.errori++
      s.aperta = true
    }
    p.schede[id] = s
  }
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
}

/** Legge i progressi dopo il montaggio: il server non ha localStorage, quindi
 *  il primo render deve corrispondere a quello statico o l'idratazione rompe. */
export function useProgressi(): [Progressi, () => void] {
  const [p, setP] = useState<Progressi>(VUOTO)
  const ricarica = useCallback(() => setP(leggi()), [])
  useEffect(ricarica, [ricarica])
  return [p, ricarica]
}

export function idAperti(p: Progressi): string[] {
  return Object.keys(p.schede).filter((id) => p.schede[id].aperta)
}
