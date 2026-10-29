# Capture kit

Records the screenshots and videos in `public/media/<lang>/` from a running
Barynt with the seed data (workspace "Nimbus"). Run it again when the app's
look changes; the files are committed, the build only copies them.

## What it needs

- Barynt running on `http://localhost:3000` (`BARYNT_URL` to change it) with
  `bun run db:dev` seed data, plus the four demo views and English project
  descriptions from `demo.sql`.
- Playwright with Chromium, ffmpeg (libx264, libwebp), `psql`/`pg_dump`.

## Steps

```sh
# 1. a session cookie for the seeded owner (sign-in is magic link only)
cd /path/to/Barynt
bun --env-file=.env /path/to/barynt-site/scripts/capture/cookie.ts \
  <user-id> owner@nimbus.io Mara Velez '#6e63e6' > /path/to/barynt-site/scripts/capture/token

# 2. demo data, then a snapshot every recording starts from
psql -h localhost -U postgres -d IssueTracker -f demo.sql
mkdir -p .snapshot && pg_dump -h localhost -U postgres -Fc IssueTracker > .snapshot/db.dump
pg_restore -l .snapshot/db.dump | grep -v _prisma_migrations > .snapshot/db.list

# 3. record (videos change data; the snapshot is restored around each one)
node produce.js en && node produce.js de && node phones.js
# 4. encode into public/media — see encode.sh
./encode.sh
```

`token`, `out/`, `vid-*` and `.snapshot/` stay out of git.
