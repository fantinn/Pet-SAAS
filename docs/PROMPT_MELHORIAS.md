# Prompt de melhorias — Pet-SAAS

> Cole tudo abaixo da linha em uma sessão do Claude Code aberta na raiz do repositório.
> Gerado após leitura completa do código (front, migrations, Edge Functions, CI, testes e docs) e execução real de `lint`, `test`, `audit` e `build`.

---

## PAPEL

Você é um engenheiro sênior full-stack (React 18 + Vite 7 + Tailwind 4 + Supabase/PostgreSQL + Deno Edge Functions) responsável por levar o **Pet-SAAS** de "piloto endurecido" a "produto vendável para petshops reais". Responda e comente código em **português do Brasil**.

## CONTEXTO DO SISTEMA

SaaS multi-tenant para petshop: clientes/pets/vacinas, agenda com reserva de slots, vendas com baixa de estoque, estoque com movimentos, planos/mensalidades dos clientes, financeiro, relatórios, equipe (proprietário / administrador / atendente) e atendimento por WhatsApp com IA (Twilio → Edge Function `whatsapp-webhook` → fila `whatsapp_fila` → `whatsapp-worker` → API Anthropic com ferramentas).

Arquitetura atual:

- Front: `src/App.jsx` (roteamento por hash + todo o estado de formulário de todas as abas), `src/context/AppProvider.jsx` (um único estado global + `fetchAll`), `AuthProvider`, `WorkspaceProvider`, componentes em `src/components/features/*`.
- Banco: `supabase/migrations/*` (RLS por `owner_id = current_owner()`, RPCs `security definer` para venda, estorno, estoque, mensalidades, convites, fila WhatsApp), trigger de agenda + tabela `agenda_slots` (uma linha por minuto).
- Testes: `tests/domain.test.js`, `tests/database.test.js` (PGlite local, Postgres 17 no CI com teste de concorrência), `tests/e2e/pilot.spec.js` (4 testes com Supabase simulado).

## ESTADO VERIFICADO (não refaça, apenas preserve)

`npm run lint` limpo · `npm test` 17/17 · `npm audit` 0 vulnerabilidades · `npm run build` ok (um único bundle JS de 476 kB / 135 kB gzip). A base de segurança de banco (RLS, vínculos compostos `(owner_id,id)`, idempotência de venda/estoque, auditoria, revogação de grants) é boa: **não enfraqueça nada disso**.

## REGRAS DE EXECUÇÃO

1. Trabalhe por **fases** (abaixo). Ao fim de cada item: rode `npm run check` (lint + testes + build) e, se tocar UI, `npm run test:e2e`. Só avance com tudo verde.
2. **Um commit por item**, mensagem em português no imperativo (`Corrige …`, `Adiciona …`). Não faça push, não faça deploy, não aplique migrations em nenhum Supabase remoto, não envie mensagens reais de WhatsApp.
3. Toda mudança de banco = **nova migration** em `supabase/migrations/` (nunca edite as existentes) + teste correspondente em `tests/database.test.js`. Use nomes `YYYYMMDDHHMMSS_descricao.sql`.
4. Toda correção de bug começa por um **teste que falha** e reproduz o problema.
5. Não introduza dependência nova sem justificar em uma linha; prefira as já presentes. Dependências sugeridas abaixo são as únicas pré-aprovadas.
6. Não invente regra de negócio. Onde o item disser **[DECISÃO]**, pare, apresente 2–3 opções com prós/contras e a sua recomendação, e aguarde resposta antes de implementar.
7. Mantenha o idioma da UI (pt-BR), o fuso `America/Sao_Paulo` e as convenções financeiras documentadas no README, salvo item que mande alterá-las.
8. Ao terminar cada fase, entregue um resumo curto: o que mudou, o que não foi possível validar sem ambiente real, riscos remanescentes.

---

## FASE 1 — Bugs e inconsistências reais (fazer primeiro)

