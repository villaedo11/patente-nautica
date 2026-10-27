"use client"

import type { Item } from "@/lib/types"

/** L'avanzamento letto come il bordo graduato di una carta nautica: blocchi
 *  alternati, uno per domanda, come i primi di latitudine lungo il margine
 *  (dove 1' = 1 miglio). Il cursore magenta e' la posizione corrente.
 *
 *  In esame i blocchi dicono solo "risposta data": il colore arriverebbe a
 *  correzione finita. In allenamento dicono anche l'esito. */
export default function ScalaLatitudini({
  items,
  corrente,
  riveleEsito,
  onVai,
}: {
  items: Item[]
  corrente: number
  riveleEsito: boolean
  onVai?: (i: number) => void
}) {
  const fitta = items.length > 28

  return (
    <div className="select-none">
      <div className="flex h-5 overflow-hidden rounded-[2px] border border-inchiostro/70">
        {items.map((it, i) => {
          const risposto = it.given !== null
          const giusta = risposto && it.given === it.correct
          const base = i % 2 === 0 ? "bg-transparent" : "bg-inchiostro/[0.07]"

          let stato = base
          if (risposto) {
            if (!riveleEsito) stato = "bg-inchiostro/70"
            else stato = giusta ? "bg-dritta" : "bg-sinistra"
          }

          const Cella = onVai ? "button" : "div"
          return (
            <Cella
              key={it.question.id}
              {...(onVai
                ? {
                    type: "button" as const,
                    onClick: () => onVai(i),
                    "aria-label": `Vai alla domanda ${i + 1}${
                      risposto ? ", risposta data" : ""
                    }`,
                  }
                : {})}
              className={`relative flex-1 border-inchiostro/25 ${
                i > 0 && !fitta ? "border-l" : ""
              } ${stato} ${onVai ? "cursor-pointer" : ""}`}
            >
              {i === corrente && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 top-0 border-x-2 border-magenta"
                />
              )}
            </Cella>
          )
        })}
      </div>

      {/* Tacche ogni 5 domande, come le etichette dei primi sul margine. */}
      {!fitta && (
        <div className="mt-1 flex text-[10px] text-tenue tabular">
          {items.map((_, i) => (
            <span key={i} className="flex-1 text-center">
              {(i + 1) % 5 === 0 ? i + 1 : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
