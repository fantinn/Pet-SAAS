# Petshop SaaS

Sistema de gestão para petshop com arquitetura moderna e escalável usando React + Context API + localStorage.

## Funcionalidades

### Dashboard
- Visão geral do negócio
- Métricas financeiras (entradas, despesas, saldo)
- Agendamentos do dia
- Vendas por forma de pagamento

### Clientes
- Cadastro de clientes (nome, telefone)
- Busca de clientes
- Exclusão de clientes
- Link direto para WhatsApp

### Pets
- Cadastro de pets (nome, espécie, raça, cliente)
- Busca de pets
- Observações por pet
- Exclusão de pets

### Agendamentos
- Agendamento de serviços (banho, tosa, veterinário, vacina)
- Controle de status (Agendado, Concluído, Cancelado)
- Visualização em calendário mensal
- Filtro por dia específico

### Vendas
- Registro de vendas
- Itens customizáveis ou pré-definidos
- Controle de forma de pagamento (Pix, Cartão, Dinheiro)
- Histórico de vendas

### Planos e Assinaturas
- Planos recorrentes (Básico, Plus, Premium)
- Associação de clientes a planos
- Cancelamento de assinaturas

### Financeiro
- Registro de despesas
- Balanço financeiro
- Controle de entradas e saídas

## Arquitetura

O projeto foi refatorado para uma arquitetura mais robusta e escalável:

### Estrutura de Arquivos
```
src/
├── components/
│   ├── common/           # Componentes reutilizáveis
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── StatusBadge.jsx
│   │   └── WhatsAppLink.jsx
│   ├── features/         # Componentes por funcionalidade
│   │   ├── Dashboard.jsx
│   │   ├── clientes/Clientes.jsx
│   │   ├── pets/Pets.jsx
│   │   ├── agendamentos/Agendamentos.jsx
│   │   ├── vendas/Vendas.jsx
│   │   ├── planos/Planos.jsx
│   │   └── financeiro/Financeiro.jsx
│   └── layout/           # Componentes de layout
│       └── Sidebar.jsx   # Sidebar recolhível
├── context/
│   ├── AppProvider.jsx    # Provider global com Context API
│   └── appReducer.jsx     # Reducer central para gerenciamento de estado
├── data/
│   └── constants.jsx      # Constantes e dados estáticos
├── hooks/
│   └── useCalendar.jsx   # Custom hook para lógica de calendário
├── services/
│   └── storageService.jsx # Serviço de persistência (localStorage)
├── utils/
│   └── format.jsx         # Funções utilitárias de formatação
├── App.jsx                # Componente principal
└── main.jsx              # Entry point
```

### Vantagens da Nova Arquitetura

✅ **Persistência de Dados** - Dados salvos automaticamente no localStorage
✅ **Gerenciamento Centralizado** - useReducer + Context API para estado global
✅ **Separação de Responsabilidades** - Lógica de negócio separada da UI
✅ **Escalabilidade** - Fácil adicionar novos recursos e componentes
✅ **Manutenibilidade** - Código organizado e fácil de manter
✅ **Testabilidade** - Componentes isolados são mais fáceis de testar
✅ **Sidebar Recolhível** - Navegação escalável com categorias organizadas

### Navegação por Categorias

- **PRINCIPAL**: Dashboard
- **OPERAÇÃO**: Agendamentos, Clientes, Pets, Vendas, Estoque
- **GESTÃO**: Financeiro, Relatórios, Planos
- **SISTEMA**: Configurações, Assinatura, Usuários, Permissões

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

## Próximas Melhorias

- [ ] Adicionar roteamento (React Router)
- [ ] Implementar autenticação
- [ ] Migrar para banco de dados real
- [ ] Adicionar testes unitários
- [ ] Implementar funcionalidades pendentes (Estoque, Relatórios, Configurações, etc.)
- [ ] Adicionar validações mais robustas
