# Petshop SaaS

Sistema de gestão para petshop: agenda, clientes e pets, vendas, estoque, planos recorrentes, financeiro e relatórios.
Front-end em React + Vite + Tailwind; dados e login no Supabase (cada petshop só enxerga os próprios dados via RLS).

## Funcionalidades

- **Dashboard** — agenda do dia, faturamento do mês, vacinas vencendo, clientes sem retorno (com mensagem pronta de WhatsApp) e produtos para repor.
- **Agendamentos** — calendário mensal, controle de status, remarcação, preço por porte do pet e horário de funcionamento.
- **Clientes e pets** — cadastro, busca, observações de cuidado, carteira de vacinas e link direto para WhatsApp.
- **Vendas** — serviços, produtos do estoque (com baixa automática) ou itens customizados; forma de pagamento.
- **Estoque** — produtos com custo/venda, estoque mínimo, ajuste rápido de quantidade e alertas de reposição.
- **Planos** — assinaturas recorrentes, geração de mensalidades, controle de pagamento e inadimplência.
- **Financeiro** — entradas (serviços, vendas, planos recebidos), despesas e saldo por mês.
- **Relatórios** — entradas x despesas por mês (3/6/12 meses), ticket médio, taxa de cancelamento, rankings de serviços, itens e clientes, dias mais movimentados e exportação em CSV (Excel).
- **Configurações** — serviços, planos, horários e dados de demonstração.

Ainda marcados como "Em breve" no menu: Assinatura, Usuários e Permissões.

## Estrutura

```
src/
├── components/
│   ├── common/            # Button, Input, StatusBadge, WhatsAppLink
│   ├── features/          # uma pasta por tela (agendamentos, clientes, estoque, relatorios...)
│   └── layout/Sidebar.jsx
├── context/
│   ├── AuthProvider.jsx   # sessão Supabase
│   └── AppProvider.jsx    # estado global, ações e dados derivados
├── utils/
│   ├── format.jsx         # datas, moeda, mensagens de WhatsApp
│   ├── relatorios.js      # cálculos dos relatórios
│   └── csv.js             # exportação para Excel
supabase/
├── functions/whatsapp-webhook/
└── migrations/            # SQL a aplicar no banco
```

## Como rodar

```bash
npm install
cp .env.local.example .env.local   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

Acesse http://localhost:5173.

### Banco de dados

O Estoque depende da tabela `produtos`. Rode `supabase/migrations/20260930_produtos_estoque.sql` no SQL Editor do
Supabase. Sem ela o restante do sistema funciona normalmente e a aba Estoque avisa o que falta.

## Comandos

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run preview` — preview do build

## Próximas melhorias

- [ ] Testes automatizados (utilitários de relatório e disponibilidade de horários)
- [ ] Assinatura do SaaS, múltiplos usuários e permissões
- [ ] Baixa de estoque ao concluir serviços que consomem produtos
