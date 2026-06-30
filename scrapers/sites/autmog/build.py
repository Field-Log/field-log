#!/usr/bin/env python3
"""Read raw.json (full Shopify product dump) and emit data.json for the UI.

This is the only file you need to touch when tuning extractors. Add new fields
to FILTER_GROUPS in index.html after exposing them here.
"""
import html
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"  # generated state lives in <site>/data/ (see core/shopify_archive.py)
ARCHIVE = DATA / "archive.json"
OUT = DATA / "data.json"
PRODUCT_URL_BASE = "https://www.autmog.com/products/"

# --- title-based taxonomies -------------------------------------------------
# --- Materials --------------------------------------------------------------
# Body materials only. Stainless / steel are pen-internals (springs, refill
# bodies, fasteners) — never the pen body — so they're excluded.
#
# Two-pass detection so we don't double-tag compound alloys:
#   1. MATERIAL_ALLOYS — long compound names (e.g., "C63000 Nickel Aluminum
#      Bronze") match FIRST and mask their substring out of the text so the
#      individual-word patterns (Aluminum / Bronze) don't fire on the same
#      letters.
#   2. MATERIALS — single-word fallbacks. Each match requires at least one
#      mention NOT immediately followed by a SECONDARY_PART word, so e.g.
#      "6Al-4V Titanium Button" doesn't tag the pen as a Titanium pen when
#      only the button is titanium.
#
# Order matters within each list: longer / more specific patterns first.
MATERIAL_ALLOYS = [
    # Autmog's marketing-style phrase for C63000: "Copper alloy C63000 Aluminum
    # Nickel Bronze". Match the FULL phrase so "Copper" doesn't get tagged
    # separately from the alloy designation.
    ("Bronze", r"\bCopper\s+alloy\s+(?:C63000(?:\s+(?:Nickel|Aluminum|Bronze))*|(?:Nickel\s+|Aluminum\s+)+Bronze)\b"),
    # C63000 optionally followed by any combination of Nickel/Aluminum/Bronze
    # words — covers "C63000", "C63000 Bronze", "C63000 Nickel Aluminum Bronze",
    # "C63000 Aluminum Nickel Bronze", etc.
    ("Bronze", r"\bC63000(?:\s+(?:Nickel|Aluminum|Bronze))*\b"),
    # Bare alloy names: "Aluminum Bronze", "Nickel Aluminum Bronze",
    # "Aluminum Nickel Bronze". Constituent words masked so Pass 2 doesn't
    # re-tag Aluminum.
    ("Bronze", r"\b(?:Nickel\s+|Aluminum\s+)+Bronze\b"),
    # "6Al-4V Titanium" as a phrase — masking prevents Pass 2 from picking up
    # the bare "6Al-4V" alloy code or "Titanium" when only a small component
    # (e.g., Button) is titanium on an otherwise-bronze pen.
    ("Titanium", r"\b6Al-?4V\s+Titanium\b"),
]

MATERIALS = [
    ("Titanium",  r"\bTitanium\b|\b6Al-?4V\b"),
    ("Bronze",    r"\bBronze\b"),
    ("Aluminum",  r"\b6061\b|\bAluminum\b|\bAluminium\b"),
    ("Brass",     r"\b464\b|\bBrass\b"),
    ("Copper",    r"\bC110\b|\bCopper\b"),
    ("Zirconium", r"\bZirconium\b|\bZirc\b"),
    ("Damascus",  r"\bDamascus\b"),
    ("Mokuti",    r"\bMokuti\b|\bMokume\b"),
    ("Tungsten",  r"\bTungsten\b"),
]

# Material mention is "secondary" if immediately followed by one of these —
# the pen's main body is some other material, this is just a small component.
# Mechanism is NOT here: "Bronze Body and Mechanism" is primary; on its own
# "Bronze Mechanism" is also usually primary for these pens.
_SECONDARY_PART_RE = re.compile(r"^\s*(?:Button|Clip|Cap|Insert|Top|Sleeve|Ring|Spring)\b", re.IGNORECASE)

