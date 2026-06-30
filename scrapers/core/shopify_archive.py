#!/usr/bin/env python3
"""Shared Shopify-collection archiver — the fetch + merge + image engine every
site shares. One file, no per-site logic; all behaviour comes from the site's
config.toml.

For a site directory <site> it:
  1. fetches <site>/config.toml's `source.collection_url` (paginated),
  2. merges the result into <site>/data/archive.json — APPEND-ONLY: products
     never disappear. Each record carries first_seen, last_seen, and an
     `archived` flag set true when upstream no longer lists it,
  3. downloads any new images into <site>/data/images/,
  4. writes <site>/data/raw_latest.json (the latest upstream snapshot only),
  5. runs <site>/build.py, which transforms archive.json → <site>/data/data.json.

Usage:
    python3 core/shopify_archive.py <site_dir>      # e.g. sites/autmog

Pure standard library — urllib/json/tomllib, no third-party deps. tomllib needs
Python 3.11+. The optional proxy + retry path (config: source.proxy_env /
source.retries) exists for upstreams that block a host's direct IP (Grimsmo);
sites that don't need it leave proxy_env empty and retries at 1.
"""
import json
import os
import subprocess
import sys
import time
import tomllib
import urllib.request
from datetime import date
from pathlib import Path

IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".gif")


def load_config(site_dir: Path) -> dict:
    cfg_path = site_dir / "config.toml"
    if not cfg_path.exists():
        sys.exit(f"no config.toml in {site_dir}")
    with open(cfg_path, "rb") as f:
        return tomllib.load(f)


def make_fetch(src: dict):
    """Return a `fetch(url, timeout) -> bytes` honouring this site's user-agent,
    optional proxy, and retry policy.

    Proxy: if `source.proxy_env` names an env var that is set (e.g.
    GRIMSMO_PROXY_URL=http://user:pass@host:port), every request goes through a
    FRESH urllib opener — rotating-proxy services hand out a new exit IP per
    connection, so a pooled connection would get stuck on one possibly-blocked IP.
    """
    ua = src.get("user_agent", "python-requests/2.33.1")
    retries = max(1, int(src.get("retries", 1)))
    proxy_env = src.get("proxy_env", "")
    proxy_url = os.environ.get(proxy_env, "").strip() if proxy_env else ""

    def opener():
        if proxy_url:
            return urllib.request.build_opener(
                urllib.request.ProxyHandler({"http": proxy_url, "https": proxy_url})
            )
        return urllib.request.build_opener()

    def fetch(url: str, timeout: int = 30) -> bytes:
        last_err = None
        for attempt in range(retries):
            try:
                req = urllib.request.Request(
                    url, headers={"User-Agent": ua, "Accept": "application/json,image/*"}
                )
                with opener().open(req, timeout=timeout) as r:
                    return r.read()
            except Exception as e:  # noqa: BLE001 — surface the last error after retries
                last_err = e
                if attempt + 1 < retries:
                    time.sleep(1.0 + attempt)
        raise RuntimeError(f"fetch failed after {retries} attempt(s): {url}\nlast error: {last_err}")

    return fetch, proxy_url


def fetch_all(fetch, src: dict) -> list[dict]:
    url = src["collection_url"]
    limit = int(src.get("page_limit", 250))
    max_pages = int(src.get("max_pages", 20))
    pause = float(src.get("page_pause", 0.0))
    products: list[dict] = []
    for page in range(1, max_pages + 1):
        batch = json.loads(fetch(f"{url}?limit={limit}&page={page}"))["products"]
        if not batch:
            break
        products.extend(batch)
        if pause:
            time.sleep(pause)  # gentle pacing across pages
    return products


def _image_local_name(pid: int, idx: int, src_url: str) -> str:
    ext = os.path.splitext(src_url.split("?", 1)[0])[1].lower() or ".jpg"
    if ext not in IMAGE_EXTS:
        ext = ".jpg"
    return f"{pid}-{idx}{ext}"


def download_image(fetch, src_url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        return False
    try:
        dest.write_bytes(fetch(src_url, timeout=60))
        return True
    except Exception as e:  # noqa: BLE001 — one bad image must not abort the run
        print(f"  image fetch failed {src_url} → {e}")
        return False


def merge_into_archive(fetched: list[dict], archive_path: Path, images_dir: Path, fetch) -> dict:
    archive = {"products": {}}
    if archive_path.exists():
        archive = json.loads(archive_path.read_text())
    today = date.today().isoformat()
    images_dir.mkdir(parents=True, exist_ok=True)
    fetched_ids = set()
    new_count = updated_count = 0
    for p in fetched:
        pid = str(p["id"])
        fetched_ids.add(pid)
        existing = archive["products"].get(pid, {})
        record = {
            **p,
            "first_seen": existing.get("first_seen") or today,  # set once, preserved forever
            "last_seen": today,
            "archived": False,
            "image_local": [],
        }
        # Preserve already-downloaded image paths, then top up with any new ones.
        local_paths = list(existing.get("image_local") or [])
        for idx, img in enumerate(p.get("images") or []):
            local_name = _image_local_name(p["id"], idx, img["src"])
            if download_image(fetch, img["src"], images_dir / local_name):
                time.sleep(0.05)  # be polite
            rel = f"images/{local_name}"
            if rel not in local_paths:
                local_paths.append(rel)
        record["image_local"] = local_paths
        archive["products"][pid] = record
        updated_count += 1 if existing else 0
        new_count += 0 if existing else 1
    # Items in the archive but missing from this fetch → archived (last_seen untouched).
    archived_now = 0
    for pid, rec in archive["products"].items():
        if pid in fetched_ids:
            continue
        if not rec.get("archived"):
            archived_now += 1
        rec["archived"] = True
    print(
        f"  new: {new_count}  updated: {updated_count}  "
        f"newly-archived: {archived_now}  total: {len(archive['products'])}"
    )
    return archive


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        sys.exit("usage: shopify_archive.py <site_dir>")
    site_dir = Path(argv[1]).resolve()
    cfg = load_config(site_dir)
    label = cfg.get("label", site_dir.name)
    src = cfg["source"]

    data_dir = site_dir / "data"
    data_dir.mkdir(exist_ok=True)
    archive_path = data_dir / "archive.json"
    images_dir = data_dir / "images"
    raw_latest = data_dir / "raw_latest.json"

    fetch, proxy_url = make_fetch(src)
    via = f"via proxy {proxy_url.split('@')[-1]}" if proxy_url else "direct (no proxy)"
    print(f"[{label}] fetching upstream catalog {via}…")
    fetched = fetch_all(fetch, src)
    print(f"  {len(fetched)} products in upstream collection")

    raw_latest.write_text(json.dumps({"products": fetched, "fetched_at": date.today().isoformat()}, indent=2))
    print("merging into archive…")
    archive = merge_into_archive(fetched, archive_path, images_dir, fetch)
    archive_path.write_text(json.dumps(archive, indent=2))
    print(f"wrote {archive_path}")

    print("running build.py…")
    return subprocess.call([sys.executable, str(site_dir / "build.py")])


if __name__ == "__main__":
    sys.exit(main(sys.argv))
