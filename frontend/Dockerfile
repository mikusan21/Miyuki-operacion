# Etapa 1: construir la app
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Etapa 2: ejecutar la app
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

RUN npm install --omit=dev

EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
