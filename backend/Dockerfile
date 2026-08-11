FROM node:24-bookworm-slim AS build
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN for attempt in 1 2 3; do \
      npm ci --no-audit && exit 0; \
      if [ "$attempt" -eq 3 ]; then exit 1; fi; \
      echo "npm ci failed; retrying ($attempt/3)"; \
      sleep 10; \
    done

COPY nest-cli.json tsconfig.json tsconfig.build.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

# Prisma config validates DATABASE_URL while generating, but generation does not connect.
ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV DATABASE_URL=$DATABASE_URL
RUN npm run prisma:generate && npm run build

FROM build AS migrate
CMD ["npm", "run", "prisma:migrate:deploy"]

FROM build AS production-dependencies
RUN npm prune --omit=dev && npm cache clean --force

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --chown=node:node render-start.sh ./render-start.sh
RUN chmod 0555 ./render-start.sh

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
