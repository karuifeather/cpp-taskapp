# Development Guide

This document covers local setup, day-to-day development, builds, and the repository layout for **cpp-taskapp**. For the app's functionality and planned API, see the [README](../README.md). For team workflow and PR standards, see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Prerequisites

- Node.js **22.12+** and npm (the repo includes `.nvmrc` with Node 22).
- PostgreSQL 17 (or a compatible PostgreSQL server), running locally or hosted.
- Docker with Compose **only if** you want to use the provided local PostgreSQL container.

## Getting Started

Run these commands from the repository root:

```bash
# Clone your team's repository, then enter it.
git clone https://github.com/karuifeather/cpp-taskapp
cd cpp-taskapp

# Install dependencies for all npm workspaces.
npm install

# Create your own local configuration.
cp .env.example .env
```

Edit the root `.env` as needed:

- `APP_NAME` sets the display name for the frontend and backend.
- `DATABASE_URL` points to the PostgreSQL instance you want to use.
- `PORT` sets the backend port (default `4000`).
- `CLIENT_ORIGIN` should match the frontend URL when using cross-origin API calls.

Do not commit `.env` or real credentials. Commit only safe examples in `.env.example`.

### Database

Choose **one** PostgreSQL option:

**Option A — Docker (optional):**

```bash
docker compose up -d postgres
```

The supplied Compose file exposes PostgreSQL on `localhost:5432` and uses development-only credentials matching `.env.example`.

Although please note, if you go this route, we already have npm scripts to start/log/stop the db server.

**Option B — Existing PostgreSQL:**

Create a database (for example, `cpp_taskapp`) in your existing local or hosted PostgreSQL service, then set `DATABASE_URL` in `.env` to its connection string. Docker is not required.

With PostgreSQL running and `DATABASE_URL` configured, initialize the schema and starter task catalog:

```bash
npm run db:migrate
npm run db:seed
```

`npm run db:reset` deletes data. It is intended for disposable local development databases only and requires `ALLOW_DB_RESET=true`.

### Start the application

```bash
npm run dev
```

This starts **only** the React and Express development servers. Start PostgreSQL separately using your chosen method.

| Service         | Default address                       |
| --------------- | ------------------------------------- |
| React / Vite    | `http://localhost:5173`               |
| Express API     | `http://localhost:4000`               |
| API health      | `http://localhost:4000/api/health`    |
| Database health | `http://localhost:4000/api/health/db` |

Vite proxies requests starting with `/api` to Express. If port 5173 is already occupied, Vite may select another port; check the terminal output.

To start only one service:

```bash
npm run dev:client
npm run dev:server
```

To stop the **optional Docker** database:

```bash
docker compose stop postgres
```

Or:

```bash
npm run db:down
```

## Builds and Checks

Run from the repository root:

```bash
# Produce production frontend files in client/dist/.
npm run build

# Preview the built frontend locally.
npm run preview -w client

# Start Express without development file watching.
npm run start

# Format all supported project files.
npm run format

# Check formatting without changing files.
npm run format:check
```

The frontend build and Express backend are separate; a deployment must host the built client and route API requests to the server. `npm run start` launches the API, not the React frontend.

Prettier configuration lives at the root in `.prettierrc.json`. Husky and lint-staged format supported staged files during commits. The Tailwind color tokens live in `client/src/styles/theme.css`; change the palette there rather than hardcoding colors across components.

## Project Structure

```text
cpp-taskapp/
├── client/                         # React + Vite frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── config/                 # Public application configuration
│   │   ├── lib/                    # API client helpers
│   │   ├── pages/                  # Application pages
│   │   ├── styles/
│   │   │   ├── app.css             # Tailwind CSS entry point
│   │   │   └── theme.css           # Centralized palette and design tokens
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                         # Express API
│   ├── src/
│   │   ├── config/                 # Server environment configuration
│   │   ├── db/                     # Database pool
│   │   ├── routes/                 # API routes
|   |   ├── controllers/            # Controllers
│   │   ├── app.js
│   │   └── index.js
│   └── package.json
├── db/                             # Database workspace
│   ├── scripts/                    # Migration, seeding, reset
│   ├── sql/                        # Schema and catalog seed SQL
│   ├── src/                        # Database utilities
│   └── package.json
├── planning/                       # User stories, wireframes, ERD
│   ├── user_stories.md
│   ├── wireframes.md
│   └── entity_relationship_diagram.md
├── .github/workflows/              # CI checks
├── .husky/                         # Pre-commit hook
├── .vscode/                        # Shared editor settings
├── .env.example                    # Safe environment template
├── .gitignore
├── .nvmrc
├── .prettierignore
├── .prettierrc.json
├── compose.yaml                    # Optional local PostgreSQL
├── package.json                    # Root scripts and npm workspaces
├── DEVELOPMENT.md                  # This guide
├── CONTRIBUTING.md
└── README.md
```
