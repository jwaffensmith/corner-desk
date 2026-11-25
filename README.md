<img src="assets/cornerdesk-logo.png" alt="CornerDesk" width="560">

# CornerDesk

A personal workspace for professional development: a self-paced study plan, networking,
portfolio projects, reading notes, and the to-dos around them.

**Live site: [corner-desk.onrender.com](https://corner-desk.onrender.com)**
It runs on Render's free plan, so the first load after a quiet spell can take a minute.

## What's in it

| Tab | What it does | Design notes |
|---|---|---|
| Dashboard | Study progress and each portfolio project's progress at a glance | |
| To-do | One-off and weekly repeating tasks, grouped by when they are due | [docs/todos.md](docs/todos.md) |
| This week, Curriculum | A self-paced study plan, imported as JSON, with time and confidence logged per assignment. Its learning tracks are yours to define: add, rename, or delete them on the Curriculum tab, or list new ones in the file you import | [example file](client/public/curriculum.example.json) |
| Networking | Events you sign up for and attend, against a monthly goal | [docs/networking.md](docs/networking.md) |
| Portfolio | Your projects and the improvements you want to make to each | [docs/portfolio.md](docs/portfolio.md) |
| Reading | Notes, starred takeaways, and open questions from the books you read | [docs/reading.md](docs/reading.md) |

Each account has its own data. Sign-in is OAuth only (Google or GitHub), with an optional
invite list.

## Coming soon

AI-powered features are on the way.

## Stack

TypeScript throughout, in three npm workspaces:

- [client/](client/): React 19, Vite, Theme UI, TanStack Query, React Router
- [server/](server/): Express 5, Prisma on Postgres, Better Auth, Vitest
- [shared/](shared/): Zod schemas and limits used by both

## Running it locally

You need Node 22 or later and Docker.

```sh
npm install
cp .env.example .env
npm run db:up                         # Postgres on port 5434
npm run prisma:generate -w server
npm run prisma:deploy -w server
```

Then fill in `.env`:

- `BETTER_AUTH_SECRET`: generate one with `openssl rand -base64 32`.
- At least one sign-in provider. Create a Google or GitHub OAuth app, set its
  `*_CLIENT_ID` and `*_CLIENT_SECRET`, and register
  `http://localhost:5173/api/auth/callback/google` (or `/github`) as its callback URL.
- `ALLOWED_EMAILS`: optional, comma-separated. Leave it empty to let anyone sign up.

Start the API and the client in two terminals, then open http://localhost:5173.

```sh
npm run dev          # API on port 4000
npm run dev:client   # app on port 5173, proxying /api to the API
```

## Tests

The server tests run against a second database, `cornerdesk_test`, which `npm run db:up`
creates alongside the main one. Apply the migrations to it once, and again whenever a
migration is added:

```sh
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/cornerdesk_test" npm run prisma:deploy -w server
npm test
```

## Deploying

[render.yaml](render.yaml) describes a single Render web service: it builds the client,
applies migrations, and the API serves the built app. Bring your own Postgres and set:

- `DATABASE_URL`
- `BETTER_AUTH_URL`: the public address of the site. Register
  `<BETTER_AUTH_URL>/api/auth/callback/<provider>` with each OAuth app.
- The provider IDs and secrets, and `ALLOWED_EMAILS` if you want an invite list.

Render generates `BETTER_AUTH_SECRET` itself.
