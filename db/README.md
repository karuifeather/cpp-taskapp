# Database

PostgreSQL is managed through root npm scripts:

```sh
npm run db:migrate
npm run db:seed
```

`db:reset` is intentionally destructive: it removes every record including users.
Set `ALLOW_DB_RESET=true` in the root `.env` only for local development, then run
`npm run db:reset`. Never expose this function as a public API endpoint.

The SQL schema enforces one running timer per user with a partial unique index.
Time calculations and points are future Area 3 backend work; the schema does not award points itself.
