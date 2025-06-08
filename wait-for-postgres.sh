#!/bin/sh
# wait-for-postgres.sh

set -e

# Loop sampai psql berhasil terhubung dan database siap
until PGPASSWORD=$PGPASSWORD psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - continuing..."
# Perintah exec akan menggantikan proses shell dengan perintah yang diberikan,
# ini adalah praktik yang baik untuk container.
exec "$@"