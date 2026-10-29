#!/bin/sh
# Back to the snapshot: empty every table, reload the data.
set -e
cd "$(dirname "$0")"
T=$(psql -h localhost -U postgres -d IssueTracker -At -c "select string_agg(format('%I', tablename), ', ') from pg_tables where schemaname='public' and tablename <> '_prisma_migrations'")
psql -h localhost -U postgres -d IssueTracker -q -c "TRUNCATE $T CASCADE"
pg_restore -h localhost -U postgres -d IssueTracker --data-only --disable-triggers -L ${SNAPSHOT:-.snapshot}/db.list ${SNAPSHOT:-.snapshot}/db.dump 2>&1 | grep -v 'WARNING' || true
