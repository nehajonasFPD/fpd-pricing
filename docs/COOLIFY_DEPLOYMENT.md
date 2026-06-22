# APEX Coolify Deployment Guide

This guide explains the live Coolify deployment for APEX and how to keep it healthy. It is written for an operator or technical owner.

## Live App

| Item | Value |
| --- | --- |
| Public URL | `http://fpd-pricing-apex.167.233.109.59.sslip.io` |
| Dashboard URL | `http://fpd-pricing-apex.167.233.109.59.sslip.io/dashboard` |
| Coolify app name | `fpd-pricing-apex` |
| Coolify app UUID | `dzetj43959oer1tb3jlpg7ll` |
| Coolify project | `My first project` |
| Coolify project UUID | `x8em2z7xhz5vldff0zzp0glt` |
| Coolify environment | `production` |
| Coolify environment UUID | `ua99lnf7a9s1mnee0m50nv6m` |
| Coolify server | `localhost` |
| Coolify server UUID | `qo0yjqfa5tqerencjsu8c9e1` |
| Git repository | `https://github.com/nehajonasFPD/fpd-pricing.git` |
| Branch | `main` |
| Build pack | Dockerfile |
| Exposed port | `3000` |

## Production Environment Variables

Coolify must have these variables:

| Variable | Purpose |
| --- | --- |
| `APEX_API_KEY` | Anthropic API key for analysis and chat |
| `APEX_MODEL` | Anthropic model override; use `claude-sonnet-4-6` |
| `APEX_PASSWORD` | Shared password for dashboard access |
| `APEX_SESSION_SECRET` | Long random string used to sign login cookies |
| `APEX_COOKIE_SECURE` | Set to `true` only when the app is served over HTTPS |
| `NODE_ENV` | Production runtime setting |
| `NEXT_TELEMETRY_DISABLED` | Disables Next.js telemetry |

Security rules:

- Store `APEX_API_KEY` only in Coolify environment variables.
- Keep `APEX_API_KEY` runtime-only, not build-time.
- Store `APEX_PASSWORD` and `APEX_SESSION_SECRET` only in Coolify environment variables.
- Use a long random value for `APEX_SESSION_SECRET`, for example output from `openssl rand -hex 32`.
- Keep `APEX_COOKIE_SECURE=false` while using the current `http://` URL. Change it to `true` after moving the app to HTTPS.
- Do not paste the real key into Git, docs, Slack, screenshots, or support tickets.
- It is safe for `APEX_MODEL` to be visible because it is not a secret.

## Current Verified State

The deployment was verified after adding the Anthropic key and updating the model configuration.

Verified checks:

- `/` returned `200 OK`.
- `/dashboard` redirects unauthenticated users to `/login`.
- `/api/analyse` returned synthetic recommendations for `TEST-RAISE`, `TEST-DROP`, and `TEST-ALERT`.
- `/api/chat` returned a valid assistant response.
- `APEX_API_KEY` existed in Coolify with `is_buildtime: false`.
- The latest deployment completed on commit `0c33835`.

## Normal Deployment Process

Use this process for normal changes:

1. Make code or docs changes locally.
2. Run a local verification:

```text
docker compose build
```

3. Commit and push to `main`.
4. In Coolify, redeploy `fpd-pricing-apex`.
5. Check the public URL and dashboard URL.
6. Log in with the shared dashboard password.
7. Run a small analysis smoke test before telling operators the app is ready.

Coolify can also redeploy automatically if auto-deploy is enabled for the app.

## Smoke Test Data

Use tiny synthetic data for deployment checks. Do not use real pricing exports for a smoke test.

Looker sample:

```text
SKU,Product Line,ASIN,Current Stock,Due Stock,Total Sales,GP,GM %,TACOS,DOS
TEST-RAISE,Test Line,B000RAISE,200,0,5000,1800,0.36,0.05,45
TEST-DROP,Test Line,B000DROP,500,0,4000,-200,-0.05,0.18,70
TEST-ALERT,Test Line,B000ALERT,5,0,1000,200,0.20,0.07,8
```

Sellerboard sample:

```text
Product,ASIN,SKU,Units,Sales,Gross profit,Net profit,Margin,BSR,Real ACOS,Sessions,Unit Session Percentage,Average Sales Price
Raise Product,B000RAISE,TEST-RAISE,80,5000,1900,1200,28,10000,5,1200,12,62.50
Drop Product,B000DROP,TEST-DROP,60,4000,100,-300,-5,20000,20,800,6,66.67
Alert Product,B000ALERT,TEST-ALERT,20,1000,200,100,20,15000,7,400,8,50
```

Expected result:

- `TEST-RAISE` should return `RAISE`.
- `TEST-DROP` should return `DROP`.
- `TEST-ALERT` should return `ALERT`.

## Known Issues And Follow-Ups

- The app still uses `next@14.2.3`, which shows a security warning during builds. Upgrade Next.js before broader production exposure.
- The current app sends only the first 100 rows from each uploaded Looker and Sellerboard file to the model.
- This deployment uses the sslip.io URL. Add a real domain later if the app becomes a regular team tool.
