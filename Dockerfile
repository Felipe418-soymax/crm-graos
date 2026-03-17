FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma/
# Switch to SQLite provider for Docker deployment
RUN sed -i 's/provider  = "postgresql"/provider  = "sqlite"/' prisma/schema.prisma && \
    sed -i '/directUrl/d' prisma/schema.prisma && \
    sed -i 's/@unique @default(autoincrement())/@unique/' prisma/schema.prisma
RUN npm install --ignore-scripts
RUN npx prisma generate
COPY . .
# Re-apply SQLite patches after COPY overwrites schema
RUN sed -i 's/provider  = "postgresql"/provider  = "sqlite"/' prisma/schema.prisma && \
    sed -i '/directUrl/d' prisma/schema.prisma && \
    sed -i 's/@unique @default(autoincrement())/@unique/' prisma/schema.prisma
# Remove PostgreSQL-specific mode: 'insensitive' from API routes
RUN find src -name '*.ts' -exec sed -i "s/, mode: 'insensitive' as const//g" {} + && \
    find src -name '*.ts' -exec sed -i "s/, mode: 'insensitive'//g" {} +
RUN npx prisma generate
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]
