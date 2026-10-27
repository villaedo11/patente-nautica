"""
Estrae il database quiz BASE dall'ALLEGATO A del DD 131 del 31/05/2022.

Produce:
  public/data/questions.json  le domande BASE (scaricate a runtime, ~590 KB)
  data/taxonomy.json          temi -> voci con conteggi (importata nel bundle)
  public/figure/NNN.webp      le figure numerate (pagine 280-286 del PDF)
  public/figure/qID.webp      le immagini inline (nella colonna IMMAGINE)

Uso:
  pip install pdfplumber Pillow
  python scripts/extract_quiz.py "percorso/ALLEGATO A ....pdf"

Note sul PDF (verificate, non assumere):
- Le pagine 1-246 contengono il quiz BASE, 5 righe nella pagina 1 e 6 in tutte
  le altre, per un totale di 1472 domande numerate progressivamente.
- La griglia della tabella e' identica su ogni pagina, ma alcune pagine hanno
  righe verticali spurie fuori tabella (es. pagina 56, x=812): per questo le
  colonne sono costanti hardcoded e non dedotte dai bordi.
- La colonna IMMAGINE non contiene testo ma un'immagine incorporata. Per 120
  domande e' un segnaposto che dice "figura N" e rimanda alle tavole delle
  pagine 280-286; per le altre e' direttamente il disegno della domanda.
"""

from __future__ import annotations

import hashlib
import io
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import pdfplumber
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
PUBDATA = ROOT / "public" / "data"
FIGDIR = ROOT / "public" / "figure"

# Bordi verticali della tabella, costanti su tutte le pagine del quiz.
COLS = [18.6, 51.6, 131.6, 281.1, 353.2, 367.0, 438.4, 451.7,
        521.0, 534.6, 575.5, 616.0, 688.7, 768.2]
(C_NUM, C_IMG, C_Q, C_A1, C_V1, C_A2, C_V2, C_A3, C_V3,
 C_PROG, C_CAP, C_TEMA, C_VOCE) = range(13)

QUIZ_PAGES = range(0, 246)       # 0-based: pagine 1-246
FIGURE_PAGES = range(279, 286)   # 0-based: pagine 280-286
EXPECTED_QUESTIONS = 1472
EXPECTED_FIGURES = 103           # nelle tavole: 1..103
EXPECTED_BASE_FIGURES = 101      # referenziate dal quiz BASE: 1..101 (102-103 sono VELA)

# Correzioni alle anomalie del PDF ufficiale, verificate a mano sulla pagina
# indicata. Il valore e' l'indice (0-based) della risposta corretta.
MANUAL_FIXES: dict[str, int] = {
    # Pagina 38, domanda 226: il PDF marca "V" sia la risposta 1 sia la 3.
    # La 1 ("il piedino [...] due ingranaggi conici [...] in luogo della linea
    # d'asse") e' la definizione di S-drive; la 3 ("circuito di alimentazione
    # degli iniettori") descrive il common rail. Refuso della Gazzetta.
    "1.2.1-55": 0,
}


def clusters(values: list[float], tol: float = 2.0) -> list[float]:
    out: list[list[float]] = []
    for v in values:
        if out and v - out[-1][-1] <= tol:
            out[-1].append(v)
        else:
            out.append([v])
    return [sum(g) / len(g) for g in out]


def cell_text(page, x0: float, x1: float, top: float, bottom: float) -> str:
    crop = page.crop((x0 + 1, top + 1, x1 - 1, bottom - 1))
    txt = crop.extract_text(x_tolerance=1.2, y_tolerance=2) or ""
    return re.sub(r"\s+", " ", txt).strip()


def row_bands(page) -> list[tuple[float, float]]:
    """Le fasce orizzontali delle righe dati, escluso l'header."""
    hs = clusters(sorted({round(e["top"], 1)
                          for e in page.edges if e["orientation"] == "h"}))
    bands = [(hs[i], hs[i + 1]) for i in range(len(hs) - 1)]
    return [b for b in bands if b[1] - b[0] > 40]


def decode_image(im) -> Image.Image:
    """Decodifica un'immagine incorporata, qualunque sia il filtro PDF."""
    stream = im["stream"]
    width, height = im["srcsize"]
    filters = str(stream.get("Filter"))
    if "DCT" in filters or "JPX" in filters:
        return Image.open(io.BytesIO(stream.get_data())).convert("RGB")
    raw = stream.get_data()
    if stream.get("BitsPerComponent", 8) == 1:
        return Image.frombytes("1", (width, height), raw).convert("RGB")
    mode = "RGB" if "RGB" in str(stream.get("ColorSpace")) else "L"
    need = width * height * (3 if mode == "RGB" else 1)
    raw = raw.ljust(need, b"\xff")[:need]
    return Image.frombytes(mode, (width, height), raw).convert("RGB")


