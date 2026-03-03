/**
 * PM2 Ecosystem Config — CRM Grãos
 * Uso no VPS:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 save
 *   pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'crm-graos',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/crm-graos',   // caminho absoluto no VPS
      instances: 1,                 // SQLite é single-writer; manter 1 instância
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',

      // Variáveis de ambiente de produção (sobrescritas pelo .env do cwd)
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Logs
      out_file: '/var/log/pm2/crm-graos.out.log',
      error_file: '/var/log/pm2/crm-graos.error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
}