**1.1 Estornos e despesas canceladas são invisíveis e o teste mente.**
`AppProvider.jsx:88` descarta toda linha com `cancelada_em`, e `mapVenda`/`mapDespesa` nem mapeiam o campo. Resultado: a vitrine de vendas não mostra estornos (o README promete "preserva o registro"), e o teste "desconsidera estornos" em `domain.test.js` passa `canceladaEm` num estado que **nunca existe em produção**.
→ Mapear `canceladaEm`, buscar canceladas, mostrar "Estornada" (riscada, com data e quem estornou via `auditoria`) na lista de vendas/despesas, e manter os totais corretos (o filtro passa a viver em `resumoDoMes`, que já o faz). Ajustar o teste para usar o formato real do estado.

**1.2 Ações com o mesmo nome bloqueiam-se mutuamente.**
`runActions` (`services/data.js`) usa `pending` por **nome da ação**: dois cliques rápidos em "concluir" de agendamentos diferentes, ou `+`/`−` de produtos diferentes, fazem o segundo ser descartado em silêncio (`return false`, sem mensagem).
→ Travar por `nome + id` (ou por chave que a ação informe), e quando descartar de fato um duplicado, não tratar como falha.

**1.3 O texto de cancelar assinatura contradiz a regra.**
`Planos.jsx:23` diz "a cobrança em aberto é removida"; README e código mantêm a dívida já gerada (`mensalidadesEmAberto` usa assinaturas canceladas).
→ Corrigir o texto e mostrar, na lista de assinaturas canceladas, as dívidas ainda abertas.

**1.4 A agenda oferece horários que o banco rejeita.**
`utils/availability.js` não filtra horários passados do dia atual; o trigger responde "Horário já passou". O campo de data também aceita datas passadas.
→ Filtrar passado no cálculo (usando `hojePetshop()` + hora de São Paulo, não o relógio do navegador) e `min` no `<input type="date">`.

**1.5 Três fusos/relógios diferentes.**
`hooks/useCalendar.jsx` usa a data local do navegador; o resto usa `hojePetshop()`; SQL e worker repetem `'America/Sao_Paulo'` em vários pontos. Um usuário fora de SP vê "hoje" errado.
→ Centralizar em um único módulo de tempo (`utils/tempo.js`) e uma constante de timezone; `useCalendar` passa a usá-lo.

**1.6 Concluir atendimento futuro.**
`cicloStatusAgendamento` deixa marcar como "Concluído" um agendamento de data futura, jogando receita para um mês que ainda não existe.
→ Bloquear no trigger (`data+hora <= agora`) e na UI, com mensagem clara. **[DECISÃO]** se atendimento concluído deve ter forma de pagamento (hoje `totalPorPagamento` só considera vendas, então o caixa por forma de pagamento está incompleto).

**1.7 Falha dura aos 50 mil registros.**
`readAll` lança erro aos 50.000 linhas/tabela e o app inteiro deixa de carregar. Ver Fase 3 para a correção estrutural; **como paliativo imediato**, degradar com aviso em vez de derrubar a tela.

**1.8 Job do WhatsApp pode travar uma conversa para sempre.**
`claim_whatsapp` só pega `pendente` e bloqueia o remetente se houver outro em `processando`/`enviando`/`incerto`. Se o worker cair no meio, o cliente nunca mais é atendido até alguém mexer no banco.
→ Recuperação por timeout (`processando` há > N min volta para `pendente` com contador de tentativas; `enviando` antigo vira `incerto`), tela/consulta administrativa dos jobs parados e teste no `database.test.js`.

**1.9 Lixo e ruído no repositório.**
Remover `src/data/seedData.jsx` (código morto de demo), a flag `estoqueDisponivel` (sempre `true`) e a mensagem de "rode a migration no SQL Editor" em `Estoque.jsx`, `isDisabled` morto no `Sidebar`, `scripts/proxy.js` (não referenciado) se confirmado sem uso, `audit-temp.json` (desatualizado, mostra 11 vulnerabilidades que não existem mais), `<DollarSign title=…>` (prop inválida no lucide). `public/favicon.ico` está vazio (0 bytes) e não é referenciado em `index.html`: criar favicon/manifest reais.

---

