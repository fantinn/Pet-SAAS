# Operação e preparação de staging

## Reconciliar uma base existente

1. Obter um dump de schema e um backup com dados usando ferramentas administrativas autorizadas. Nunca armazenar dumps com dados pessoais no Git.
2. Restaurar o backup em um projeto separado de staging. Registrar contagens e totais por owner_id antes de modificar.
3. Comparar colunas, tipos, defaults, foreign keys, constraints, policies, grants e triggers existentes com as migrations. O baseline usa `CREATE TABLE IF NOT EXISTS`: isso **não corrige** constraints de tabelas já existentes.
4. Escrever uma migration de reconciliação específica para as diferenças reais. Remover cascatas de exclusão incompatíveis com a preservação do histórico, adicionar vínculos compostos `(owner_id,id)`, validar constraints monetárias e índices únicos. Não assumir que aplicar o baseline resolve esses pontos.
5. Antes da migration de agenda, localizar e resolver sobreposições existentes com o responsável do petshop. A criação dos slots falha deliberadamente se houver conflitos, sem apagar atendimentos. Verificar nomes de serviços duplicados e registros órfãos.
6. Executar migrations em transações pelo CLI, testar com dois petshops e os três perfis. As políticas legadas das tabelas operacionais são substituídas. Auditar quaisquer funções privilegiadas legadas e grants que não constam deste repositório.
7. Comparar contagens, vínculo entre registros, saldo de estoque, vendas e mensalidades. Os saldos anteriores de produtos não têm movimentos históricos reconstruídos; registrar um saldo de abertura reconciliado se necessário.
8. Apenas após validar a cópia e testar restauração, planejar janela de migração e deploy do frontend correspondente.

Não houve acesso ao banco remoto durante esta implementação. Nenhuma migration foi aplicada remotamente.

## Backup e rollback

- Definir responsável, frequência, retenção, RPO e RTO antes do piloto. Ativar backup/PITR conforme o plano contratado e verificar as opções atuais na documentação do provedor.
- Fazer restauração real em staging e conferir autenticação, registros, permissões, totais e estoque; apenas ter um arquivo de backup não valida recuperação.
- Antes da mudança, registrar versão do frontend, schema e instante do backup. Guardar artefato anterior do build.
- Se houver falha, suspender novas escritas, investigar em staging e preferir correção incremental. Reverter somente o frontend pode ser incompatível com as novas RPCs e permissões.
- Restaurar backup exige considerar as escritas posteriores e reconciliá-las. Não executar rollback destrutivo automático.

## Auth e hospedagem

- Configurar SMTP, confirmação de e-mail, política de senha, rate limits e URLs permitidas no Supabase. Testar cadastro, convite, reset, expiração e logout com contas reais em staging.
- GitHub Pages hospeda apenas o frontend; segredos e lógica privilegiada ficam nas Edge Functions/PostgreSQL.
- As chaves `VITE_*` fazem parte do bundle público. Nunca usar service_role, tokens Twilio ou chave Anthropic nesse prefixo.
- A configuração pública preexistente em `.env.production` foi preservada. O workflow de deploy exige variáveis explícitas do repositório. Para isolar ambientes, configure os valores do destino e revise o projeto Supabase antes de gerar o build.
- Para headers de segurança configuráveis (CSP, HSTS etc.), escolher hospedagem/proxy que permita configurá-los e testar fontes, assets, Supabase e links de autenticação. GitHub Pages não fornece controle completo desses headers.

## WhatsApp: ingresso, fila e worker

A integração permanece desligada até `WHATSAPP_ENABLED=true`. Segredos esperados estão em `supabase/functions/.env.example`. Nunca copiar segredos para arquivos versionados.

1. Provisionar `whatsapp_numeros` administrativamente com número E.164 no formato `whatsapp:+55...`, owner_id e Account SID da conta Twilio configurada. Ativar somente o número verificado.
2. Configurar `TWILIO_WEBHOOK_URL` com a URL pública exata usada no Twilio, inclusive query string quando existir. A validação não usa headers de proxy fornecidos pelo remetente.
3. Validar credenciais/modelo Anthropic pela API Models. `ANTHROPIC_MODEL` é obrigatório, sem fallback silencioso para um modelo inventado.
4. Publicar as duas funções no ambiente de staging. O JWT Supabase está desativado nesses endpoints porque o ingresso exige assinatura Twilio e o worker exige Bearer secret próprio. Não remover essas verificações.
5. Configurar um scheduler confiável para POST em `whatsapp-worker` com `Authorization: Bearer <WHATSAPP_WORKER_SECRET>`. O segredo precisa ser longo, aleatório, armazenado no vault do scheduler e diferente de outros tokens. Cada chamada processa um job; dimensionar a frequência para a fila e o limite de execução do host. Não há scheduler provisionado por este repositório.
6. Testar mensagem assinada, assinatura inválida, repetição do mesmo MessageSid, número não provisionado, limites, indisponibilidade do modelo, conflito na agenda e falha de entrega. Não usar números reais de clientes nesses testes.
7. Só então habilitar a integração no ambiente desejado.

