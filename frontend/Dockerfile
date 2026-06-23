FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN mkdir -p backend frontend
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN pnpm install --no-frozen-lockfile

COPY frontend/ ./frontend/

EXPOSE 3500

ENV CHOKIDAR_USEPOLLING=1

CMD ["pnpm", "--filter", "zaneco-frontend", "run", "dev"]
