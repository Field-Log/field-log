# Vercel

`apps/web` deploys to Vercel. Production web deploys are owned by the
tag-triggered GitHub release workflow, not by automatic Vercel deploys from
`main`.

## Production Deploys

The `API Deploy` workflow deploys production web on pushed `v*` tags:

1. Validates `@app/web`.
2. Pulls the Vercel production environment.
3. Builds with `vercel build --prod`.
4. Deploys with `vercel deploy --prebuilt --prod`.
5. Smoke-tests the resulting production deployment URL.

## Git Deployment Gating

`apps/web/vercel.json` disables automatic Vercel Git deployments from `main`:

```json
{
  "git": {
    "deploymentEnabled": {
      "main": false
    }
  }
}
```

Confirm the same behavior in Vercel:

1. Open the Vercel project for `apps/web`.
2. Go to Project Settings -> Git.
3. Confirm `main` does not auto-promote to production.
4. If the Vercel project root is not `apps/web`, move the same
   `git.deploymentEnabled` config to the configured Vercel root or disable
   `main` deployments in the dashboard.

Branch previews should remain enabled through Vercel's Git integration.
