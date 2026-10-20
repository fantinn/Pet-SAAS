export const FERRAMENTAS = [
  {
    name: "listar_meus_pets",
    description: "Lista os pets já cadastrados do cliente que está conversando.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "cadastrar_pet",
    description: "Cadastra um novo pet para o cliente atual.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string" },
        especie: { type: "string", enum: ["Cachorro", "Gato", "Outro"] },
        raca: { type: "string" },
      },
      required: ["nome", "especie"],
    },
  },
  {
    name: "listar_servicos",
    description: "Lista os serviços oferecidos pelo petshop, com preço e duração em minutos.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "consultar_horarios_disponiveis",
    description: "Consulta horários disponíveis para agendar um serviço em uma data específica.",
    input_schema: {
      type: "object",
      properties: {
        data: { type: "string", description: "Data no formato YYYY-MM-DD" },
        servico: { type: "string", description: "Nome exato do serviço" },
      },
      required: ["data", "servico"],
    },
  },
  {
    name: "criar_agendamento",
    description: "Cria um agendamento para um pet do cliente atual, em um horário já confirmado como disponível.",
    input_schema: {
      type: "object",
      properties: {
        pet_nome: { type: "string" },
        servico: { type: "string" },
        data: { type: "string", description: "YYYY-MM-DD" },
        hora: { type: "string", description: "HH:MM" },
      },
      required: ["pet_nome", "servico", "data", "hora"],
    },
  },
  {
    name: "listar_meus_agendamentos",
    description: "Lista os próximos agendamentos (não cancelados) do cliente atual.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "atualizar_meu_nome",
    description: "Atualiza o nome do cliente no cadastro. Use quando ele se apresentar ou corrigir o nome.",
    input_schema: {
      type: "object",
      properties: { nome: { type: "string" } },
      required: ["nome"],
    },
  },
];