## FASE 2 — Segurança, privacidade e operação

**2.1 `.env.production` com projeto Supabase real commitável.** Não está no `.gitignore`; um build sem variáveis cai silenciosamente no projeto "de produção". → Remover o arquivo, exigir variáveis explícitas em qualquer build (falhar se ausentes) e documentar staging × produção.

**2.2 Equipe incompleta (`Equipe.jsx`).** Lista UUID cru em vez de e-mail/nome; sem lista de convites pendentes, sem revogar convite, sem alterar papel, sem "sair do petshop"/transferir propriedade; `convidar` não valida formato nem duplicidade. → Nova migration: expor e-mail do membro (via função `security definer` restrita à gestão), `listar_convites`, `revogar_convite`, `alterar_papel`, `sair_do_petshop`, `transferir_propriedade`; UI correspondente; testes de permissão.

**2.3 Cadastro aberto sem freio.** Qualquer pessoa cria um petshop (`criar_petshop`). → **[DECISÃO]** convite de entrada / lista de espera / CAPTCHA / limite por IP+domínio, e plano de trial com expiração (`acesso`) para o SaaS.

**2.4 LGPD de verdade.** Hoje só há documentação. → RPCs `exportar_dados_cliente(id)` e `anonimizar_cliente(id)` (preservando histórico financeiro), campo de consentimento/origem do contato, job de expurgo de `whatsapp_conversas` e do corpo de `whatsapp_fila` (com `pg_cron`/Supabase Cron), páginas de Termos e Privacidade. **[DECISÃO]** prazos de retenção.

**2.5 Auditoria só cobre 4 tabelas e não tem tela.** → Ampliar para clientes, pets, serviços, planos, estoque e membros (sem copiar PII para `auditoria`, como já é a regra), adicionar índice `(owner_id, created_at)` e uma tela "Histórico de alterações" para a gestão.

**2.6 Headers de segurança.** GitHub Pages não permite CSP/HSTS. → **[DECISÃO]** migrar o front para Cloudflare Pages/Netlify/Vercel com CSP restritiva (conectar só ao domínio Supabase), `Referrer-Policy`, `Permissions-Policy`.

**2.7 Observabilidade.** Sem Sentry ou equivalente, sem métricas do worker. → Integrar captura de erros no front (ErrorBoundary hoje só mostra "recarregue"), logs estruturados nas funções e uma consulta/alerta para fila antiga, falhas e custo da IA.

**2.8 Teste de privilégios com defaults do Supabase.** O harness PGlite não replica os `default privileges` do Supabase (que concedem EXECUTE/ALL a `anon`/`authenticated`). → Adicionar ao teste os `alter default privileges … grant all` equivalentes **antes** das migrations e reprovar se qualquer função/tabela ficar acessível a `anon`; rodar `supabase db lint` no CI.

---

## FASE 3 — Arquitetura e desempenho do front

**3.1 Parar de recarregar o banco inteiro a cada ação.** `fetchAll` refaz 12 consultas paginadas após *cada* mutação e carrega todo o histórico em memória. → Adotar **TanStack Query** (pré-aprovado): uma query por recurso, invalidação seletiva, atualização otimista para ações simples (concluir, ajustar estoque, pagar mensalidade), e `staleTime` adequado.

**3.2 Dados escopados por período + agregações no banco.** Agendamentos, vendas, despesas e mensalidades devem ser buscados por janela (mês visível / intervalo do relatório). Dashboard, financeiro e relatórios passam a usar RPCs (`resumo_financeiro(mes)`, `dashboard()`, `relatorio(inicio,fim)`) com índices adequados — o cálculo único no banco elimina a divergência de arredondamento hoje existente entre `financeiro.js` (centavos) e `relatorios.js` (`qtd*valor` em float). Clientes e pets com busca e paginação **no servidor** (o `<select>` com todos os pets em `Agendamentos` não escala: trocar por combobox com busca).