# Manual material overrides — same convention as NOSE_OVERRIDES / MECH_OVERRIDES.
# The extractor scans title + body, so a material named in the body for a
# non-material reason (a negation, or a color description) gets false-tagged.
# Set the true material list here; this wins over auto-extraction.
MATERIAL_OVERRIDES: dict[int, list[str]] = {
    # "I ran out of the brass so I have switched it up for an aluminum clip" —
    # the pen has NO brass.
    7586933047483: ["Titanium", "Aluminum"],
    # "anodized design blue to dark blue to copper fade by KVR Finishing" —
    # "copper" describes the anodized color, not a material in the pen.
    7961477120187: ["Titanium", "Aluminum"],
}


def extract_materials(text: str) -> list[str]:
    """Two-pass detection so compound alloys don't double-tag, but every
    distinct material in the pen still gets surfaced.

    Pass 1 — compound alloy patterns ("C63000 Nickel Aluminum Bronze",
    "Aluminum Bronze", "6Al-4V Titanium"). Tagged whenever they appear AND
    their matched substring is masked out of the text so the constituent
    words don't trigger their own single-material tag in Pass 2.

    Pass 2 — single-word materials in the remaining masked text. Every
    distinct material mention tags the pen, regardless of which component
    it's in (Body / Button / Clip / Mechanism etc.) — a pen with a brass
    clip on an aluminum body legitimately uses both materials."""
    found: list[str] = []
    masked = text
    for label, pat in MATERIAL_ALLOYS:
        rx = re.compile(pat, re.IGNORECASE)
        if rx.search(masked):
            if label not in found:
                found.append(label)
            masked = rx.sub(" " * 6, masked)
    for label, pat in MATERIALS:
        if label in found:
            continue
        if re.search(pat, masked, re.IGNORECASE):
            found.append(label)
    return found

REFILLS = [
    ("Pentel EnerGel", r"Pentel\s+EnerGel"),
    ("OHTO", r"\bOHTO\b"),
    ("Pilot G2", r"Pilot\s+G2"),
    ("ISO G2 (Parker)", r"ISO\s+G2|Parker"),
    ("Schmidt", r"\bSchmidt\b"),
    ("Uni-Ball", r"Uni[\s-]?Ball|Uni\s+SXR|UMR-"),
    ("Itoya", r"\bItoya\b"),
    ("Fisher Space", r"Fisher\s+Space"),
    ("Pilot Hi-Tec-C", r"Hi-Tec-C"),
    ("Zebra", r"\bZebra\b"),
]


# Brand names that, when paired with an ISO G2 (Parker) match, are just the
# OEM for a Parker-G2-form-factor refill: Schmidt P900, Itoya Aquaroller,
# Uni-Ball SXR-600, OHTO Ceramic PG-M05NP / Flash Dry Needle Point. Roll
# them into the form factor tag — that's the cross-pen compatibility users
# filter by. (Pilot G2 is NOT in this set; it's its own form factor.)
# Body text still mentions the brand, so search by brand keeps working.
_PARKER_G2_BRAND_OEMS = {"OHTO", "Schmidt", "Itoya", "Uni-Ball"}
# Pilot G2 product bodies mention "ISO G2" in a NEGATIVE context — e.g.
# "specifically for the Pilot G2. This pen will not fit ISO G2..." — which
# our positive-only regex over-matches. Trust the title: if it names Pilot
# G2 and doesn't name the Parker form factor, the body mention is the
# negation note, not a compat declaration.
_TITLE_PARKER_RE = re.compile(r"ISO\s+G2|Parker", re.IGNORECASE)
_TITLE_PILOT_G2_RE = re.compile(r"Pilot\s+G2", re.IGNORECASE)
# "Pilot G2 style" means a third-party refill (Schmidt 5888 in this catalog)
# that fits Pilot-G2-bodied pens. The actual refill identity is the brand —
# Pilot G2 is just the compat form factor — so we drop the form factor tag.
_PILOT_G2_STYLE_RE = re.compile(r"Pilot\s+G2\s+style", re.IGNORECASE)


def classify_refills(haystack: str, title: str = "") -> list[str]:
    found = _match_bucket(haystack, REFILLS)
    if "ISO G2 (Parker)" in found and "Pilot G2" in found:
        if _TITLE_PILOT_G2_RE.search(title) and not _TITLE_PARKER_RE.search(title):
            found = [r for r in found if r != "ISO G2 (Parker)"]
    if "ISO G2 (Parker)" in found:
        found = [r for r in found if r == "ISO G2 (Parker)" or r not in _PARKER_G2_BRAND_OEMS]
    if "Pilot G2" in found and _PILOT_G2_STYLE_RE.search(haystack):
        found = [r for r in found if r != "Pilot G2"]
    return found

