# Docker

Use Docker for local infrastructure that should not be installed directly on the
host. For scraper development, Docker runs the local Redis queue used by
BullMQ.

## OrbStack On macOS

OrbStack is the recommended local Docker runtime on macOS.

1. Install OrbStack from [orbstack.dev](https://orbstack.dev).
2. Open OrbStack once so it can install and start its Docker-compatible runtime.
3. Confirm Docker is available:

```sh
docker version
```

## Scraper Redis

Run the scraper local dev flow from the repo root:

```sh
pnpm dev:scraper
```

That command starts or reuses a Redis container named
`field-log-scraper-redis`, maps host port `4008` to the container Redis port, and
runs `apps/scraper` with:

```dotenv
REDIS_URL=redis://localhost:4008
```

Override the local Redis port when needed:

```sh
SCRAPER_REDIS_PORT=6380 pnpm dev:scraper
```

The helper does not delete Redis data. To remove the local scraper Redis
container and its data:

```sh
docker rm -f field-log-scraper-redis
```
