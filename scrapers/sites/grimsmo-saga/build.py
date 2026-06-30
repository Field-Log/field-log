#!/usr/bin/env python3
"""Read archive.json and emit data.json for the Saga UI.

Parses each product's body_html into a structured spec sheet:
- bullets are extracted from either <li> tags (newer format) OR em-dash
  sentence style ("- text. - text.") used in older Saga listings.
- each bullet is classified into a category (body/slider/engraving/tip_logo/
  mechanism/refill/case/foam/book/other) and attribute values are extracted
  for filtering (body_color, slider_style, case, refill, etc).

The "visible spec" card shows body / slider / engraving / tip_logo / refill.
The lightbox shows the FULL bullet list including mechanism / case / foam / book.
"""
import html as htmlmod
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"  # generated state lives in <site>/data/ (see core/shopify_archive.py)
ARCHIVE = DATA / "archive.json"
OUT = DATA / "data.json"
PRODUCT_URL_BASE = "https://grimsmoknives.com/products/"

# --- Saga number ------------------------------------------------------------
# Titles look like "Saga #9039 8593850603" — first number is the Saga number,
# trailing number is an internal SKU/template id shared across many drops.
SAGA_NUM_RE = re.compile(r"#\s*(\d+)")


def extract_saga_number(title: str) -> str | None:
    m = SAGA_NUM_RE.search(title or "")
    return m.group(1) if m else None


# --- Bullet extraction ------------------------------------------------------
LI_RE = re.compile(r"<li>(.*?)</li>", re.DOTALL | re.IGNORECASE)