**3.3 Desmontar `App.jsx`.** Ele concentra ~30 props e o estado de formulário de todas as abas. → Cada feature vira um módulo com seu próprio hook/estado (`useClientes`, `useAgenda`, …), `react-router` (HashRouter) com rotas e `React.lazy` por aba (hoje é um bundle único), `<RequireManager>` para rotas de gestão. Remover o prop-drilling de `derived` (é recalculado inteiro a cada mudança, com laços O(n·m) como `clientesParaReativar`, e o `value` do contexto muda a cada render).

**3.4 Tempo real para equipe.** Sem Realtime, dois atendentes veem agendas diferentes e só descobrem o conflito ao salvar. → Assinar `agendamentos` (e `produtos`) via Supabase Realtime e invalidar as queries.

**3.5 Higiene de código.** Renomear arquivos `.jsx` que não têm JSX (`constants`, `format`, `supabaseClient`, `useCalendar`) para `.js`; adicionar `eslint-plugin-react-hooks`; Prettier; `.nvmrc`; atualizar `lucide-react` (^0.263 é de 2023); `tailwind.config.js` em estilo v3 com `@config` no Tailwind 4 → migrar para `@theme` no CSS; considerar migrar front e funções para **TypeScript** (as funções já são `.ts`), começando por tipos gerados do banco (`supabase gen types`).

**3.6 Fonte única da verdade para disponibilidade de horário.** Hoje há três implementações (`availability.js`, `consultar_horarios_disponiveis` no worker, trigger SQL). → RPC `horarios_disponiveis(data, servico_id)` usada pelo front **e** pelo worker; o trigger continua sendo a autoridade final.

---

## FASE 4 — Modelo de dados

**4.1 `agendamentos.servico` é texto.** Renomear um serviço quebra relatórios, fallback de duração e a busca do worker. → Adicionar `servico_id` (FK composta), backfill por nome, manter `servico` como snapshot histórico.

**4.2 Índices ausentes e RLS lento.** As FKs compostas `(owner_id, cliente_id)` etc. não têm índice iniciado por essas colunas (apagar/validar fica lento); faltam índices em `mensalidades(owner_id, mes_ref)`, `vacinas(pet_id, proxima_dose)`, `agendamentos(owner_id, pet_id)`. Nas policies, usar `(select public.current_owner())` e `(select public.is_manager())` para virar *initPlan* em vez de executar por linha.

**4.3 Tipos e colunas.** `mes_ref` como `text` → `date` (primeiro dia do mês) ou domínio com check; `numeric(10,2)` × `(12,2)` inconsistente; `created_at/updated_at` em todas as tabelas de negócio; `produtos` com `on delete cascade` para `auth.users` destoa do resto (restrict) e sem `drop policy` antes de criar.

**4.4 Reconciliação do banco remoto.** É o bloqueador nº 1 do README e continua aberto. → Gerar um script de **diagnóstico somente-leitura** (colunas, constraints, policies, grants, triggers, contagens por `owner_id`) que o responsável rode contra o banco remoto e cole o resultado; só então escrever a migration de reconciliação.

---

## FASE 5 — Produto (o que um petshop real vai pedir)

Priorize nesta ordem; cada item só começa após confirmação **[DECISÃO]** de escopo.

1. **Agenda multi-profissional/capacidade.** Hoje há *uma* agenda por petshop (`agenda_slots` PK `(owner_id,data,minuto)`), então só um atendimento por vez. Adicionar profissionais/baias, atribuição, bloqueios (folga, feriado, almoço) e visão de dia/semana em grade.
2. **Venda com carrinho.** Uma venda = um item, sem desconto nem troco. → Itens múltiplos, desconto, forma de pagamento mista, recibo imprimível/compartilhável.
3. **Importação de clientes por CSV/planilha** (barreira real de adoção) e **exportação completa** dos dados.
4. **Lembretes automáticos** de agendamento, vacina e retorno via WhatsApp (templates aprovados; janela de 24 h; opt-out), reaproveitando a fila existente. Hoje o sistema só gera links `wa.me` manuais.
5. **Planos com franquia** (ex.: "2 banhos/mês" consumidos pelos agendamentos), dia de vencimento, multa/juros e cobrança Pix (Asaas/Mercado Pago) — hoje é um botão "Recebi" manual sem forma de pagamento.
6. **Estoque**: histórico de movimentos na UI (a tabela já existe), entrada de compra com fornecedor/custo, ajuste com quantidade e motivo (hoje só ±1), alerta de reposição por e-mail/WhatsApp.
7. **Cobrança do próprio SaaS** (`cobranca_externa` está travada em `false` por check) — checkout, planos, trial e limites.
8. **Clientes/pets**: validação e normalização de telefone (E.164) compartilhada com o worker, e-mail, endereço, data de nascimento/peso/foto do pet, histórico unificado por cliente, detecção de duplicados.
9. **Onboarding guiado** (horário → serviços → primeiro cliente), toasts de sucesso, esqueleto de carregamento, PWA instalável, impressão da agenda do dia.

