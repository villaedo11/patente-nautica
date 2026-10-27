# Patente nautica — entro 12 miglia, a motore

Esercitazioni e simulazione d'esame sui **1472 quesiti base** dell'allegato A
al DD 131 del 31 maggio 2022.

Tre modalità:

| | |
|---|---|
| **Allenamento** | Filtri per tema e voce, 10/20/40/tutte, correzione subito dopo ogni risposta. |
| **Simulazione d'esame** | 20 domande nella ripartizione ufficiale, 30 minuti, correzione finale, idoneo fino a 4 errori. |
| **Ripassa gli errori** | Ripesca le domande sbagliate finché non le risolvi. |

Statistiche e storico restano in `localStorage`: nessun account, nessun
database, nessun dato che lascia il telefono.

## Rigenerare il database dal PDF

I dati sono committati, quindi per sviluppare non serve il PDF. Serve solo se
il ministero pubblica una revisione.

```bash
pip install pdfplumber Pillow
python scripts/extract_quiz.py "ALLEGATO A QUIZ PATENTI NAUTICHE DD 131 DEL 31 MAGGIO 2022.pdf"
```

Produce `public/data/questions.json`, `data/taxonomy.json` e le immagini in
`public/figure/`. Lo script si ferma con exit code diverso da zero se un
controllo di integrità fallisce, così una revisione del PDF non passa
inosservata.

### Cosa è stato necessario capire del PDF

- Il quiz base occupa le **pagine 1‑246**: 5 righe nella prima, 6 in tutte le
  altre. Le pagine 247‑279 sono il quiz vela, che non serve per questa
  abilitazione.
- La griglia della tabella è identica su ogni pagina, ma alcune pagine hanno
  **righe verticali spurie fuori tabella** (pagina 56, x=812). Dedurre le
  colonne dai bordi faceva saltare quella pagina e con essa le domande
  330‑335: le colonne sono quindi costanti hardcoded.
- La colonna IMMAGINE non contiene testo ma un'immagine incorporata. Per 118
  domande è un **segnaposto che dice "figura N"**; l'immagine vera sta nelle
  tavole delle pagine 280‑286. I segnaposto compaiono in ordine non
  decrescente, quindi l'ordine di prima apparizione dei gruppi distinti dà il
  numero di figura — ma solo a risoluzione ≥ 24×24, perché a 16×16 numeri
  diversi collidono.
- Le tavole **non sono griglie regolari** (pagina 284 ha una riga con immagini
  di altezze diverse, pagina 286 ne ha quattro per riga), quindi le figure si
  accoppiano al numero stampato accanto, non all'ordine di lettura.
- Il quiz base usa le figure **1‑101**; la 102 e la 103 sono solo del vela.

### Correzioni al PDF ufficiale

Applicate in `MANUAL_FIXES` dentro lo script, con la motivazione accanto.

- **`1.2.1-55`** (pagina 38, "Per «S drive» si intende") marca `V` sia la
  risposta 1 sia la 3. La 1 è la definizione di saildrive; la 3 descrive il
  common rail. Si tiene la 1.
- **`1.8.2-5`** marca la risposta esatta con `v` minuscola: normalizzata dal
  parser, non serve una correzione manuale.

## Sviluppo

```bash
npm install
npm run dev
```

Next.js 16 (App Router) + Tailwind v4. Nessuna dipendenza a runtime oltre
React: tutte le rotte sono statiche e la logica sta nel browser.
