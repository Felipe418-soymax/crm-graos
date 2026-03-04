#!/bin/bash
# Script de deploy - CRM Grãos
# Execute no VPS: bash deploy_vps.sh

set -e

echo "🚀 Iniciando deploy..."

# 1. Entrar no diretório do projeto
cd /var/www/crm-graos

# 2. Puxar últimas mudanças do GitHub
echo "📥 Fazendo git pull..."
git pull origin main

# 3. Build da imagem Docker
echo "🔨 Fazendo docker build..."
docker build -t crm-graos:latest .

# 4. Atualizar o serviço Docker Swarm
echo "🔄 Atualizando serviço Docker..."
docker service update --force crm_crm

# 5. Aguardar serviço inicializar
echo "⏳ Aguardando serviço inicializar..."
sleep 15

# 6. Rodar prisma db push dentro do container
echo "🗄️ Atualizando banco de dados (prisma db push)..."
CONTAINER_ID=$(docker ps --filter "name=crm_crm" --format "{{.ID}}" | head -1)
if [ -n "$CONTAINER_ID" ]; then
  docker exec $CONTAINER_ID npx prisma db push --accept-data-loss
  echo "✅ Banco atualizado!"
else
  echo "⚠️  Container não encontrado, tente manualmente."
fi

echo ""
echo "✅ Deploy concluído! Acesse https://crm.soymax.site"
