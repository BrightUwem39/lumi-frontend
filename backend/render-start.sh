#!/bin/sh
set -eu

npm run prisma:migrate:deploy
npm run prisma:seed
exec node dist/main.js
