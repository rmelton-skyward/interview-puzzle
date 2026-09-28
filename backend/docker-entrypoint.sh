#!/bin/sh
set -e

# Apply any pending migrations before the API starts serving traffic.
npx prisma migrate deploy

exec "$@"
