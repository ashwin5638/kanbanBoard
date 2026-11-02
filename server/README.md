# Kanban API (server)

Express + Prisma 7 + PostgreSQL. The database runs **locally** — no hosted
service (Supabase/Prisma Cloud/Neon/Railway) is used or required.

## Requirements

- Node.js 20+
- npm

PostgreSQL itself does not need to be installed. The repo uses Prisma 7's
built-in local Postgres server (`prisma dev`), which listens on `localhost`
and stores its data on your machine.

## First run

```powershell
npm install
copy .env.example .env      # then edit JWT_SECRET if you like
npm run db:start            # start the local Postgres server
npm run db:migrate          # apply prisma/migrations to it
npm run dev                 # API on http://localhost:5000
```

Check it:

```powershell
curl http://localhost:5000/api/health
```

## Day-to-day

| Command | What it does |
| --- | --- |
| `npm run db:start` | Start the local database (background daemon) |
| `npm run db:stop` | Stop it |
| `npm run db:status` | Show status + connection URLs |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run dev` | Run the API with auto-reload |
| `npm start` | Run the API normally |

The database daemon is **not** a Windows service: it must be running before
the API starts. `npm start` will fail with `P1001 Can't reach database server`
if you forget.

## Connection details

`DATABASE_URL` lives in `.env` (git-ignored, see `.env.example`).

```
postgresql://postgres:postgres@localhost:51214/kanban?sslmode=disable
```

- The Prisma dev server always resolves to its `template1` store, so the
  database name in the path is cosmetic — keep `kanban` so the URL is already
  correct if you later switch to a full PostgreSQL install.
- If the port ever differs, `npm run db:status` prints the exact **TCP**
  connection string; copy the port into `.env` and restart the API.
- Deleting the `kanban` dev server (`npx prisma dev rm kanban`) destroys the
  database. Start a new one and run `npm run db:migrate`.

## Schema changes

```powershell
npx prisma migrate dev --name describe_your_change
npm run db:migrate   # in other environments
```

`prisma/migrations/20261101120000_init_postgres` is the Postgres baseline
(the earlier SQLite-era migration was removed).

## Using a standard PostgreSQL install instead

Any Postgres works — just change `DATABASE_URL`, e.g.:

```
postgresql://postgres:<password>@localhost:5432/kanban?schema=public
```

then run `npm run db:migrate`. No code changes required; `src/config/db.js`
only reads `DATABASE_URL` through the `@prisma/adapter-pg` driver.

## Endpoints

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/health` | – |
| POST | `/auth/register` | `name`, `email`, `password`, `organizationName`, `tenantName` |
| POST | `/auth/login` | `email`, `password` |
