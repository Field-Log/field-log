# scrapers/

Catalog archivers for the maker sites behind **machinedpens.info**. Each site is
a Shopify store; we snapshot its product collection nightly into an append-only
archive, transform it into a `data.json` the site consumes, and publish the data
+ images to the live host.

One shared engine drives every site. Adding a new maker is a new folder under
`sites/` — a `config.toml` and a `build.py` — nothing else.

> Pure Python **standard library** (`urllib`, `json`, `tomllib`) — no `pip`
> install, nothing to provision. Requires **Python 3.11+** (for `tomllib`).

---

## Layout

```
scrapers/
  README.md
  core/
    shopify_archive.py   # SHARED: fetch + merge + image download, runs build.py
    deploy.sh            # SHARED: backup → run engine → safeguard → publish
  sites/
    autmog/
      config.toml        # source URL + deploy target (the only per-site knobs)
      build.py           # site-specific taxonomy → data.json
      clips_audit.csv         # manual classifier overrides (committed)
      body_details_audit.csv  # manual classifier overrides (committed)
      data/
        archive.json     # append-only history (COMMITTED)
        data.json        # generated build output (gitignored)
        images/          # downloaded product images (gitignored)
        raw_latest.json  # last upstream snapshot (gitignored)
    grimsmo-saga/
      config.toml
      build.py
      data/              # archive.json lives on the Pi — see "Operational notes"
```

## How a run works

```
core/deploy.sh sites/<site>
   │
   ├─ 1. cp data/archive.json → data/archive.json.bak      (recovery point)
   ├─ 2. python3 core/shopify_archive.py sites/<site>
   │        fetch collection ─▶ merge into data/archive.json (append-only)
   │        download new images ─▶ data/images/
   │        write data/raw_latest.json
   │        run sites/<site>/build.py ─▶ data/data.json
   ├─ 3. append-only safeguard: abort if product count dropped vs the .bak
   └─ 4. publish data.json + images  (rsync to remote host, or copy to local web root)
```

**archive.json is append-only by design.** Products never disappear; when an item
leaves the upstream collection its record is kept and flagged `archived: true`.
`first_seen` is stamped once and preserved; `last_seen` bumps each run the item
is present.

## Running it

```bash
# Fetch + build + publish one site (what cron runs):
scrapers/core/deploy.sh scrapers/sites/autmog

# Just rebuild data.json from the existing archive (no network, no publish):
python3 scrapers/sites/autmog/build.py

# Fetch + merge + build but skip publishing (engine only):
python3 scrapers/core/shopify_archive.py scrapers/sites/autmog
```

## config.toml reference

`[source]` — read by `core/shopify_archive.py`:

| key | meaning |
|---|---|
| `collection_url` | Shopify `…/products.json` collection endpoint |
| `page_limit` | products per page (Shopify max 250) |
| `max_pages` | stop after N pages (or the first empty page) |
| `page_pause` | seconds between page fetches (politeness / proxy pacing) |
| `retries` | attempts per request, with backoff (raise for flaky/blocked upstreams) |
| `proxy_env` | name of an env var holding a proxy URL; `""` = direct connection |
| `user_agent` | request UA string |

`[deploy]` — read by `core/deploy.sh`:

| key | meaning |
|---|---|
| `mode` | `remote` (push via ssh/rsync) or `local` (copy into a local web root) |
| `subdir` | publish under `<root>/<subdir>/`; `""` = web root itself |
| `remote_host` | ssh alias (used when `mode = remote`) |
| `remote_root` | remote web root path |
| `local_root` | local web root path (used when `mode = local`) |

## Adding a new site

1. `mkdir -p scrapers/sites/<new-site>/data`
2. Copy a `config.toml` from a sibling and set `collection_url`, `subdir`, and
   the deploy target.
3. Write `build.py` — read `data/archive.json`, emit `data/data.json`. Copy a
   sibling as a starting point; the taxonomy/extraction is the only real work.
4. Add a staggered cron entry (see below).

The shared `core/` is untouched — you never re-implement fetching, image
download, the append-only merge, or publishing.