O webhook grava a mensagem antes de responder TwiML vazio. O worker envia a resposta pela API de mensagens Twilio. Consultas e ferramentas sempre recebem owner/cliente do contexto verificado. A IA não escolhe o petshop. O banco reserva horários e guarda duração histórica. Cada mensagem pode criar no máximo um pet e um agendamento.

Limites iniciais: 200 mensagens/petshop em 24 horas, 10 mensagens/remetente em 10 minutos, corpo de 4.000 caracteres, requisição de 16 KiB, cinco rodadas e até cinco chamadas de ferramenta por rodada. Ajustar após medir custos e demanda.

Monitorar `whatsapp_fila` por estado e idade. `processando` ou `enviando` antigos podem indicar interrupção do worker. `incerto` bloqueia a conversa para impedir repetição de entrega ambígua. Antes de reenviar qualquer job, conferir Twilio, registros criados e histórico da conversa. Estados de falha não são reenviados automaticamente. Uma entrega aceita pelo Twilio não comprova leitura/entrega no aparelho; verificar seu status no provedor. Callbacks de entrega não foram implementados.

Logs das funções contêm evento e MessageSid, sem tokens, corpo da conversa ou telefone. Definir alertas para falhas, fila antiga e custo antes de habilitar a integração. A ferramenta de IA deve ser avaliada em staging com mensagens adversariais e confirmações ambíguas antes de liberar agendamento automático.

Referências consultadas:
- [Segurança de webhooks Twilio](https://www.twilio.com/docs/usage/webhooks/webhooks-security)
- [Timeouts de webhooks](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides)
- [Modelos da API Claude](https://platform.claude.com/docs/en/api/models)
- [Versões suportadas do Vite](https://vite.dev/releases)

## Dados pessoais e retenção

- Definir com o responsável pelo negócio as bases e os prazos de retenção, avisos de privacidade e canal de atendimento a solicitações. Este código não constitui certificação de conformidade jurídica.
- Exportar dados pessoais somente após autenticar o solicitante e verificar a relação com o petshop. CSV de relatórios não é uma exportação completa de dados pessoais.
- Exclusão com dependências é bloqueada para preservar integridade. Para solicitação legítima de exclusão, preparar anonimização controlada dos campos pessoais, avaliar retenções obrigatórias e testar em staging; não apagar cascatas nem auditoria financeira sem política definida.
- Conversas e corpos na fila precisam de rotina de expurgo aprovada. Manter uma chave mínima de deduplicação durante a janela de retry do provedor; não remover jobs ativos/incertos antes de reconciliá-los. O scheduler de retenção não foi provisionado.
- Restringir acesso administrativo e à service_role; auditar periodicamente membros, convites, funções privilegiadas e políticas RLS.

## Limites conhecidos do piloto

- Uma conta em um petshop, uma agenda simultânea por petshop, horários de início a cada 30 minutos e fuso fixo America/Sao_Paulo.
- As consultas são paginadas em blocos de 500, evitando o limite silencioso do PostgREST. O app ainda consolida os dados em memória, com limite explícito de 50 mil linhas/tabela. Antes de escalar, mover agregações e filtros de períodos para RPCs e paginar também a experiência de consulta.
- Receita de serviços pressupõe recebimento ao concluir. Parcelamento, recebimento parcial, pacotes que incluem serviços, emissão fiscal e reconciliação bancária não estão implementados. Não vender o piloto para esses fluxos sem defini-los.
- Autorização no banco protege tentativas diretas; alguns controles de edição ainda aparecem para atendentes e recebem negação ao serem usados. A navegação de gestão é ocultada.
- Os testes de navegador simulam Supabase. SMTP, integração hospedada, operação multiconexão real, backup/restauração e CI remoto requerem execução no ambiente correspondente.
