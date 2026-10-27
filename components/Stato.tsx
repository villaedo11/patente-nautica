"use client"

import Link from "next/link"

export function Caricamento({ cosa = "le domande" }: { cosa?: string }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-24 text-center">
      <p className="etichetta-carta text-tenue">Sto caricando {cosa}…</p>
    </div>
  )
}

export function Errore({ messaggio }: { messaggio: string }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-20">
      <h1 className="titolo text-2xl">Le domande non si caricano</h1>
      <p className="mt-2 text-tenue">
        Serve la rete al primo avvio: il file dei quesiti si scarica una volta
        sola e poi resta in cache. Dettaglio tecnico: {messaggio}.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="titolo bg-inchiostro px-5 py-3 text-carta"
        >
          Riprova
        </button>
        <Link href="/" className="titolo border border-secca px-5 py-3">
          Torna all&apos;inizio
        </Link>
      </div>
    </div>
  )
}
