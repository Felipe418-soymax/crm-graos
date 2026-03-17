FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma/
# Switch to SQLite provider for Docker deployment
RUN sed -i 's/provider  = "postgresql"/provider  = "sqlite"/' prisma/schema.prisma && \
    sed -i '/directUrl/d' prisma/schema.prisma && \
    sed -i 's/@unique @default(autoincrement())/@unique/' prisma/schema.prisma
# Install deps (ignore scripts to avoid platform-specific issues), then install sharp for Alpine
RUN npm install --ignore-scripts && \
    npm install --no-save @img/sharp-linuxmusl-x64 && \
    npx prisma generate
COPY . .
# Re-apply SQLite patches after COPY overwrites schema
RUN sed -i 's/provider  = "postgresql"/provider  = "sqlite"/' prisma/schema.prisma && \
    sed -i '/directUrl/d' prisma/schema.prisma && \
    sed -i 's/@unique @default(autoincrement())/@unique/' prisma/schema.prisma
# Remove PostgreSQL-specific mode: 'insensitive' from API routes
RUN find src -name '*.ts' -exec sed -i "s/, mode: 'insensitive' as const//g" {} + && \
    find src -name '*.ts' -exec sed -i "s/, mode: 'insensitive'//g" {} +
RUN npx prisma generate
# Verify sharp works before building
RUN node -e "require('sharp')" && echo "sharp OK"
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]
