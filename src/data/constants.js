export const ESTADO_INICIAL = {
  clientes: [
    { id: "cli-exemplo", nome: "Ana Souza", telefone: "(12) 99999-1111" },
  ],
  pets: [
    { id: "pet-exemplo", nome: "Rex", especie: "Cachorro", raca: "Labrador", clienteId: "cli-exemplo", observacoes: "" },
  ],
  agendamentos: [],
  vendas: [],
  produtos: [
    { id: "prod-racao", nome: "Ração Premium 10kg", categoria: "Alimentação", precoCusto: 120, precoVenda: 189.9, quantidade: 8, estoqueMinimo: 3 },
    { id: "prod-shampoo", nome: "Shampoo Hipoalergênico", categoria: "Higiene", precoCusto: 18, precoVenda: 34.9, quantidade: 2, estoqueMinimo: 5 },
  ],
  movimentacoes: [],
  assinaturas: [],
  despesas: [],
  servicos: [
    { id: "srv-banho", nome: "Banho", preco: 40, duracao: 60 },
    { id: "srv-tosa", nome: "Tosa", preco: 35, duracao: 45 },
    { id: "srv-banho-tosa", nome: "Banho e Tosa", preco: 70, duracao: 90 },
    { id: "srv-veterinario", nome: "Veterinário", preco: 120, duracao: 30 },
    { id: "srv-vacina", nome: "Vacina", preco: 80, duracao: 15 },
  ],
  planos: [
    { id: "basico", nome: "Básico", descricao: "1 banho + tosa higiênica a cada 15 dias", preco: 99 },
    { id: "plus", nome: "Plus", descricao: "2 banhos + tosa completa por mês", preco: 159 },
    { id: "premium", nome: "Premium", descricao: "Banho semanal + tosa completa + táxi dog", preco: 249 },
  ],
  configuracoes: {
    horarioAbertura: 8,
    horarioFechamento: 18,
    intervaloMinutos: 30,
  },
};

export const FORMAS_PAGAMENTO = ["Pix", "Cartão", "Dinheiro"];

export const CATEGORIAS_PRODUTO = ["Alimentação", "Higiene", "Brinquedos", "Acessórios", "Medicamentos", "Outros"];

// Motivos de saída/entrada que não passam por uma venda.
export const MOTIVOS_MOVIMENTACAO = {
  entrada: "Entrada (compra)",
  venda: "Venda",
  estorno: "Estorno de venda",
  perda: "Perda / vencimento",
  ajuste: "Ajuste de inventário",
  uso: "Uso interno",
};

export const ESPECIES = ["Cachorro", "Gato", "Outro"];

export const STATUS_COR = {
  Agendado: "bg-blue-100 text-blue-700",
  Concluído: "bg-green-100 text-green-700",
  Cancelado: "bg-red-100 text-red-700",
};

export const ORDEM_STATUS = ["Agendado", "Concluído", "Cancelado"];
