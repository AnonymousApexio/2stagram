FROM node:24-bookworm-slim AS native-build
# Repli de compilation des modules natifs, absent des images finales.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

FROM native-build AS dependencies
WORKDIR /app
ENV HUSKY=0 SCARF_ANALYTICS=false
COPY package.json package-lock.json .npmrc ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY shared/package.json shared/package.json
COPY scripts/prepare-hooks.ts scripts/prepare-hooks.ts
RUN npm ci --no-fund

FROM dependencies AS build
COPY . .
RUN npm run build

FROM native-build AS production-dependencies
WORKDIR /app
ENV HUSKY=0 SCARF_ANALYTICS=false
COPY package.json package-lock.json .npmrc ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY shared/package.json shared/package.json
COPY scripts/prepare-hooks.ts scripts/prepare-hooks.ts
RUN npm ci --omit=dev --workspace @2stagram/backend --workspace @2stagram/shared --no-fund

FROM node:24-bookworm-slim AS backend
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/backend ./backend
COPY --from=build --chown=node:node /app/shared/package.json ./shared/package.json
COPY --from=build --chown=node:node /app/shared/dist ./shared/dist
RUN mkdir -p /app/db /app/media && chown node:node /app/db /app/media
USER node
EXPOSE 3000
CMD ["node", "backend/src/server.ts"]

FROM nginx:alpine AS frontend
COPY infra/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
