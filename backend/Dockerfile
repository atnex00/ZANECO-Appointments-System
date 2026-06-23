FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN mkdir -p backend frontend
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN pnpm install --no-frozen-lockfile

COPY backend/ ./backend/

RUN pnpm --filter zaneco-appointments-api exec prisma generate

EXPOSE 8000

CMD ["pnpm", "--filter", "zaneco-appointments-api", "run", "dev"]
