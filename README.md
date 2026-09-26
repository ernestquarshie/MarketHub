# MarketHub

A multi-vendor **B2C + B2B marketplace**. It combines Amazon-grade retail shopping with Alibaba-style bulk sourcing (tiered pricing, MOQ, RFQ and supplier messaging), plus local payment and delivery options for Africa (mobile money, pickup stations, pay on delivery) and global card payments.

> Portfolio / demo build. All payments run in **test mode**. All sellers, brands and people in the demo data are fictional.

## Stack

Next.js 16 (App Router, React 19) · TypeScript (strict) · Tailwind CSS v4 + Radix UI · PostgreSQL + Drizzle ORM · Better Auth · Vitest · Playwright + axe · GitHub Actions. Full rationale is in [docs/03-design.md](docs/03-design.md).

## Quick start

Requirements: Node 22+, pnpm 10+, and Docker (or any PostgreSQL 16 server).

```bash
pnpm install
cp .env.example .env            # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
docker compose up -d            # Postgres on localhost:5432
pnpm db:migrate && pnpm db:seed # schema + demo data
pnpm dev                        # http://localhost:3000
```

### Demo accounts

Use **Try as…** in the top bar, or sign in with any of these (password `Demo1234!`):

| Role                   | Email                          |
| ---------------------- | ------------------------------ |
| Shopper (Accra)        | `shopper@demo.markethub.test`  |
| Business buyer (Lagos) | `business@demo.markethub.test` |
| Seller (VoltHub)       | `seller@demo.markethub.test`   |
| Admin                  | `admin@demo.markethub.test`    |

## Scripts

| Command                                        | What it does                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm dev` / `pnpm build` / `pnpm start`       | Run, build and serve the app                                                           |
| `pnpm lint` · `pnpm typecheck` · `pnpm format` | Code quality                                                                           |
| `pnpm test`                                    | Unit tests (Vitest): money, pricing rules, authorization policy                        |
| `pnpm test:e2e`                                | Playwright E2E + accessibility tests (builds must exist; starts `pnpm start` on :3100) |
| `pnpm db:generate` / `pnpm db:migrate`         | Create / apply Drizzle migrations                                                      |
| `pnpm db:seed`                                 | **Reset** the database and load demo data                                              |
| `pnpm db:studio`                               | Browse the database                                                                    |

To use a system Chromium for E2E, set `PLAYWRIGHT_CHROMIUM_PATH`.

## Project layout

```
src/
  app/(store)/        storefront + account (header/footer layout)
  app/(auth)/         login, register, password reset
  app/(dashboard)/    seller centre and admin (sidebar layout, role-guarded)
  app/api/auth/       Better Auth handler
  components/         ui primitives, layout, store components
  lib/                money, pricing rules, utils (pure, unit-tested)
  server/             db (schema, client), auth (config, session, policy), actions, queries
  proxy.ts            optimistic auth redirect for /account, /seller, /admin
scripts/seed/         deterministic demo dataset
tests/unit, tests/e2e
docs/                 stage docs (brief → deploy), prototype, changelog
```

## Security notes

- Authorization lives in `src/server/auth/policy.ts` and is checked in every protected layout, page and server action. `proxy.ts` only redirects signed-out users early.
- Inputs are validated with Zod. Money is stored as integer minor units.
- Secrets live in `.env` (git-ignored). Only `.env.example` is committed.

## Project docs

| Stage          | Doc                                                                     |
| -------------- | ----------------------------------------------------------------------- |
| 0 Discovery    | [docs/00-brief.md](docs/00-brief.md)                                    |
| 1 References   | [docs/01-references.md](docs/01-references.md)                          |
| 2 Requirements | [docs/02-requirements.md](docs/02-requirements.md)                      |
| 3 Design       | [docs/03-design.md](docs/03-design.md) · prototype in `docs/prototype/` |
| 4 Build plan   | [docs/04-build-plan.md](docs/04-build-plan.md)                          |
| Decisions      | [docs/CHANGELOG.md](docs/CHANGELOG.md)                                  |

Product photos in `public/images/products` are AI-generated sample images made for this demo.
