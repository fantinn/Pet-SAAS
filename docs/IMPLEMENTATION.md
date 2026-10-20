# Preparação para piloto

## Plano

- P0: esquema reproduzível, RLS e vínculos entre registros; venda/estoque atômicos; agenda sem sobreposição; remoção de demonstração destrutiva.
- P1: petshop/equipe, recuperação de acesso, operações idempotentes, mensagens de erro e formulários que preservam rascunhos; endurecimento do webhook.
- P2: testes, CI, carregamento paginado, acessibilidade e documentação operacional.

O esquema base foi inferido dos acessos no código. Nenhum banco remoto foi inspecionado. Antes de migrar uma instalação existente, comparar seu schema dump, políticas, triggers, constraints e dados com as migrations deste repositório em uma cópia de staging. Não executar o baseline cegamente em produção.

Decisão de compatibilidade: `owner_id` permanece a chave do petshop (UUID do proprietário original). Membros recebem acesso a essa mesma chave. Cada usuário pertence a um petshop no piloto; múltiplas unidades e troca de petshop não fazem parte desta implementação.
