"use client"

import { useEffect } from "react"

/** Registra il service worker che tiene l'app utilizzabile senza rete.
 *  Niente UI: se il browser non lo supporta, il sito funziona comunque. */
export default function Offline() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* contesto non sicuro o registrazione negata: si resta online-only */
    })
  }, [])

  return null
}
