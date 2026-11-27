#!/usr/bin/env bash
# Lance les tests SQL sur un PostgreSQL 16 jetable. Usage : bash supabase/tests/run.sh
set -euo pipefail
B=${PG_BIN:-/usr/lib/postgresql/16/bin}
DIR=$(mktemp -d); SRC=$(cd "$(dirname "$0")/.." && pwd)
cp -r "$SRC" "$DIR/sql"; chmod -R a+rwx "$DIR"
run() { if [ "$(id -u)" = 0 ]; then su postgres -c "$*"; else bash -c "$*"; fi; }
run "$B/initdb -D $DIR/data -A trust >/dev/null && $B/pg_ctl -D $DIR/data -o '-k $DIR -p 5499 -c listen_addresses=' -l $DIR/log -w start >/dev/null"
trap 'run "$B/pg_ctl -D $DIR/data -m fast stop >/dev/null"; rm -rf "$DIR"' EXIT
run "createdb -h $DIR -p 5499 slk"
for f in tests/stub_supabase.sql migrations/0001_init.sql migrations/0002_proximite_et_espace.sql migrations/0003_ecrans_fiches.sql migrations/0004_realisations.sql migrations/0005_securite.sql migrations/0006_equipe.sql seed.sql tests/test_v1.sql tests/test_0002.sql tests/test_0003.sql tests/test_0004.sql tests/test_0005.sql tests/test_0006.sql; do
  echo "### $f"
  run "cd $DIR/sql && psql -h $DIR -p 5499 -d slk -v ON_ERROR_STOP=1 -q -f $f"
done
