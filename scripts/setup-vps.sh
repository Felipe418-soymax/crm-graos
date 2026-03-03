#!/usr/bin/env bash
# =============================================================================
# setup-vps.sh — Instalação completa do CRM Grãos no VPS Ubuntu 22/24 LTS
# Uso: bash <(curl -fsSL https://raw.githubusercontent.com/Felipe418-soymax/crm-graos/main/scripts/setup-vps.sh)
# =============================================================================
set -e

# ── Cores para output ─────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

echo -e "${BLUE}"
echo "======================================================"
echo "  CRM Grãos — Setup VPS Ubuntu 22/24 LTS"
echo "======================================================"
echo -e "${NC}"

# ── Variáveis configuráveis ───────────────────────────────────────────────────
APP_DIR="/var/www/crm-graos"
DB_DIR="/var/lib/crm-graos"
LOG_DIR="/var/log/pm2"
REPO_URL="https://github.com/Felipe418-soymax/crm-graos.git"
APP_USER="${SUDO_USER:-root}"   # usa o user que rodou sudo, ou root
NODE_VERSION="20"

# ── 1. Sistema ────────────────────────────────────────────────────────────────
info "Atualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq git curl build-essential nginx ufw
ok "Sistema atualizado"

# ── 2. Node.js 20 LTS ─────────────────────────────────────────────────────────
if command -v node &>/dev/null && [[ "$(node -v)" =~ ^v20 ]]; then
  ok "Node.js $(node -v) já instalado"
else
  info "Instalando Node.js ${NODE_VERSION} LTS..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - >/dev/null 2>&1
  apt-get install -y -qq nodejs
  ok "Node.js $(node -v) instalado"
fi

# ── 3. PM2 ────────────────────────────────────────────────────────────────────
if command -v pm2 &>/dev/null; then
  ok "PM2 já instalado"
else
  info "Instalando PM2..."
  npm install -g pm2 --silent
  ok "PM2 instalado"
fi

# ── 4. Diretórios ─────────────────────────────────────────────────────────────
info "Criando diretórios..."
mkdir -p "$APP_DIR" "$DB_DIR" "$DB_DIR/backups" "$LOG_DIR"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR" "$DB_DIR" "$LOG_DIR"
chmod 750 "$DB_DIR"
ok "Diretórios criados"

# ── 5. Código (Git clone ou pull) ─────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  info "Atualizando código existente..."
  git -C "$APP_DIR" pull origin main
else
  info "Clonando repositório..."
  git clone "$REPO_URL" "$APP_DIR"
fi
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
ok "Código pronto em $APP_DIR"

# ── 6. .env de produção ───────────────────────────────────────────────────────
ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  info "Criando .env de produção..."
  JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
  cat > "$ENV_FILE" <<EOF
NODE_ENV=production
DATABASE_URL="file:${DB_DIR}/prod.db"
JWT_SECRET="${JWT_SECRET}"
EOF
  chmod 600 "$ENV_FILE"
  ok ".env criado com JWT_SECRET gerado automaticamente"
  warn "Guarde este JWT_SECRET! Arquivo: $ENV_FILE"
else
  ok ".env já existe (não sobrescrito)"
fi

# ── 7. npm install ────────────────────────────────────────────────────────────
info "Instalando dependências npm (pode levar 1-2 min)..."
cd "$APP_DIR"
npm install --silent
ok "Dependências instaladas"

# ── 8. Prisma — criar banco ───────────────────────────────────────────────────
info "Configurando banco de dados..."
npx prisma db push --skip-generate 2>&1 | grep -E "(✓|error|Error|created|already)" || true
ok "Banco de dados em ${DB_DIR}/prod.db"

# ── 9. npm run build ──────────────────────────────────────────────────────────
info "Fazendo build do Next.js (pode levar 2-3 min)..."
npm run build
ok "Build concluído"

# ── 10. PM2 ───────────────────────────────────────────────────────────────────
info "Iniciando/reiniciando app com PM2..."
if pm2 describe crm-graos &>/dev/null; then
  pm2 reload crm-graos
else
  pm2 start ecosystem.config.js --env production
fi
pm2 save
ok "App rodando no PM2"

# PM2 startup (para sobreviver a reboot)
info "Configurando startup do PM2..."
PM2_STARTUP=$(pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" 2>&1 | grep "sudo env")
if [ -n "$PM2_STARTUP" ]; then
  eval "$PM2_STARTUP" || true
  ok "PM2 startup configurado"
fi

# ── 11. Nginx ─────────────────────────────────────────────────────────────────
info "Configurando Nginx..."

# Pede o domínio
if [ -z "$DOMAIN" ]; then
  read -rp "$(echo -e "${YELLOW}Digite seu domínio (ex: crm.seudominio.com): ${NC}")" DOMAIN
fi

cat > /etc/nginx/sites-available/crm-graos <<NGINXCONF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           \$http_upgrade;
        proxy_set_header   Connection        'upgrade';
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400s;
        client_max_body_size 10M;
    }

    access_log /var/log/nginx/crm-graos.access.log;
    error_log  /var/log/nginx/crm-graos.error.log;
}
NGINXCONF

# Ativar site
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
ln -sf /etc/nginx/sites-available/crm-graos /etc/nginx/sites-enabled/

nginx -t && systemctl reload nginx
ok "Nginx configurado para $DOMAIN"

# ── 12. Firewall (UFW) ────────────────────────────────────────────────────────
info "Configurando firewall..."
ufw allow OpenSSH    >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable   >/dev/null 2>&1 || true
ok "Firewall: SSH + HTTP/HTTPS liberados"

# ── Resumo final ──────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  ✅ CRM Grãos instalado com sucesso!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo -e "  📦 App:       ${BLUE}$APP_DIR${NC}"
echo -e "  🗄️  Banco:     ${BLUE}${DB_DIR}/prod.db${NC}"
echo -e "  🌐 Domínio:   ${BLUE}http://${DOMAIN}${NC}"
echo -e "  📋 PM2:       ${BLUE}pm2 status${NC}"
echo -e "  📝 Logs:      ${BLUE}pm2 logs crm-graos${NC}"
echo ""
warn "Próximos passos:"
echo "  1. Configure o DNS: registro A de '${DOMAIN}' apontando para $(curl -s ifconfig.me 2>/dev/null || echo '<IP_DO_VPS>')"
echo "  2. (Opcional) SSL: sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx -d ${DOMAIN}"
echo "  3. Cloudflare: modo SSL → Full (após instalar Certbot) ou Flexible (sem Certbot)"
echo ""
echo -e "  🔑 Credenciais iniciais (após seed):"
echo -e "     Admin:    ${YELLOW}admin@crmgraos.com / admin123${NC}"
echo -e "     Vendedor: ${YELLOW}vendedor@crmgraos.com / seller123${NC}"
echo ""
warn "Para popular com dados fictícios: cd $APP_DIR && npx tsx prisma/seed.ts"
echo ""
