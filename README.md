# CRM Grãos — MVP

CRM web completo para corretores de grãos (soja, milho, etc.) com gestão de clientes, leads, negociações, histórico de preços e relatórios mensais.

## Stack Técnica

- **Frontend:** Next.js 14 (App Router) + React + TypeScript
- **UI:** TailwindCSS + Lucide Icons + Recharts (gráficos)
- **Backend:** API Routes do Next.js
- **Banco:** SQLite + Prisma ORM
- **Auth:** JWT via `jose` + bcrypt (cookies httpOnly)
- **Validação:** Zod

---

## Pré-requisitos

- **Node.js** 18+ instalado
- **npm** 9+

---

## Como rodar

### 1. Clone/acesse o projeto

```bash
cd ~/crm-graos
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados

```bash
# Cria o banco SQLite com o schema
npm run db:push

# Popula com dados fictícios (10 clientes, 20 leads, 30 deals, 60 preços)
npm run db:seed
```

### 4. Inicie o servidor

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## Credenciais padrão (após seed)

| Perfil      | Email                      | Senha      |
|-------------|----------------------------|------------|
| Admin       | admin@crmgraos.com         | admin123   |
| Vendedor    | vendedor@crmgraos.com      | seller123  |

---

## Comandos úteis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Produção (após build)
npm run db:push      # Aplicar schema Prisma
npm run db:seed      # Popular com dados fictícios
npm run db:reset     # Resetar banco e re-popular
npm run db:studio    # Abrir Prisma Studio (GUI do banco)
```

---

## Estrutura do projeto

```
crm-graos/
├── prisma/
│   ├── schema.prisma     # Schema do banco (Prisma)
│   └── seed.ts           # Dados fictícios para seed
├── src/
│   ├── app/
│   │   ├── (auth)/login/ # Página de login
│   │   ├── (dashboard)/  # Layout com sidebar
│   │   │   ├── page.tsx                 # Dashboard com KPIs e gráficos
│   │   │   ├── clientes/                # CRUD clientes
│   │   │   ├── leads/                   # Gestão de leads
│   │   │   ├── negociacoes/             # Kanban + tabela de deals
│   │   │   ├── precos/                  # Histórico de preços + gráficos
│   │   │   ├── relatorios/              # Relatório mensal + export CSV
│   │   │   └── configuracoes/           # CRUD usuários (admin)
│   │   └── api/
│   │       ├── auth/{login,logout,me}/  # Autenticação
│   │       ├── clients/                 # CRUD clientes
│   │       ├── leads/[id]/convert/      # Converter lead em cliente
│   │       ├── deals/                   # CRUD negociações
│   │       ├── prices/                  # CRUD histórico de preços
│   │       ├── dashboard/               # Dados do dashboard
│   │       ├── reports/monthly/         # Relatório mensal + CSV
│   │       └── users/                   # CRUD usuários (admin)
│   ├── components/
│   │   ├── ui/           # Sidebar, Badge, Modal, Card
│   │   ├── dashboard/    # KpiCard, RevenueChart, DealsByStatus, TopClients
│   │   ├── deals/        # DealForm
│   │   ├── clients/      # ClientForm
│   │   └── leads/        # LeadForm
│   ├── lib/
│   │   ├── prisma.ts     # Cliente Prisma singleton
│   │   ├── auth.ts       # JWT + bcrypt helpers
│   │   └── utils.ts      # Formatadores, labels, utilitários
│   ├── middleware.ts     # Proteção de rotas via JWT
│   └── types/index.ts    # Tipos TypeScript
├── .env                  # Variáveis de ambiente
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Funcionalidades

### Dashboard
- KPIs: dinheiro movimentado, comissão, volume, ops. fechadas, leads novos, taxa de conversão
- Seletor de período (mês/ano)
- Gráficos: receita diária (área), deals por status (barras), top 5 clientes (barras horizontais)
- Tabela das últimas 10 negociações

### Clientes
- Lista com busca por nome/cidade e filtros por tipo/status
- Cards com detalhes: tipo, localização, telefone, produtos
- Página de detalhe com negociações relacionadas
- CRUD completo

### Leads
- Lista com filtros por estágio e origem
- Cards com indicação visual por estágio (bordas coloridas)
- **Ação "Converter em Cliente"** — cria automaticamente um cliente a partir do lead
- CRUD completo

### Negociações (Deals)
- **Kanban** por status com cards clicáveis e botões de mover entre colunas
- **Tabela** alternativa com filtros
- Cálculo automático de totalValue e commissionValue no backend
- Ao fechar: `closedAt` setado automaticamente
- CRUD completo

### Histórico de Preços
- Gráfico de linha por produto/região (últimos 30 dias)
- Tabela de registros com exclusão
- CRUD de cotações por produto, região e data

### Relatórios Mensais
- Seletor de mês/ano
- Resumo: dinheiro movimentado, comissão, volume por unidade, # operações
- Ranking de top clientes do mês
- Tabela completa de operações fechadas com totalizadores
- **Exportação CSV** com todos os dados

### Configurações (Admin)
- CRUD de usuários (admin cria/edita/remove vendedores)
- Informações do sistema

---

## Modelo de dados

| Entidade       | Descrição                                         |
|----------------|---------------------------------------------------|
| **User**       | Admin ou Vendedor com auth JWT                    |
| **Client**     | Produtor ou Comprador com dados completos         |
| **Lead**       | Contato qualificado, pode virar Client            |
| **Deal**       | Negociação com pipeline (new→closed/lost)         |
| **PriceHistory** | Cotação por produto/região/data                |
| **ActivityLog** | Log de ações no sistema                         |

---

## Variáveis de ambiente (.env)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua-chave-secreta-aqui"
```

> **Importante:** Em produção, altere o `JWT_SECRET` para uma chave forte e aleatória.

---

## Roles e permissões

| Ação                         | Seller | Admin |
|------------------------------|:------:|:-----:|
| Visualizar dashboard         | ✅     | ✅    |
| CRUD clientes/leads/deals    | ✅     | ✅    |
| Excluir cliente com deals    | ❌     | ✅    |
| Gerenciar usuários           | ❌     | ✅    |
| Exportar relatórios          | ✅     | ✅    |
