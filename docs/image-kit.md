# ImageKit

Field Log uses ImageKit for product and collection image storage and delivery.
Shared upload, update, and delete behavior lives in `@package/images` and is
exposed to apps through `@package/services`.

## URL Endpoints

The ImageKit account currently has two URL endpoints:

| Endpoint path | Purpose |
| --- | --- |
| `/fieldlog/main/` | Production image delivery. |
| `/fieldlog/` | Non-production image delivery for preview and dev paths. |

Production must use the `/fieldlog/main/` endpoint. Preview and dev must use
the `/fieldlog/` endpoint and separate themselves with folder prefixes.

The endpoint contributes the leading served URL path. Do not upload files into a
folder named `fieldlog` or `fieldlog/main`.

## Folder Prefixes

Upload folders are built from:

```text
/<IMAGE_KIT_FOLDER_PREFIX>/products/<image-owner-key>
```

When `IMAGE_KIT_FOLDER_PREFIX` is empty or unset, omit that segment.

| Environment | URL endpoint | Folder prefix | Lifetime |
| --- | --- | --- | --- |
| Production | `/fieldlog/main/` | unset | Long term. |
| Preview with isolated PR DB | `/fieldlog/` | `preview/pr-<number>` | Ephemeral. Delete when the PR closes or merges. |
| Preview using shared staging DB | `/fieldlog/` | `preview` | Long term non-production. |
| Local dev | `/fieldlog/` | `dev` | Shared local development namespace. |

Examples:

| Environment | Upload folder | Served path |
| --- | --- | --- |
| Production product image | `/products/1000` | `/fieldlog/main/products/1000/image.jpg` |
| Production variation image | `/products/1000-1001` | `/fieldlog/main/products/1000-1001/image.jpg` |
| Preview PR 52 product image | `/preview/pr-52/products/1000` | `/fieldlog/preview/pr-52/products/1000/image.jpg` |
| Shared staging preview product image | `/preview/products/1000` | `/fieldlog/preview/products/1000/image.jpg` |

## Product Paths

Products should use:

```text
/<prefix>/products/<tmp-products-id>
```

Variation images should use:

```text
/<prefix>/products/<tmp-products-id>-<tmp-product-variations-id>
```

Autmog pen images are product-level images and use `tmp_products.id` as the
ImageKit folder key. Grimsmo images are variation-level images because each
scraped listing handle is a product variation under a stable Grimsmo product.

Scraper uploads are tagged with `scraper`, the scraper source key such as
`autmog`, `grimsmo-saga`, or `grimsmo-rask`, `product:<tmp-products-id>`, and
`product-variation:<tmp-product-variations-id>` when the image belongs to a
variation.

Future app uploads should use the same shape for first-party entities:

```text
/<prefix>/products/<product-id>
/<prefix>/products/<product-id>-<variation-id>
```

## CI Behavior

The API deploy workflow decides the preview image prefix from the same
DB-change detection that selects the database branch:

The workflow applies the same prefix to the Vercel web preview and Railway
scraper preview service:

- DB-changing PRs get `IMAGE_KIT_FOLDER_PREFIX=preview/pr-<number>`.
- PRs without DB changes get `IMAGE_KIT_FOLDER_PREFIX=preview`.

The cleanup workflow removes branch-specific Vercel `IMAGE_KIT_FOLDER_PREFIX`
when the PR closes. Isolated PR image folders under `/preview/pr-<number>` must
also be deleted from ImageKit when preview image uploads are enabled for that
path.

Vercel environment changes apply to new deployments. If a preview deployment was
created before the branch environment variable changed, redeploy the Vercel
preview to pick up the new prefix.

## Runtime Env Vars

`docs/environment-variables.md` remains the compact index of environment
variables. ImageKit-specific behavior is defined here.

| Variable | Purpose |
| --- | --- |
| `IMAGE_KIT_PRIVATE_KEY` | Server-side upload, update, and delete authentication. |
| `IMAGE_KIT_PUBLIC_KEY` | Public key paired with the private key. Keep available for future signed browser upload flows. |
| `IMAGE_KIT_URL_ENDPOINT` | Delivery endpoint. Production uses `/fieldlog/main/`; preview and dev use `/fieldlog/`. |
| `IMAGE_KIT_FOLDER_PREFIX` | Optional namespace prepended to upload folders. Production leaves it unset. |

## Cleanup

Preview PR image folders are disposable. When DB-isolated preview image uploads
are enabled, PR close/merge cleanup should delete:

```text
/preview/pr-<number>
```

Deleting ImageKit files or folders does not necessarily purge already cached CDN
responses. If stale public images matter for a deleted preview, purge the
relevant cache entries after deletion.