MECHANISMS = [
    ("Click", r"\bClick\b"),
    ("Twist", r"\bTwist\b"),
    ("Bolt", r"\bBolt\b"),
]

# Manual mechanism overrides — same convention as NOSE_OVERRIDES. A few older
# listings never state the action (click/twist) in the title or body; set here.
MECH_OVERRIDES: dict[int, list[str]] = {
    7231409389755: ["Twist"],  # 38 Copper - Ballpoint ISO G2 (Parker) Smooth Body - Brass Clip
}

# --- Clip status -----------------------------------------------------------
# Single-label (Clipped XOR Clipless). The original `_match_bucket` pattern
# only caught literal "Clipped"/"Clipless" words, missing 56 pens whose
# titles say things like "- C110 Copper Clip" (clip material implies clip
# present). Detection ladder, first match wins:
#   1. Explicit "Clipless" word        → Clipless
#   2. Explicit "Clipped" word         → Clipped
#   3. Title has standalone "Clip"     → Clipped  (e.g. "- 6Al-4V Titanium Clip")
#   4. Body has "<material> clip" /
#      "the clip" / "a clip"           → Clipped
#   5. Body mentions "clip" anywhere   → Clipped  (final fallback before Unknown)
#   else                               → Unknown  (resolved later via clips_audit.csv overrides)
_CLIPLESS_RE       = re.compile(r"\bClipless\b", re.IGNORECASE)
_CLIPPED_LITERAL   = re.compile(r"\bClipped\b", re.IGNORECASE)
_TITLE_CLIP_RE     = re.compile(r"\bClip\b", re.IGNORECASE)
_BODY_CLIP_NOUN_RE = re.compile(
    r"\b(?:the|a|this|its|with\s+a|matching|contrasting|brass|copper|titanium|aluminum|aluminium|6al-?4v|c110|tungsten)\s+clip\b",
    re.IGNORECASE,
)
_BODY_CLIP_GENERIC = re.compile(r"\bclip\b", re.IGNORECASE)

NOSES = [
    ("Triple Bevel", r"Triple\s+Bevel"),
    # Conical and Cone Nose are the same shape per the maker's usage — merged.
    # Both alternatives require the literal word "Nose" so "conical section",
    # "cone tip profile", "rounded nose section" etc. — which describe the
    # body taper, NOT the nose profile — don't false-tag the pen as Conical.
    ("Conical", r"Conical\s+Nose|\bCone\s+Nose\b"),
    ("Round", r"Round\s+Nose"),
    # Match both "Step Nose" and the maker's variant spelling "Stepped Nose".
    ("Step", r"Step(?:ped)?\s+Nose"),
    ("Flat", r"\bFlat\s+Nose\b"),
]