def signature(img: Image.Image) -> bytes:
    """Impronta robusta al rumore JPEG di un segnaposto "figura N".

    A 16x16 numeri diversi collidono (46 gruppi invece di 101); a 24x24 in su
    la separazione e' esatta. Usiamo 32x32 con soglia fissa: i segnaposto sono
    testo nero su fondo bianco, quindi la soglia assoluta e' piu' stabile di
    una relativa al min/max del singolo JPEG.
    """
    small = img.convert("L").resize((32, 32), Image.LANCZOS)
    return bytes(1 if p > 128 else 0 for p in small.tobytes())


def plate_figures(pdf) -> dict[int, Image.Image]:
    """Le figure delle tavole, associate al numero stampato accanto.

    Le tavole non sono griglie regolari (pagina 284 ha una riga con immagini
    di altezze diverse, pagina 286 ne ha da quattro per riga), quindi non si
    puo' ordinare per posizione. Ogni figura pero' ha il suo numero stampato
    in alto a sinistra: raggruppiamo etichette e immagini per riga e le
    accoppiamo da sinistra a destra.
    """
    figures: dict[int, Image.Image] = {}
    for pi in FIGURE_PAGES:
        page = pdf.pages[pi]
        labels = [(int(w["text"]), w["x0"], w["top"])
                  for w in page.extract_words()
                  if re.fullmatch(r"\d{1,3}", w["text"])
                  and w["top"] < page.height - 60]  # esclude "pagina N di 8"
        tops = clusters(sorted(t for _, _, t in labels), tol=8)
        # ogni riga si estende fino a meta' strada dalla successiva
        edges = [(-1e9 if i == 0 else (tops[i - 1] + t) / 2,
                  1e9 if i == len(tops) - 1 else (t + tops[i + 1]) / 2)
                 for i, t in enumerate(tops)]

        def row_of(y: float) -> int | None:
            return next((i for i, (lo, hi) in enumerate(edges) if lo <= y < hi), None)

        rows_lab: dict[int, list] = defaultdict(list)
        rows_img: dict[int, list] = defaultdict(list)
        for n, x, t in labels:
            rows_lab[row_of(t)].append((x, n))
        for im in page.images:
            rows_img[row_of(im["top"])].append((im["x0"], im))

        for r, labs in rows_lab.items():
            imgs = rows_img.get(r, [])
            if len(labs) != len(imgs):
                raise RuntimeError(
                    f"pagina {pi + 1} riga {r}: {len(labs)} etichette "
                    f"({[n for _, n in sorted(labs)]}) ma {len(imgs)} immagini")
            for (_, n), (_, im) in zip(sorted(labs), sorted(imgs, key=lambda p: p[0])):
                figures[n] = decode_image(im)
    return figures


def parse_rows(pdf) -> list[dict]:
    rows = []
    for pi in QUIZ_PAGES:
        page = pdf.pages[pi]
        thumbs = sorted(page.images, key=lambda i: i["top"])
        for top, bottom in row_bands(page):
            vals = [cell_text(page, COLS[i], COLS[i + 1], top, bottom)
                    for i in range(13)]
            if not any(vals):
                continue
            thumb = next((t for t in thumbs if top <= t["top"] < bottom), None)
            rows.append({"page": pi + 1, "vals": vals, "thumb": thumb})
    return rows


