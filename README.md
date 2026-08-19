# Petshop SaaS

Sistema de gestão para petshop com arquitetura moderna e escalável usando React + Context API + localStorage.

## Funcionalidades

### Dashboard
- Visão geral do negócio (clientes, pets, agendamentos do dia, faturamento)
- Agendamentos do dia, com atalho para a ficha do cliente
- Vendas por forma de pagamento

### Clientes
- Cadastro e edição de clientes (nome, telefone com máscara)
- Busca de clientes
- Exclusão com confirmação, avisando o que será removido junto
- Link direto para WhatsApp

### Pets
- Cadastro e edição de pets (nome, espécie, raça, dono)
- Busca por nome, raça ou dono
- Observações por pet
- Exclusão com confirmação

### Agendamentos
- Agendamento de serviços com preço e duração vindos do cadastro
- Só oferece horários realmente livres, dentro do horário de funcionamento e
  sem sobrepor outro agendamento
- Controle de status (Agendado, Concluído, Cancelado)
- Visualização em calendário mensal, com a agenda do dia selecionado

### Vendas
- Registro de vendas de serviços, produtos do estoque ou itens avulsos
- Venda de produto dá baixa no estoque automaticamente
- Controle de forma de pagamento (Pix, Cartão, Dinheiro)
- Histórico de vendas

### Planos e Assinaturas
- Planos recorrentes (Básico, Plus, Premium ou os que você cadastrar)
- Associação de clientes a planos, sem assinatura duplicada
- Receita recorrente somada no financeiro
- Cancelamento de assinaturas

### Estoque
- Cadastro de produtos com categoria, preço de custo e de venda, quantidade e
  estoque mínimo
- Alerta de reposição na tela e no Dashboard
- Entrada (compra), baixa (perda ou uso interno) e ajuste de inventário, com
  histórico de cada movimentação
- Baixa automática ao vender um produto e devolução ao excluir a venda

### Relatórios
- Períodos prontos (este mês, mês passado, últimos 30 dias, este ano) ou
  intervalo personalizado
- Faturamento, despesas, lucro e ticket médio do período
- Faturamento por dia, serviços e produtos mais vendidos, clientes que mais
  gastaram e agendamentos por status com taxa de conclusão

### Financeiro
- Registro de despesas
- Balanço financeiro
- Controle de entradas e saídas

### Configurações
- Backup: exportar todos os dados em JSON e importar de volta
- Horário de funcionamento (abertura, fechamento e intervalo entre horários),
  usado pela agenda para calcular os horários livres
- Cadastro de serviços (nome, preço e duração)
- Cadastro de planos de assinatura

## Arquitetura

O projeto foi refatorado para uma arquitetura mais robusta e escalável:

### Estrutura de Arquivos
```
src/
├── components/
│   ├── common/           # Componentes reutilizáveis
│   │   ├── Button.jsx
│   │   ├── ConfirmDialog.jsx  # Diálogo de confirmação de exclusões
│   │   ├── EmptyState.jsx     # Estado vazio padrão das listas
│   │   ├── Input.jsx          # Campo com rótulo e mensagem de erro
│   │   ├── StatusBadge.jsx
│   │   └── WhatsAppLink.jsx
│   ├── features/         # Componentes por funcionalidade
│   │   ├── Dashboard.jsx
│   │   ├── clientes/Clientes.jsx
│   │   ├── pets/Pets.jsx
│   │   ├── agendamentos/Agendamentos.jsx
│   │   ├── vendas/Vendas.jsx
│   │   ├── planos/Planos.jsx
│   │   ├── financeiro/Financeiro.jsx
│   │   ├── estoque/Estoque.jsx
│   │   ├── relatorios/Relatorios.jsx
│   │   └── settings/
│   │       ├── Settings.jsx
│   │       └── BackupSection.jsx
│   └── layout/           # Componentes de layout
│       └── Sidebar.jsx   # Menu recolhível (gaveta no mobile)
├── context/
│   ├── AppProvider.jsx    # Provider global com Context API
│   └── appReducer.js      # Reducer central para gerenciamento de estado
├── data/
│   ├── constants.js       # Constantes e dados iniciais
│   └── migrarEstado.js    # Completa dados salvos por versões anteriores
├── hooks/
│   ├── useCalendar.js     # Custom hook para lógica de calendário
│   └── useConfirmacao.jsx # Diálogo de confirmação compartilhado
├── services/
│   ├── storageService.js  # Serviço de persistência (localStorage)
│   └── backupService.js   # Exportação e leitura dos arquivos de backup
├── utils/
│   ├── availability.js    # Cálculo de horários livres na agenda
│   ├── format.js          # Moeda, data, telefone e slug
│   ├── id.js              # Geração e comparação de ids
│   └── relatorios.js      # Apuração dos números por período
├── App.jsx                # Componente principal
└── main.jsx               # Entry point

tests/                     # Testes com o runner nativo do Node
```

