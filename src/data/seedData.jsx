// Conjunto de dados fictícios para demonstração do sistema.
// Usado pelo botão "Carregar dados de demonstração" em Configurações.

function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

export function buildSeedData() {
  const hoje = new Date();

  const clientes = [
    { id: 1, nome: "Ana Souza", telefone: "(12) 99999-1111" },
    { id: 2, nome: "Carlos Pereira", telefone: "(11) 98888-2222" },
    { id: 3, nome: "Beatriz Lima", telefone: "(21) 97777-3333" },
    { id: 4, nome: "Diego Santos", telefone: "(31) 96666-4444" },
    { id: 5, nome: "Fernanda Costa", telefone: "(41) 95555-5555" },
    { id: 6, nome: "Gabriel Rocha", telefone: "(51) 94444-6666" },
    { id: 7, nome: "Helena Martins", telefone: "(61) 93333-7777" },
    { id: 8, nome: "Igor Almeida", telefone: "(71) 92222-8888" },
  ];

  const pets = [
    { id: 1, nome: "Rex", especie: "Cachorro", raca: "Labrador", clienteId: 1, observacoes: "Alérgico a shampoo perfumado" },
    { id: 2, nome: "Mia", especie: "Gato", raca: "Siamês", clienteId: 1, observacoes: "" },
    { id: 3, nome: "Thor", especie: "Cachorro", raca: "Bulldog Francês", clienteId: 2, observacoes: "" },
    { id: 4, nome: "Luna", especie: "Gato", raca: "Persa", clienteId: 3, observacoes: "Muito arisca" },
    { id: 5, nome: "Bidu", especie: "Cachorro", raca: "Poodle", clienteId: 3, observacoes: "" },
    { id: 6, nome: "Nina", especie: "Cachorro", raca: "Vira-lata", clienteId: 4, observacoes: "" },
    { id: 7, nome: "Simba", especie: "Gato", raca: "Maine Coon", clienteId: 5, observacoes: "" },
    { id: 8, nome: "Max", especie: "Cachorro", raca: "Golden Retriever", clienteId: 6, observacoes: "Adora água" },
    { id: 9, nome: "Amora", especie: "Gato", raca: "SRD", clienteId: 7, observacoes: "" },
    { id: 10, nome: "Bob", especie: "Cachorro", raca: "Beagle", clienteId: 8, observacoes: "" },
  ];

  const servicos = [
    { id: 1, nome: "Banho", preco: 40, duracao: 60 },
    { id: 2, nome: "Tosa", preco: 35, duracao: 45 },
    { id: 3, nome: "Banho e Tosa", preco: 70, duracao: 90 },
    { id: 4, nome: "Veterinário", preco: 120, duracao: 30 },
    { id: 5, nome: "Vacina", preco: 80, duracao: 15 },
  ];

  const planos = [
    { id: "basico", nome: "Básico", descricao: "1 banho + tosa higiênica a cada 15 dias", preco: 99 },
    { id: "plus", nome: "Plus", descricao: "2 banhos + tosa completa por mês", preco: 159 },
    { id: "premium", nome: "Premium", descricao: "Banho semanal + tosa completa + táxi dog", preco: 249 },
  ];

  const assinaturas = [
    { id: 101, clienteId: 2, planoId: "plus", dataInicio: fmt(addDays(hoje, -44)) },
    { id: 102, clienteId: 3, planoId: "basico", dataInicio: fmt(addDays(hoje, -27)) },
    { id: 103, clienteId: 5, planoId: "premium", dataInicio: fmt(addDays(hoje, -79)) },
    { id: 104, clienteId: 7, planoId: "basico", dataInicio: fmt(addDays(hoje, -8)) },
  ];

  const agendamentos = [
    { id: 201, petId: 1, servico: "Banho e Tosa", data: fmt(addDays(hoje, -5)), hora: "09:00", status: "Concluído", valor: 70 },
    { id: 202, petId: 3, servico: "Banho", data: fmt(addDays(hoje, -3)), hora: "10:30", status: "Concluído", valor: 40 },
    { id: 203, petId: 4, servico: "Tosa", data: fmt(addDays(hoje, -1)), hora: "14:00", status: "Concluído", valor: 35 },
    { id: 204, petId: 8, servico: "Vacina", data: fmt(hoje), hora: "09:30", status: "Agendado", valor: 80 },
    { id: 205, petId: 6, servico: "Banho", data: fmt(hoje), hora: "11:00", status: "Agendado", valor: 40 },
    { id: 206, petId: 9, servico: "Veterinário", data: fmt(hoje), hora: "15:00", status: "Cancelado", valor: 120 },
    { id: 207, petId: 2, servico: "Banho e Tosa", data: fmt(addDays(hoje, 1)), hora: "09:00", status: "Agendado", valor: 70 },
    { id: 208, petId: 5, servico: "Tosa", data: fmt(addDays(hoje, 2)), hora: "13:30", status: "Agendado", valor: 35 },
    { id: 209, petId: 10, servico: "Vacina", data: fmt(addDays(hoje, 3)), hora: "10:00", status: "Agendado", valor: 80 },
    { id: 210, petId: 7, servico: "Banho", data: fmt(addDays(hoje, 4)), hora: "16:00", status: "Agendado", valor: 40 },
  ];

  const vendas = [
    { id: 301, clienteId: 1, item: "Banho e Tosa", qtd: 1, valor: 70, formaPagamento: "Pix" },
    { id: 302, clienteId: 2, item: "Ração Premium 10kg", qtd: 1, valor: 189.9, formaPagamento: "Cartão" },
    { id: 303, clienteId: 3, item: "Banho", qtd: 1, valor: 40, formaPagamento: "Dinheiro" },
    { id: 304, clienteId: 4, item: "Brinquedo mordedor", qtd: 2, valor: 25, formaPagamento: "Pix" },
    { id: 305, clienteId: 6, item: "Vacina", qtd: 1, valor: 80, formaPagamento: "Cartão" },
    { id: 306, clienteId: 7, item: "Shampoo antipulgas", qtd: 1, valor: 34.5, formaPagamento: "Pix" },
    { id: 307, clienteId: 8, item: "Tosa", qtd: 1, valor: 35, formaPagamento: "Dinheiro" },
    { id: 308, clienteId: 5, item: "Ração Filhote 3kg", qtd: 1, valor: 79.9, formaPagamento: "Cartão" },
  ];

  const despesas = [
    { id: 401, descricao: "Compra de produtos de higiene", valor: 220, data: fmt(addDays(hoje, -10)) },
    { id: 402, descricao: "Conta de água", valor: 90, data: fmt(addDays(hoje, -6)) },
    { id: 403, descricao: "Conta de energia", valor: 180, data: fmt(addDays(hoje, -6)) },
    { id: 404, descricao: "Ração para revenda", valor: 300, data: fmt(addDays(hoje, -2)) },
  ];

  return {
    clientes,
    pets,
    agendamentos,
    vendas,
    assinaturas,
    despesas,
    servicos,
    planos,
    configuracoes: { horarioAbertura: 8, horarioFechamento: 18 },
  };
}