# Manual nose overrides — the auto-classifier reads the maker's title verbatim,
# but a few pens are titled "Triple Bevel Nose" even though the actual nose
# profile is a step. Override here keeps the user-visible taxonomy honest.
NOSE_OVERRIDES: dict[int, list[str]] = {
    8383420301499: ["Step"],  # 55 Clipless Twist Pen - 6Al-4V Titanium Body
    8287984681147: ["Step"],  # 40 Grip - 38 Mechanism - 6061 Aluminum
    8272059793595: ["Step"],  # 40 Grip - 38 Mechanism - C63000 Nickel Aluminum Bronze
    # Maker omitted the nose word from the title/body, but the product photo shows
    # a clear conical tip. Override so the Conical nose filter catches it.
    7768913412283: ["Conical"],  # 40 Click Pen - 6Al-4V Titanium - ISO G2 Schmidt 9000 M
    # Manual nose calls from the 2026-06-19 desktop audit pass — these older listings
    # never named a nose shape in the title/body, so the auto-classifier left them empty.
    # Values set from the product photos.
    7357869162683: ["Conical"],  # 36 Click Pen - 464 Brass
    7183752331451: ["Conical"],  # 38 464 Brass - ISO G2 (Parker)
    7342169161915: ["Conical"],  # 38 464 Brass - No Rings - Pilot G2 (Rollerball) - Brass Clip
    7303253065915: ["Conical"],  # 38 464 Brass - Pilot G2 (Rollerball)
    7303323058363: ["Conical"],  # 38 464 Brass Smooth Body - Pilot G2 (Rollerball)
    7183720906939: ["Conical"],  # 38 Aluminum - ISO G2 (Parker)
    7226983743675: ["Conical"],  # 38 Aluminum - ISO G2 (Parker) Smooth Body - Aluminum Clip
    7183697477819: ["Conical"],  # 38 Aluminum - Rollerball (Pilot G2)
    7322212368571: ["Conical"],  # 38 Aluminum Smooth Body - Rollerball (Pilot G2)
    7258350289083: ["Conical"],  # 38 Brass - Brass Clip - Rollerball (Pilot G2)
    7203252797627: ["Round"],    # 38 Brass Round Tip - Rollerball (Pilot G2)
    7231409389755: ["Conical"],  # 38 Copper - Ballpoint ISO G2 (Parker) Smooth Body - Brass Clip
    7188461748411: ["Conical"],  # 38 Copper - ISO G2 (Parker)
    7283723239611: ["Round"],    # 38 Copper Top - Brass Body - Brass Clip - Rollerball Pilot G2
    7283715047611: ["Round"],    # 38 Copper Top - Brass Body - Copper Clip - Rollerball Pilot G2
    7283712524475: ["Round"],    # 38 Copper Top - Brass Body - Rollerball Pilot G2
    7695370453179: ["Conical"],  # 38 Twist Action - 110 Copper - Pentel Energel 0.5mm Needle Nose
    7219738935483: ["Conical"],  # 38 Twist Action - Pre Order - 110 Copper - Pentel Energel 0.5mm Needle Nose
    7781794644155: ["Round"],    # 39 Click Pen - 6Al-4V Titanium - Pentel EnerGel 0.7mm
    7615286608059: ["Conical"],  # 40 Click Pen - 6061 Aluminum - Schmidt EasyFlow 9000 - Clip and Grooves
    7605966667963: ["Round"],    # 42 Click Pen - *Pre-Order* - 6Al-4V Titanium - Pilot G2
    7426342486203: ["Round"],    # 42 Click Pen - 464 Brass
    7444415742139: ["Round"],    # 42 Click Pen - 6Al-4V Titanium
    7455381651643: ["Round"],    # 42 Click Pen - 6Al-4V Titanium - 464 Brass Clip
    7768308449467: ["Round"],    # 42 Click Pen - 6Al-4V Titanium - Pentel EnerGel 0.7mm
    7718713131195: ["Round"],    # 42 Click Pen - Pre-Order - 6Al-4V Titanium - Pentel EnerGel 0.7mm
    7576396103867: ["Conical"],  # 47 - 464 Brass - Twist Action - ISO G2 (Parker)
    7572527939771: ["Conical"],  # 47 - 6061 Aluminum - Twist Action - ISO G2 (Parker)
}

# Per maker convention: every Autmog finish is the raw machined surface unless KVR
# (anodized/polished/brushed-by-KVR) is called out. We only need a binary axis.
KVR_RE = re.compile(r"\bKVR\b|Anodize|Anodised", re.IGNORECASE)

# Allow leading markers like "*PRE-ORDER*" before the size digit.
SIZE_LEAD_RE = re.compile(r"^(?:\s*\*[^*]+\*)?\s*(\d{2})\b")
# "40 Grip - 38 Mechanism Clipless …" → two distinct model sizes per pen.
SIZE_DUAL_RE = re.compile(r"\b(\d{2})\s+Grip\s*-\s*(\d{2})\s+Mechanism\b", re.IGNORECASE)
ACCESSORY_RE = re.compile(r"\bTray\b|\bPen\s+Clips?\b", re.IGNORECASE)


def extract_sizes(title: str) -> list[str]:
    dual = SIZE_DUAL_RE.search(title)
    if dual:
        # Grip first (it's the user-feel grip diameter), then Mechanism.
        return [dual.group(1), dual.group(2)]
    m = SIZE_LEAD_RE.search(title)
    return [m.group(1)] if m else []
