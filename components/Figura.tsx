"use client"

import { useState } from "react"

/** La figura della domanda, presentata come un riquadro di carta: fondo
 *  acqua, filetto magenta, tacche agli angoli. Al tocco si apre a schermo
 *  pieno, perche' alcune tavole (fanali, simboli IALA) hanno dettagli
 *  minuscoli e sul telefono non si leggono.  */
export default function Figura({ file, alt }: { file: string; alt: string }) {
  const [aperta, setAperta] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAperta(true)}
        className="group relative block w-full cursor-zoom-in border border-magenta/40 bg-carta p-2"
        aria-label="Ingrandisci la figura"
      >
        <span aria-hidden className="absolute left-0 top-0 h-2 w-2 border-l border-t border-magenta" />
        <span aria-hidden className="absolute right-0 top-0 h-2 w-2 border-r border-t border-magenta" />
        <span aria-hidden className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-magenta" />
        <span aria-hidden className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-magenta" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/figure/${file}`}
          alt={alt}
          className="mx-auto max-h-44 w-auto object-contain"
        />
      </button>

      {aperta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Figura ingrandita"
          onClick={() => setAperta(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-inchiostro/90 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/figure/${file}`}
            alt={alt}
            className="max-h-full max-w-full bg-white object-contain p-2"
          />
          <button
            type="button"
            onClick={() => setAperta(false)}
            className="absolute right-4 top-4 rounded-full bg-foglio px-4 py-2 text-sm titolo"
          >
            Chiudi
          </button>
        </div>
      )}
    </>
  )
}
