# Petshop SaaS — piloto

Gestão de clientes e pets, agenda, vendas, estoque, mensalidades, financeiro e relatórios. React 18, Vite 7, Tailwind 4 e Supabase/PostgreSQL.

## Rodar localmente

Requer Node.js 24 LTS (mínimo 22.12). No PowerShell:

```powershell
npm ci
Copy-Item .env.example .env.local
# Preencha somente URL e chave pública de um Supabase de desenvolvimento.
npm run dev
```

Crie o banco de desenvolvimento usando as migrations em ordem de nome. A configuração `supabase/config.toml` permite `supabase start` / `supabase db reset` com CLI e Docker instalados. `db reset` é exclusivo para banco descartável local.

**Instalação existente:** o baseline foi inferido do código, não de um dump remoto. Não executar migrations em produção antes da reconciliação descrita em [operação](docs/OPERATIONS.md). Atualizar apenas o frontend sem o novo banco quebra a compatibilidade.

Ao entrar com uma nova conta, crie seu petshop ou aceite um convite. Configure os serviços e horários antes de agendar. O piloto usa uma agenda por petshop e o fuso America/Sao_Paulo.

## Permissões

| Perfil | Acesso |
| --- | --- |
| Atendente | Clientes, pets, vacinas, agenda, registro de vendas e consulta de catálogo/estoque |
| Administrador | Operação, estoque, financeiro, planos, configurações e convite de atendentes |
| Proprietário | Administração, convite de administradores e remoção de membros |

A autorização é aplicada em RLS e RPCs. `owner_id` representa o petshop original e é preservado para migração; membros não precisam copiar dados. Uma conta pertence a um petshop. Convites são vinculados ao e-mail confirmado e expiram em sete dias. A aplicação gera o link; o operador o compartilha manualmente.

A assinatura do **software** aparece em uma tela separada, com status de acesso e limite de membros aplicados no banco. A cobrança externa permanece desabilitada. Os **planos do petshop** são assinaturas vendidas aos clientes e geram mensalidades próprias.

## Regras financeiras do piloto

- Venda + baixa de estoque são atômicas. Estoque insuficiente bloqueia toda a operação. A chave de requisição evita repetir a mesma venda.
- Estornar uma venda preserva o registro e devolve o produto uma única vez. Somente a gestão pode estornar.
- Ajustes de estoque têm movimentos registrados e não podem gerar saldo negativo.
- Concluir um atendimento significa confirmar sua receita na data do atendimento. Não cadastrar o mesmo atendimento como venda avulsa. O sistema não possui contas a receber de serviços parcelados; esse fluxo precisa ser definido antes de atender esse cenário.
- Mensalidades entram no caixa pela data de pagamento; a competência identifica a cobrança. Cancelar um plano não elimina dívidas já geradas. A geração repetida do mês não duplica cobranças.
- Valores usam `numeric` no banco e centavos nas somas do resumo financeiro. Relatórios usam o mesmo resumo mensal.
- Registros referenciados pelo histórico não podem ser apagados. Alterações financeiras relevantes possuem trilha de auditoria, consultável pela gestão via banco/API; ainda não há uma tela dedicada de auditoria.

## Verificações

```powershell
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit --audit-level=high
npx deno check --config supabase/functions/deno.json supabase/functions/whatsapp-webhook/index.ts supabase/functions/whatsapp-worker/index.ts
```

Os testes locais executam as migrations em PostgreSQL embarcado (PGlite), com roles e `auth.uid()` de teste. O CI executa o mesmo contrato em PostgreSQL 17 e acrescenta duas conexões concorrentes disputando estoque e agenda. `TEST_DATABASE_URL` deve apontar **apenas para um banco vazio descartável**; a suíte cria schema e fixtures.

Os testes Playwright usam a aplicação real com respostas HTTP simuladas do Supabase. Eles não comprovam envio de e-mail, sessões reais, entrega de WhatsApp ou integração ponta a ponta com Supabase hospedado.

## Deploy

O workflow `Validate pilot` roda em pull requests e pushes na main. O deploy do GitHub Pages agora é manual e exige confirmação de migrations e restauração em staging. Configure as repository variables `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para o ambiente escolhido. Só use chave anon/publishable no frontend.

A base padrão de produção é `/Pet-SAAS/`; em domínio próprio, defina `VITE_BASE_PATH=/`. Navegação usa hash, compatível com GitHub Pages. Configure no Supabase as URLs de confirmação de cadastro e recuperação de senha, incluindo o caminho correto.

Consulte [operação e WhatsApp](docs/OPERATIONS.md) e [checklist do piloto](docs/READINESS.md) antes de publicar.