# Anchor diameter to the word "diameter" — body texts say e.g. `0.38"(9.65 mm) diameter`
# or `measuring 0.55" in diameter`. Without the anchor, length values leak through.
# Pen-body diameters are sub-inch (0.36"–0.55") and sub-15mm; anchor to that range
# so pen length values (e.g. 5.29") within the same sentence don't leak in.
DIAMETER_IN_RE = re.compile(
    r'(?:diameter.{0,40}?(0\.\d{1,3})\s*"|(0\.\d{1,3})\s*".{0,40}?diameter)',
    re.IGNORECASE,
)
DIAMETER_MM_RE = re.compile(
    r"(?:diameter.{0,40}?(\d{1,2}(?:\.\d+)?)\s*mm|(\d{1,2}(?:\.\d+)?)\s*mm.{0,40}?diameter)",
    re.IGNORECASE,
)
WEIGHT_RE = re.compile(r"(\d+(?:\.\d+)?)\s*g\b")          # 30.0g
LENGTH_RE = re.compile(
    r'(?:length.{0,40}?(\d+\.\d{1,3})\s*"|(\d+\.\d{1,3})\s*".{0,40}?(?:length|long)\b)',
    re.IGNORECASE,
)


def _match_bucket(text: str, bucket: list[tuple[str, str]]) -> list[str]:
    return [label for label, pat in bucket if re.search(pat, text, re.IGNORECASE)]


def _strip_html(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s or "")
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def _first_float(rx: re.Pattern, text: str) -> float | None:
    m = rx.search(text or "")
    if not m:
        return None
    # Take whichever capture group fired (regexes with two alternative branches each
    # supply one capture per branch).
    for g in m.groups():
        if g:
            return float(g)
    return None


def extract_dimensions(body_text: str) -> dict:
    return {
        "diameter_in": _first_float(DIAMETER_IN_RE, body_text),
        "diameter_mm": _first_float(DIAMETER_MM_RE, body_text),
        "weight_g": _first_float(WEIGHT_RE, body_text),
        "length_in": _first_float(LENGTH_RE, body_text),
    }


def classify_clip(title: str, body_text: str) -> str | None:
    """Return 'Clipless', 'Clipped', or None per the detection ladder."""
    if _CLIPLESS_RE.search(title) or _CLIPLESS_RE.search(body_text):
        return "Clipless"
    if _CLIPPED_LITERAL.search(title) or _CLIPPED_LITERAL.search(body_text):
        return "Clipped"
    if _TITLE_CLIP_RE.search(title):
        return "Clipped"
    if _BODY_CLIP_NOUN_RE.search(body_text) or _BODY_CLIP_GENERIC.search(body_text):
        return "Clipped"
    return None


# clips_audit.csv — manual overrides for products the classifier can't decide
# (mostly Twist pens whose titles say nothing about a clip but the user knows
# the shipping config from photos). Keyed by product_id.
_CLIP_OVERRIDES: dict[int, str] = {}
_clips_csv = HERE / "clips_audit.csv"
if _clips_csv.exists():
    import csv
    with open(_clips_csv, newline="") as _f:
        for _row in csv.DictReader(_f):
            _override = (_row.get("manual_override") or "").strip()
            if _override in ("Clipped", "Clipless"):
                try:
                    _CLIP_OVERRIDES[int(_row["product_id"])] = _override
                except (ValueError, KeyError):
                    pass

# body_details_audit.csv — multi-valued visual attributes (Tapered / Grip Lines /
# Smooth) that aren't always inferable from text. CSV is the source of truth;
# auto-detection at build time only seeds initial values during regeneration.
_BODY_DETAILS_OVERRIDES: dict[int, list[str]] = {}
_body_csv = HERE / "body_details_audit.csv"
if _body_csv.exists():
    import csv as _csv2
    with open(_body_csv, newline="") as _f:
        for _row in _csv2.DictReader(_f):
            _details = (_row.get("body_details") or "").strip()
            if _details:
                try:
                    _BODY_DETAILS_OVERRIDES[int(_row["product_id"])] = [
                        d.strip() for d in _details.split(";") if d.strip()
                    ]
                except (ValueError, KeyError):
                    pass

# Fallback auto-detection patterns for products NOT in the CSV (new drops).
_GRIP_LINES_RE = re.compile(r"\bgrip\s+lines?\b|\bgrip\s+rings?\b|\bdeep\s+grip\b", re.IGNORECASE)
_SMOOTH_RE = re.compile(r"\bsmooth\s+body\b|\bno\s+rings?\b|\bno\s+grip\b", re.IGNORECASE)


def classify_body_details(title: str, body_text: str) -> list[str]:
    haystack = (title or "") + " " + (body_text or "")
    out = []
    if _GRIP_LINES_RE.search(haystack): out.append("Grip Lines")
    if _SMOOTH_RE.search(haystack):     out.append("Smooth")
    return out


