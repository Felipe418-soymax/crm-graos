FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
COPY . .
RUN npm run build
ENV DATABASE_URL="file:/var/lib/crm-graos/prod.db"
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "mkdir -p /var/lib/crm-graos && node_modules/.bin/prisma db push --accept-data-loss && node_modules/.bin/next start -p 3000"]
