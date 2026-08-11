const hoje = new Date();

export const ESTADO_INICIAL = {
  clientes: [
    { id: 1, nome: "Ana Souza", telefone: "(12) 99999-1111" },
  ],
  pets: [
    { id: 1, nome: "Rex", especie: "Cachorro", raca: "Labrador", clienteId: 1, observacoes: "" },
  ],
  agendamentos: [],
  vendas: [],
  assinaturas: [],
  despesas: [],
  servicos: [
    { id: 1, nome: "Banho", preco: 40, duracao: 60 },
    { id: 2, nome: "Tosa", preco: 35, duracao: 45 },
    { id: 3, nome: "Banho e Tosa", preco: 70, duracao: 90 },
    { id: 4, nome: "Veterinário", preco: 120, duracao: 30 },
    { id: 5, nome: "Vacina", preco: 80, duracao: 15 },
  ],
  planos: [
    { id: "basico", nome: "Básico", descricao: "1 banho + tosa higiênica a cada 15 dias", preco: 99 },
    { id: "plus", nome: "Plus", descricao: "2 banhos + tosa completa por mês", preco: 159 },
    { id: "premium", nome: "Premium", descricao: "Banho semanal + tosa completa + táxi dog", preco: 249 },
  ],
  configuracoes: {
    horarioAbertura: 8,
    horarioFechamento: 18,
  },
};

export const FORMAS_PAGAMENTO = ["Pix", "Cartão", "Dinheiro"];

export const STATUS_COR = {
  Agendado: "bg-blue-100 text-blue-700",
  Concluído: "bg-green-100 text-green-700",
  Cancelado: "bg-red-100 text-red-700",
};

export const ORDEM_STATUS = ["Agendado", "Concluído", "Cancelado"];