def main() -> int:
    pdf_path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if not pdf_path or not pdf_path.exists():
        print("uso: python scripts/extract_quiz.py <allegato-a.pdf>")
        return 2

    pdf = pdfplumber.open(pdf_path)
    rows = parse_rows(pdf)
    base = [r for r in rows if r["vals"][C_CAP] == "BASE"]

    # --- controllo di integrita': la numerazione deve essere 1..1472 completa
    numbers = [int(r["vals"][C_NUM]) for r in base if r["vals"][C_NUM].isdigit()]
    missing = sorted(set(range(1, EXPECTED_QUESTIONS + 1)) - set(numbers))
    if len(base) != EXPECTED_QUESTIONS or missing:
        print(f"ERRORE: {len(base)} righe, attese {EXPECTED_QUESTIONS}; "
              f"mancanti {missing[:20]}")
        return 1
    print(f"ok: {len(base)} domande BASE, numerazione 1..{max(numbers)} completa")

    # --- figure numerate delle tavole (pagine 280-286)
    FIGDIR.mkdir(parents=True, exist_ok=True)
    for f in FIGDIR.glob("*.webp"):
        f.unlink()
    plates = plate_figures(pdf)
    if sorted(plates) != list(range(1, EXPECTED_FIGURES + 1)):
        print(f"ERRORE: figure trovate {sorted(plates)[:10]}..., "
              f"attese 1..{EXPECTED_FIGURES}")
        return 1
    for n, img in plates.items():
        img.save(FIGDIR / f"{n:03d}.webp", "WEBP", quality=88, method=6)
    print(f"ok: {len(plates)} figure salvate in public/figure/")

    # --- miniature nella colonna IMMAGINE
    # I segnaposto "figura N" sono tutti 151x151; i disegni inline no.
    # I segnaposto compaiono nel documento in ordine non decrescente, quindi
    # l'ordine di prima apparizione dei gruppi distinti da' il numero figura.
    sigs: dict[bytes, int] = {}
    inline_count = 0
    for r in base:
        r["img"] = None
        thumb = r.pop("thumb")
        if thumb is None:
            continue
        img = decode_image(thumb)
        if thumb["srcsize"] == (151, 151):
            sig = signature(img)
            if sig not in sigs:
                sigs[sig] = len(sigs) + 1
            r["img"] = f"{sigs[sig]:03d}.webp"
        else:
            name = r["vals"][C_PROG].replace(".", "_").replace("-", "_")
            img.save(FIGDIR / f"q{name}.webp", "WEBP", quality=88, method=6)
            r["img"] = f"q{name}.webp"
            inline_count += 1
    if len(sigs) != EXPECTED_BASE_FIGURES:
        print(f"ERRORE: {len(sigs)} segnaposto distinti, "
              f"attesi {EXPECTED_BASE_FIGURES}")
        return 1
    # le figure 102-103 restano inutilizzate: appartengono ai quiz VELA
    for n in range(EXPECTED_BASE_FIGURES + 1, EXPECTED_FIGURES + 1):
        (FIGDIR / f"{n:03d}.webp").unlink(missing_ok=True)
    print(f"ok: {len(sigs)} figure referenziate + {inline_count} immagini inline")

    # --- normalizzazione e costruzione del JSON
    questions = []
    anomalies = []
    for r in base:
        v = r["vals"]
        flags = [v[C_V1].strip().upper(), v[C_V2].strip().upper(), v[C_V3].strip().upper()]
        answers = [v[C_A1], v[C_A2], v[C_A3]]
        prog = v[C_PROG]
        correct_idx = [i for i, f in enumerate(flags) if f == "V"]
        if prog in MANUAL_FIXES:
            correct = MANUAL_FIXES[prog]
        elif len(correct_idx) == 1:
            correct = correct_idx[0]
        else:
            anomalies.append((prog, r["page"], flags, v[C_Q]))
            correct = correct_idx[0] if correct_idx else 0
        questions.append({
            "id": prog,
            "n": int(v[C_NUM]),
            "q": v[C_Q],
            "a": answers,
            "correct": correct,
            "tema": v[C_TEMA],
            "voce": v[C_VOCE] or "Altro",
            "img": r["img"],
        })

    if anomalies:
        print(f"\nATTENZIONE: {len(anomalies)} domande senza una sola risposta V.")
        for prog, page, flags, q in anomalies:
            print(f"  {prog} (pag. {page}) flags={flags} :: {q[:70]}")
        print("  Verificare a mano e aggiungere a MANUAL_FIXES.\n")

    # --- tassonomia
    tax: dict[str, Counter] = defaultdict(Counter)
    for q in questions:
        tax[q["tema"]][q["voce"]] += 1
    taxonomy = [
        {"tema": tema,
         "n": sum(voci.values()),
         "voci": [{"voce": v, "n": n} for v, n in sorted(voci.items())]}
        for tema, voci in tax.items()
    ]

    DATA.mkdir(parents=True, exist_ok=True)
    PUBDATA.mkdir(parents=True, exist_ok=True)
    # Le domande si scaricano a runtime: 590 KB dentro il bundle JS sarebbero
    # da riscaricare a ogni deploy e da riparsare come codice.
    (PUBDATA / "questions.json").write_text(
        json.dumps(questions, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8")
    # La tassonomia e' piccola e serve subito per i filtri: va nel bundle.
    (DATA / "taxonomy.json").write_text(
        json.dumps(taxonomy, ensure_ascii=False, indent=2), encoding="utf-8")

    # Elenco delle figure: lo legge il service worker per metterle in cache
    # tutte insieme e far funzionare l'app senza rete.
    (PUBDATA / "figure.json").write_text(
        json.dumps(sorted(f.name for f in FIGDIR.glob("*.webp")),
                   ensure_ascii=False),
        encoding="utf-8")

    size = (PUBDATA / "questions.json").stat().st_size / 1024
    print(f"ok: public/data/questions.json ({size:.0f} KB), {len(taxonomy)} temi")
    for t in taxonomy:
        print(f"  {t['n']:5d}  {t['tema']}  ({len(t['voci'])} voci)")
    return 1 if anomalies else 0


if __name__ == "__main__":
    sys.exit(main())
