FROM node:20-alpine AS builder
WORKDIR /workspace
COPY package.json ./
COPY tsconfig.base.json ./
COPY apps/zauth-sentinel/package.json ./apps/zauth-sentinel/package.json
RUN npm install --workspace apps/zauth-sentinel
COPY apps/zauth-sentinel ./apps/zauth-sentinel
RUN npm run build --workspace apps/zauth-sentinel

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY apps/zauth-sentinel/package.json ./package.json
RUN npm install --omit=dev
COPY --from=builder /workspace/apps/zauth-sentinel/dist ./dist
EXPOSE 3003
CMD ["node", "dist/index.js"]