---

## FASE 6 — Acessibilidade e qualidade de UI

- A maioria dos campos usa só `placeholder` (Clientes, Vendas, Estoque, Settings, Planos, Agendamentos) — adicionar `<label>` associado; botões só-ícone têm apenas `title` — adicionar `aria-label`; calendário sem nome acessível/`aria-pressed`; trocar `window.confirm` por diálogo acessível (foco preso, Esc, retorno de foco).
- Extrair componentes de formulário (`Field`, `Select`, `Combobox`, `ConfirmDialog`, `Toast`) e usar em todas as telas.
- Adicionar `@axe-core/playwright` aos testes e-2-e e falhar em violações sérias.

## FASE 7 — Testes e CI

- Hoje: 6 testes de domínio, 11 de banco, 4 e2e com API simulada; **nenhum teste de componente, do worker, nem das ferramentas de IA**. → Vitest + jsdom + Testing Library para formulários críticos; testes de unidade do worker (injetar cliente de banco e `fetch` falsos) cobrindo duplicidade de `message_sid`, falha de entrega → `incerto`, limite de ferramentas e **mensagens adversariais** (prompt injection no `ProfileName` e no corpo); e2e para os fluxos de agenda, venda com estoque insuficiente e estorno.
- CI: cobertura com limiar mínimo, Dependabot/Renovate, `supabase db lint` + `supabase db reset` em Postgres descartável, build com `VITE_*` de staging, preview por PR, `npm run check` também no workflow de deploy.

## FASE 8 — WhatsApp/IA (antes de habilitar `WHATSAPP_ENABLED`)

- Scheduler real (Supabase Cron + `pg_net`, ou chamada em lote com N jobs por invocação) — hoje cada POST processa **um** job e não há scheduler.
- Callbacks de status do Twilio (entregue/lido/falha) e reenvio controlado de `falha` transitória (modelo indisponível hoje deixa o cliente sem resposta e sem aviso à equipe).
- **Transbordo para humano**: notificar a equipe (e marcar a conversa) quando a IA falhar, o cliente pedir atendente ou houver ambiguidade.
- Limites de uso do agendamento automático: janela máxima de data, nº de agendamentos futuros por cliente, confirmação explícita registrada.
- Custo: *prompt caching* do `system` + ferramentas, teto de gasto por petshop/dia, métrica de tokens por job.
- Tipar o worker (remover os `any`), compartilhar validação de telefone/horário com o front.

---

## ENTREGA ESPERADA

1. Um arquivo `docs/PLANO_MELHORIAS.md` com a ordem final, estimativa (P/M/G) e dependências entre itens — **antes** de codar.
2. Fase 1 inteira implementada, testada e commitada.
3. Para as fases 2–8: um parágrafo por item com a abordagem escolhida e as perguntas **[DECISÃO]** pendentes, para eu priorizar.
4. Ao final de cada fase: saída de `npm run check`, `npm run test:e2e` e lista do que **só** pode ser validado em staging real (Supabase hospedado, SMTP, Twilio, restauração de backup).

**Definição de pronto de cada item:** teste que falha antes e passa depois, `npm run check` verde, nenhum segredo no front, nenhuma migration existente editada, README/OPERATIONS atualizados quando a regra de negócio mudar.
