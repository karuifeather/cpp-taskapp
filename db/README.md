# Database

PostgreSQL is managed through root npm scripts:

```sh
npm run db:migrate
npm run db:seed
```

`db:seed` adds the 5 categories, the quest catalog, and 40 demo users
(`maria@questmaster.test`, `alex@questmaster.test`, and more) with finished quests
so the leaderboard has people on it. Every demo user's password is `questmaster123`.
Alex also has 3 quests planned for the day the seed runs. Seeding again skips
anything that is already there.

`db:reset` is intentionally destructive: it removes every record including users.
Set `ALLOW_DB_RESET=true` in the root `.env` only for local development, then run
`npm run db:reset`. Never expose this function as a public API endpoint.

The SQL schema enforces one running timer per user with a partial unique index.
Time calculations and points are future Area 3 backend work; the schema does not award points itself.
