FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx tsc

FROM node:20-alpine AS runtime

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/sql ./dist/sql

RUN mkdir -p ./uploads/policies

EXPOSE 3000

ENV NODE_ENV=production

CMD ["sh", "-c", "node dist/scripts/ensureSchema.js && node dist/server.js"]