def extract_tags(haystack: str, title: str, body_text: str = "", product_id: int | None = None) -> dict:
    # Accessory check looks at title only — bodies of regular pens often mention
    # "pen clip" as a part description.
    is_accessory = bool(ACCESSORY_RE.search(title))
    # Clip status: accessories skip the filter entirely (pen trays don't have
    # clip status). For pens, manual CSV override wins; else use auto-classifier.
    if is_accessory:
        clips: list[str] = []
    elif product_id is not None and product_id in _CLIP_OVERRIDES:
        clips = [_CLIP_OVERRIDES[product_id]]
    else:
        auto = classify_clip(title, body_text)
        clips = [auto] if auto else []
    # Body details: CSV override wins; else auto-detect for new pens.
    # Texture rule: every pen is either "Grip Lines" or "Smooth" (binary).
    # If neither is set after CSV / auto-detect, default to "Smooth" (no grip lines).
    # "Tapered" is an orthogonal shape attribute and stays alongside whichever
    # texture was set.
    if is_accessory:
        body_details: list[str] = []
    else:
        if product_id is not None and product_id in _BODY_DETAILS_OVERRIDES:
            body_details = list(_BODY_DETAILS_OVERRIDES[product_id])
        else:
            body_details = classify_body_details(title, body_text)
        if "Grip Lines" not in body_details and "Smooth" not in body_details:
            body_details.append("Smooth")
    if product_id is not None and product_id in NOSE_OVERRIDES:
        noses = NOSE_OVERRIDES[product_id]
    else:
        noses = _match_bucket(haystack, NOSES)
    return {
        "category": "Accessory" if is_accessory else "Pen",
        "sizes": extract_sizes(title),
        "materials": MATERIAL_OVERRIDES.get(product_id) or extract_materials(haystack),
        "refills": classify_refills(haystack, title),
        "mechanisms": MECH_OVERRIDES.get(product_id) or _match_bucket(haystack, MECHANISMS),
        "clips": clips,
        "noses": noses,
        "finishes": ["KVR"] if KVR_RE.search(haystack) else ["Machine Finish"],
        "body_details": body_details,
    }


def normalize(p: dict) -> dict:
    variants = p.get("variants") or []
    prices = [float(v["price"]) for v in variants if v.get("price")]
    images = p.get("images") or []
    image_cdn = images[0]["src"] if images else ""
    image_local = (p.get("image_local") or [None])[0]
    body_text = _strip_html(p.get("body_html", ""))
    # Title is most reliable for taxonomy; pull from body too so descriptions can
    # supply tags missing from the title.
    haystack = f"{p['title']} \n {body_text}"
    variant_titles = [v.get("title") for v in variants if v.get("title") and v["title"] != "Default Title"]
    return {
        "id": p["id"],
        "title": p["title"],
        "url": f"{PRODUCT_URL_BASE}{p['handle']}",
        "published_at": p["published_at"][:10] if p.get("published_at") else None,
        "created_at": p["created_at"][:10] if p.get("created_at") else None,
        "updated_at": p["updated_at"][:10] if p.get("updated_at") else None,
        "first_seen": p.get("first_seen"),
        "last_seen": p.get("last_seen"),
        "archived": bool(p.get("archived")),
        "price_min": min(prices) if prices else None,
        "price_max": max(prices) if prices else None,
        "variant_count": len(variants),
        "variant_titles": variant_titles,
        # Local copy is the primary source; CDN URL stays as fallback so we don't
        # break before the first download finishes.
        "image": image_local or image_cdn,
        "image_cdn": image_cdn,
        "image_local": image_local,
        "images_local": p.get("image_local") or [],
        "image_count": len(images),
        "body_text": body_text,
        "body_html": p.get("body_html", ""),
        **extract_tags(haystack, p["title"], body_text, p["id"]),
        **extract_dimensions(body_text),
    }


def main() -> int:
    archive = json.loads(ARCHIVE.read_text())["products"]
    rows = [normalize(p) for p in archive.values()]
    rows.sort(key=lambda r: r["published_at"] or "", reverse=True)
    OUT.write_text(json.dumps({"products": rows}, indent=2))
    print(f"wrote {len(rows)} products to {OUT} ({sum(1 for r in rows if r['archived'])} archived)")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
