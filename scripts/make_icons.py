"""
Genera le icone dell'app: una rosa dei venti con il nord in magenta, come
sulla carta nautica.

  app/icon.png          192x192  -> <link rel="icon">
  app/apple-icon.png    180x180  -> <link rel="apple-touch-icon">, iOS
  app/favicon.ico        32x32
  public/icon-192.png   192x192  -> citate dal manifest (Android/Chrome)
  public/icon-512.png   512x512

I file dentro app/ li trasforma Next in tag <link>; quelli in public/ servono
al manifest, che li cita per percorso. iOS ignora il manifest e usa solo
apple-touch-icon, per questo la stessa icona sta in due posti.

Uso:
  pip install Pillow
  python scripts/make_icons.py
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent

CARTA = (232, 241, 244)
INCHIOSTRO = (15, 35, 45)
MAGENTA = (194, 24, 91)


def rosa(size: int, margine: float = 0.03) -> Image.Image:
    """Disegna a 4x e rimpicciolisce: i bordi obliqui restano puliti."""
    s = size * 4
    im = Image.new("RGB", (s, s), CARTA)
    d = ImageDraw.Draw(im)
    c = s / 2
    r = s * (0.5 - 0.10 - margine)

    d.ellipse([c - r, c - r, c + r, c + r], outline=INCHIOSTRO, width=max(2, s // 110))
    d.ellipse([c - r * 0.80, c - r * 0.80, c + r * 0.80, c + r * 0.80],
              outline=INCHIOSTRO, width=max(1, s // 220))

    # graduazione ogni 15 gradi, piu' lunga sui quadranti
    for a in range(0, 360, 15):
        t = math.radians(a - 90)
        lung = r * 0.10 if a % 45 else r * 0.16
        d.line([c + math.cos(t) * (r - lung), c + math.sin(t) * (r - lung),
                c + math.cos(t) * r, c + math.sin(t) * r],
               fill=INCHIOSTRO, width=max(1, s // 260))

    def punta(angolo: float, lung: float, mezza: float, colore) -> None:
        t = math.radians(angolo - 90)
        tip = (c + math.cos(t) * lung, c + math.sin(t) * lung)
        for lato in (-90, 90):
            b = math.radians(angolo - 90 + lato)
            d.polygon([tip, (c + math.cos(b) * mezza, c + math.sin(b) * mezza), (c, c)],
                      fill=colore)

    for a in (45, 135, 225, 315):
        punta(a, r * 0.52, r * 0.10, INCHIOSTRO)
    for a in (90, 180, 270):
        punta(a, r * 0.78, r * 0.13, INCHIOSTRO)
    punta(0, r * 0.80, r * 0.13, MAGENTA)  # il nord, come sulla carta

    d.ellipse([c - s * 0.012, c - s * 0.012, c + s * 0.012, c + s * 0.012], fill=CARTA)
    return im.resize((size, size), Image.LANCZOS)


def main() -> None:
    (ROOT / "app").mkdir(exist_ok=True)
    (ROOT / "public").mkdir(exist_ok=True)

    rosa(192).save(ROOT / "app" / "icon.png")
    rosa(180).save(ROOT / "app" / "apple-icon.png")
    rosa(192).save(ROOT / "public" / "icon-192.png")
    rosa(512).save(ROOT / "public" / "icon-512.png")
    # Next pretende un ICO in RGBA, anche se l'icona e' opaca.
    rosa(64).convert("RGBA").save(
        ROOT / "app" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    for p in ["app/icon.png", "app/apple-icon.png", "app/favicon.ico",
              "public/icon-192.png", "public/icon-512.png"]:
        print(f"ok: {p} ({(ROOT / p).stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