def _strip_html(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s or "")
    s = htmlmod.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def _strip_text(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


def extract_bullets(body_html: str) -> list[str]:
    """Pull bullets from either <li> tags OR em-dash sentence style."""
    if not body_html:
        return []
    # Format A — modern <li> bullets (newer Saga drops)
    li_bullets = [_strip_html(b) for b in LI_RE.findall(body_html)]
    li_bullets = [b for b in li_bullets if b and 3 < len(b) < 300]
    if li_bullets:
        return li_bullets
    # Format B — older em-dash sentence style: "- text. - text."
    text = _strip_html(body_html)
    # Split on "- " preceded by whitespace OR period; keep substantive items only.
    parts = re.split(r"(?:^|\s|\.)\s*-\s+", text)
    return [_strip_text(p).rstrip(".") for p in parts if p and 5 < len(p) < 300 and not p.lower().startswith("custom titanium saga pen")]


# --- Per-bullet classification ----------------------------------------------
# Order matters — first match wins. Most-specific keywords first.
CLASSIFIERS = [
    ("book",        r"\bpocket book\b|\bbook included\b"),
    ("foam",        r"\bfoam insert\b"),
    ("case",        r"carrying case|\bNanuk\b"),
    ("refill",      r"\bink cartridge\b|\bSchmidt\b|\bSCHMIDT\b|\bLAMY\b|\bPilot\b|\bPentel\b|\bcartridge\b|\brefill\b"),
    ("mechanism",   r"\bmechanism\b|\b17-?\s*4PH\b|\bceramic bearing\b|\bbearing balls\b"),
    ("engraving",   r"engraving on the button|logo.* on the button|engraving on button"),
    ("tip_logo",    r"logos? on the tip|logoless tip|on the tip"),
    ("slider",      r"\bslider\b|\bbutton mechanism\b"),
    ("body",        r"\bbody\b.*\b(tip|clip)\b|\b(tip|clip)\b.*\bbody\b"),
]


def classify(bullet: str) -> str:
    low = bullet.lower()
    for cat, pat in CLASSIFIERS:
        if re.search(pat, low):
            return cat
    return "other"


# --- Attribute extractors per category --------------------------------------
BODY_FINISHES = [
    ("Stonewashed",   r"\bStonewash(?:ed)?\b"),
    ("Blasted",       r"\bBlasted\b"),
    ("Hand Brushed",  r"\bhand[\s-]*brushed\b|\bSatin\b"),
    ("DLC Coated",    r"\bDLC\b"),
    ("TiAlN PVD",     r"\bTitanium Aluminum Nitride\b|\bTiAlN\b|\bPVD\b"),
    ("Polished",      r"\bPolished\b"),
    ("Anodized",      r"\bAnodize[ds]?\b|\bAnodise[ds]?\b"),
    ("Cerakote",      r"\bCerakote\b"),
    ("Plain",         r"^Titanium Body"),  # plain "Titanium Body, Clip and Tip" with no finish word
]

BODY_COLORS = [
    ("Black",        r"\bBlack\b"),
    ("Plum",         r"\bPlum\b"),
    ("Bronze",       r"\bBronze\b"),
    ("Blue",         r"\bBlue\b"),
    ("Purple",       r"\bPurple\b"),
    ("Green",        r"\bGreen\b"),
    ("Red",          r"\bRed\b"),
    ("Pink",         r"\bPink\b"),
    ("Gold",         r"\bGold\b"),
    ("Copper",       r"\bCopper\b"),
    ("Raw",          r"\bRaw\b"),
    ("Silver/Grey",  r"\bSilver\b|\bGrey\b|\bGray\b"),
    ("Rainbow",      r"\bRainbow\b"),
]

BODY_MATERIALS = [
    ("Titanium",  r"\bTitanium\b"),
    ("Bronze",    r"\bBronze\b"),
    ("Aluminum",  r"\bAluminum\b|\bAluminium\b"),
    ("Copper",    r"\bCopper\b"),
    ("Damascus",  r"\bDamascus\b"),
    ("Zirconium", r"\bZirconium\b|\bZirc\b"),
]

SLIDER_STYLES = [
    ("Helix",      r"\bHelix\b"),
    ("Crosshatch", r"\bCrosshatch\b|\bCross[\s-]?hatch\b"),
    ("Spiral",     r"\bSpiral\b"),
    ("Plain",      r"\bSlider\b"),  # fallback — any slider with no style word
]

REFILLS = [
    ("Schmidt P900F",  r"SCHMIDT\s*P900F?|Schmidt\s*P900"),
    ("Schmidt",        r"\bSchmidt\b"),
    ("LAMY M22",       r"LAMY\s*M22"),
    ("LAMY",           r"\bLAMY\b"),
    ("Pilot G2",       r"\bPilot\s*G2\b"),
    ("Pilot",          r"\bPilot\b"),
    ("Pentel EnerGel", r"\bPentel\s*EnerGel\b"),
]

CASES = [
    # Every Saga case is NANUK — labels drop the "NANUK" prefix per user request.
    # Match in either direction since the older em-dash format says "Black Nanuk x
    # Grimsmo" while the modern <li> format says "Nanuk x Grimsmo Black".
    ("Algonquin Green",   r"\bAlgonquin\b"),
    ("Bisaro Black",      r"\bBisaro\b"),
    ("Badlands Orange",   r"\bBadlands\b"),
    ("Kananaskis Blue",   r"\bKananaskis\b"),
    ("Moose Blood Red",   r"\bMoose\b"),
    ("Black",             r"Black\s+Nanuk|Nanuk\s+x\s+Grimsmo\s+Black\b"),
    ("Other Nanuk",       r"\bNanuk\b"),
    ("Other Case",        r"carrying case"),
]

ENGRAVING = [
    ("Grimsmo Logo",  r"Grimsmo\s+Logo\s+Engraving|Grimsmo\s+Logo\s+on\s+the\s+Button"),
    ("No Logo",       r"No\s+Logo\s+Engraving|No\s+Engraving|No\s+Logo\s+on\s+the\s+Button"),
]

TIP_LOGO = [
    ("Grimsmo Logo",  r"Grimsmo\s+Logos?\s+on\s+the\s+Tip"),
    ("None",          r"No\s+Grimsmo\s+Logos?\s+on\s+the\s+Tip|No\s+Logos?\s+on\s+the\s+Tip|Logoless\s+tip"),
]

BOOKS = [
    ("Grimsmo V2 Pocket Book", r"V2\s+Pocket\s+Book"),
    ("Grimsmo Pocket Book",    r"Pocket\s+Book"),
]


def _match_first(text: str, patterns: list[tuple[str, str]]) -> str | None:
    for label, pat in patterns:
        if re.search(pat, text, re.IGNORECASE):
            return label
    return None


def _match_all(text: str, patterns: list[tuple[str, str]]) -> list[str]:
    return [label for label, pat in patterns if re.search(pat, text, re.IGNORECASE)]


def extract_attributes(bullets_classified: dict[str, list[str]], full_body_text: str = "") -> dict:
    body_text = " ".join(bullets_classified.get("body", []))
    slider_text = " ".join(bullets_classified.get("slider", []))
    # For "ambient" axes (case/refill/book/engraving/tip_logo) — older em-dash products
    # mention these in a preamble paragraph rather than a dash-bullet. Fall back to the
    # full body_text when the structured bullet didn't classify them.
    case_text = " ".join(bullets_classified.get("case", [])) or full_body_text
    refill_text = " ".join(bullets_classified.get("refill", [])) or full_body_text
    engr_text = " ".join(bullets_classified.get("engraving", [])) or full_body_text
    tip_text = " ".join(bullets_classified.get("tip_logo", [])) or full_body_text
    book_text = " ".join(bullets_classified.get("book", [])) or full_body_text

    return {
        "body_finishes":  _match_all(body_text, BODY_FINISHES) or [],
        "body_colors":    _match_all(body_text, BODY_COLORS) or [],
        "body_materials": _match_all(body_text, BODY_MATERIALS) or [],
        "slider_style":   _match_first(slider_text, SLIDER_STYLES),
        "slider_materials": _match_all(slider_text, BODY_MATERIALS) or [],
        "slider_colors":    _match_all(slider_text, BODY_COLORS) or [],
        "refill":         _match_first(refill_text, REFILLS),
        "case":           _match_first(case_text, CASES),
        "engraving":      _match_first(engr_text, ENGRAVING),
        "tip_logo":       _match_first(tip_text, TIP_LOGO),
        "book":           _match_first(book_text, BOOKS),
    }


def normalize(p: dict) -> dict:
    variants = p.get("variants") or []
    prices = [float(v["price"]) for v in variants if v.get("price")]
    images = p.get("images") or []
    image_cdn = images[0]["src"] if images else ""
    image_local = (p.get("image_local") or [None])[0]

    body_html = p.get("body_html", "")
    full_body_text = _strip_html(body_html)
    bullets = extract_bullets(body_html)
    classified: dict[str, list[str]] = {}
    for b in bullets:
        classified.setdefault(classify(b), []).append(b)
    attrs = extract_attributes(classified, full_body_text)

    saga_num = extract_saga_number(p["title"])
    display_title = f"Saga #{saga_num}" if saga_num else p["title"]

    # Visible-spec bullets for the card: body / slider / engraving / tip_logo / refill,
    # in the order they typically appear on the page.
    visible_bullets: list[str] = []
    for cat in ("body", "slider", "engraving", "tip_logo", "refill"):
        visible_bullets.extend(classified.get(cat, []))

    return {
        "id": p["id"],
        "title": display_title,
        "title_full": p["title"],
        "saga_number": saga_num,
        "url": f"{PRODUCT_URL_BASE}{p['handle']}",
        "published_at": p["published_at"][:10] if p.get("published_at") else None,
        "created_at":   p["created_at"][:10] if p.get("created_at") else None,
        "updated_at":   p["updated_at"][:10] if p.get("updated_at") else None,
        "first_seen": p.get("first_seen"),
        "last_seen":  p.get("last_seen"),
        "archived":   bool(p.get("archived")),
        "price_min": min(prices) if prices else None,
        "price_max": max(prices) if prices else None,
        "variant_count": len(variants),
        "image": image_local or image_cdn,
        "image_cdn": image_cdn,
        "image_local": image_local,
        "images_local": p.get("image_local") or [],
        "image_count": len(images),
        # All bullets, original order (for the lightbox full-spec list)
        "bullets": bullets,
        # Classified groups (for templated rendering)
        "bullets_by_category": classified,
        # Visible-spec subset for the card
        "visible_bullets": visible_bullets,
        "body_html": body_html,
        "body_text": full_body_text,
        **attrs,
    }


def main() -> int:
    archive = json.loads(ARCHIVE.read_text())["products"]
    rows = [normalize(p) for p in archive.values()]
    rows.sort(key=lambda r: r["published_at"] or "", reverse=True)
    OUT.write_text(json.dumps({"products": rows}, indent=2))
    print(f"wrote {len(rows)} products to {OUT} ({sum(1 for r in rows if r['archived'])} archived)")
    # Quick taxonomy distribution sanity-check
    from collections import Counter
    for axis in ("body_finishes", "body_colors", "slider_style", "case", "refill", "engraving", "tip_logo", "book"):
        c = Counter()
        for r in rows:
            v = r.get(axis)
            if isinstance(v, list):
                for x in v: c[x] += 1
            elif v:
                c[v] += 1
        top = ", ".join(f"{k}={n}" for k, n in c.most_common(6))
        print(f"  {axis:<16} {top}")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
