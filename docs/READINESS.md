# Checklist de prontidão — 20/10/2026

## Implementado localmente

- [x] Baseline das tabelas usadas pelo aplicativo e migrations subsequentes.
- [x] Petshop, membros, três perfis, onboarding, convites vinculados ao e-mail e limite de membros.
- [x] RLS, vínculos compostos entre registros e restrição das RPCs privilegiadas.
- [x] Venda/estoque atômicos, estorno idempotente, ajustes sem saldo negativo e movimentos.
- [x] Reserva de agenda protegida por chave única de minutos; duração histórica.
- [x] Histórico financeiro preservado, auditoria, mensalidades únicas e caixa por data de pagamento.
- [x] Recuperação/redefinição de senha, formulários com preservação de rascunho, bloqueio de cliques repetidos e tratamento de falhas.
- [x] Remoção do carregamento destrutivo de demonstração.
- [x] Consultas paginadas, proteção contra fórmulas em CSV e melhorias de foco/acessibilidade.
- [x] WhatsApp com assinatura, associação administrativa por número, fila, deduplicação, limites, validação de ferramentas e worker.
- [x] Cobrança externa do SaaS explicitamente desabilitada.
- [x] CI e deploy manual com verificações, documentação e exemplos de ambiente sem segredos.

## Evidência local

- ESLint sem erros.
- Suite de domínio/banco com migrations aplicadas em PGlite: isolamento, permissões, transações, estornos, agenda, mensalidades, fila, assinatura e CSV.
- Quatro testes de navegador passando com API simulada: recuperação em celular, rascunho preservado em falha, acesso de atendente e retry de venda com a mesma chave.
- Build de produção concluído; nenhum segredo de backend adicionado ao frontend.
- Deno: ambos os endpoints passam na checagem de tipos.
- `npm audit`: zero vulnerabilidades reportadas no momento da verificação.
- Inspeção visual de screenshots de login em 390 px e cadastro em desktop.

## Bloqueadores antes de um piloto com dados reais

- [ ] Reconciliar o schema remoto e suas policies/triggers com as migrations. O baseline foi inferido; não demonstra que uma instalação antiga possui todas as constraints necessárias.
- [ ] Restaurar backup real em staging e conferir registros, estoque e totais antes/depois.
- [ ] Executar CI em PostgreSQL 17 e validar o teste com duas conexões concorrentes. O Docker local estava parado e essa execução não ocorreu nesta máquina.
- [ ] Homologar Supabase hospedado, cadastro, confirmação de e-mail, recuperação, expiração, convites e revogação com contas reais. Os testes de UI usam mocks.
- [ ] Validar a convenção de receita de serviço ao concluir com o negócio. Parcelamento, pacotes com serviços incluídos e recebimento parcial exigem evolução do modelo.
- [ ] Configurar ambiente de deploy e redirects; publicar somente depois da migração validada.
- [ ] Definir responsável operacional, alertas, rotina de backup/restauração e atendimento a incidentes.
- [ ] Definir política e operação de retenção, exportação completa e anonimização de dados pessoais.

Se o WhatsApp fizer parte do piloto:

- [ ] Provisionar número, segredos, modelo e scheduler.
- [ ] Testar assinatura/retries, falhas e mensagens adversariais em staging.
- [ ] Verificar entrega real e procedimento para jobs parados/incertos; configurar alertas e retenção.

Nenhum deploy, alteração remota, envio de mensagem ou contratação foi realizado. A entrega é uma base endurecida para homologação; ainda não representa certificação de prontidão em produção.