### Vantagens da Nova Arquitetura

✅ **Persistência de Dados** - Dados salvos automaticamente no localStorage
✅ **Gerenciamento Centralizado** - useReducer + Context API para estado global
✅ **Separação de Responsabilidades** - Lógica de negócio separada da UI
✅ **Escalabilidade** - Fácil adicionar novos recursos e componentes
✅ **Manutenibilidade** - Código organizado e fácil de manter
✅ **Testabilidade** - Componentes isolados são mais fáceis de testar
✅ **Sidebar Recolhível** - Navegação escalável com categorias organizadas
✅ **Responsivo** - Menu vira gaveta no celular e os formulários se empilham
✅ **Testado** - Regras de negócio cobertas por testes automatizados

### Navegação por Categorias

- **PRINCIPAL**: Dashboard
- **OPERAÇÃO**: Agendamentos, Clientes, Pets, Vendas, Estoque
- **GESTÃO**: Financeiro, Relatórios, Planos
- **SISTEMA**: Configurações, Assinatura, Usuários, Permissões

### Regras de Integridade

- Excluir um cliente remove também seus pets, agendamentos e assinaturas.
  As vendas permanecem no histórico financeiro, apenas sem o vínculo.
- Excluir um pet remove os agendamentos dele.
- Excluir um plano cancela as assinaturas correspondentes.
- O id do plano é derivado do nome e não muda depois de criado, porque é a
  chave usada pelas assinaturas.
- Renomear um serviço atualiza os agendamentos que o utilizavam.
- A quantidade de um produto só muda por movimentação, nunca editando o
  cadastro, para o histórico nunca discordar do saldo.
- Vender um produto dá baixa no estoque; excluir a venda devolve a quantidade
  e registra o estorno. Vender mais do que existe é recusado.
- Excluir um produto remove o histórico dele, mas preserva as vendas já feitas.
- Dados salvos por versões anteriores são completados na carga
  (`migrarEstado`), sem sobrescrever o que o usuário já cadastrou.

### Fluxo de Dados

1. **UI Componentes** → Disparam ações via `actions`
2. **Actions** → Dispatch para o reducer
3. **Reducer** → Atualiza o estado centralizado
4. **useEffect** → Persiste automaticamente no localStorage
5. **Context API** → Distribui o estado para todos os componentes

## Tecnologias

- React 18
- Vite
- Tailwind CSS
- Lucide React (ícones)
- Context API (gerenciamento de estado)
- localStorage (persistência)

## Onde os dados ficam

Tudo é salvo no `localStorage` do navegador — não há servidor. Isso significa
que os dados são de **um navegador em um computador**: limpar o histórico,
trocar de máquina ou usar uma janela anônima começa do zero. Por isso existe o
backup em Configurações; exporte com frequência.

## Como usar

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse no navegador: http://localhost:5173

## Comandos

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build de produção
- `npm test` - Roda os testes (runner nativo do Node, sem dependências extras)

## Testes

Os testes cobrem o núcleo de regras do sistema — reducer, migração de estado,
cálculo de horários disponíveis e formatação:

```bash
npm test
```

## Próximas Melhorias

- [x] Adicionar testes unitários
- [x] Adicionar validações mais robustas
- [x] Implementar a tela de Configurações
- [x] Implementar Estoque e Relatórios
- [x] Backup e restauração dos dados
- [ ] Adicionar roteamento (React Router)
- [ ] Implementar autenticação
- [ ] Migrar para banco de dados real
- [ ] Implementar funcionalidades pendentes (Assinatura, Usuários e Permissões)