## What's committed vs generated

- **Committed:** all code, each `config.toml`, the override CSVs, and each site's
  `data/archive.json` (the dataset history).
- **Gitignored:** `data/data.json` (rebuilt from the archive), `data/images/`
  (live on Hostinger; also under `apps/autmog/images`), `data/raw_latest.json`,
  and `archive.json.bak`.

## Scheduling

The schedule lives on the **host that runs the job** (it is not checked in).
Today that is the Raspberry Pi; the target is to move it onto Hostinger.

### Today — Raspberry Pi (`mode = remote`)

The Pi fetches/builds locally and pushes to Hostinger over the `autmog-hostinger`
ssh alias. Failure notification is delegated to cron via email:

```cron
MAILTO=info@bvgdigital.com
# Autmog — nightly 11:00 PM (America/New_York)
0 23 * * *  cd /home/bvg/autmog && /home/bvg/autmog/scrapers/core/deploy.sh scrapers/sites/autmog       >> autmog.log 2>&1       || tail -n 80 autmog.log
# Grimsmo Saga — staggered to 11:15 to avoid rsync contention
15 23 * * * cd /home/bvg/autmog && GRIMSMO_PROXY_URL="$GRIMSMO_PROXY_URL" ./scrapers/core/deploy.sh scrapers/sites/grimsmo-saga >> grimsmo.log 2>&1 || tail -n 80 grimsmo.log
```

Why the `|| tail -n 80 …`: piping the run to a log file leaves cron nothing to
mail. On a **clean** run cron sees no output → no email. On a **failure** the
guard prints the log tail → cron mails it to `MAILTO`. (Set the email address to
whatever you actually monitor; `info@bvgdigital.com` is a placeholder for now.)
This requires a working mail relay on the Pi (`msmtp`/`ssmtp`) — a one-time
host-side setup, not part of this repo.

### Target — Hostinger (`mode = local`)

Running the job **on** Hostinger removes the entire push step: there is no remote
to rsync to — the engine writes `data.json` + images straight into `public_html`.
To migrate:

1. Put `scrapers/` on the host (clone the repo, or sync the folder).
2. In each `config.toml`, switch `[deploy]`:
   ```toml
   mode = "local"
   local_root = "/home/uXXXX/domains/machinedpens.info/public_html"
   ```
   (`remote_host`/`remote_root` are then ignored.)
3. Add the cron job in hPanel → **Cron Jobs**. hPanel has a built-in
   notification-email field, so set `info@bvgdigital.com` there instead of the
   `MAILTO` + mail-relay setup the Pi needs.

Pre-move checklist: confirm the plan has **SSH + Python 3.11+** (pure stdlib =
nothing to `pip install`), and that outbound HTTPS is allowed. See the Grimsmo
note below — a shared Hostinger IP may be blocked by Grimsmo, in which case keep
`GRIMSMO_PROXY_URL` set.

## Operational notes

- **Append-only safeguards** (in `deploy.sh`): (1) `archive.json` is backed up
  before each fetch; (2) if the rebuilt `data.json` has fewer products than the
  pre-run archive, the publish is aborted and last-known-good is kept in
  `archive.json.bak`; (3) images publish **add-only** (`--ignore-existing`, never
  `--delete`) so a local corruption can't wipe the live image set.
- **Grimsmo proxy.** `grimsmoknives.com` persistently 403s some datacenter/shared
  IPs. Set `GRIMSMO_PROXY_URL` (a rotating endpoint, e.g. DataImpulse) on any host
  whose direct IP is blocked; leave it unset where the IP is fine (a dev Mac).
- **Grimsmo's `archive.json` is not in this repo.** It lives on the Pi
  (`grimsmo-monitor`). Pull it into `sites/grimsmo-saga/data/` before the first
  run on a new host — otherwise every product is re-stamped with today's
  `first_seen` and the history is lost. (Autmog's `archive.json` is committed.)
- **The front-end is deployed separately** (from `apps/`). `deploy.sh` publishes
  the *data* (`data.json` + images); it pushes an `index.html` only if one is
  present in the site folder.
