// Reducer central da aplicação. Cada "case" corresponde a uma função que
// existia solta no App.jsx original (addCliente, delPet, cicloStatus, etc.).
// Mantivemos as mesmas regras de negócio — só organizamos onde elas vivem.

export const actionTypes = {
  ADD_CLIENTE: "ADD_CLIENTE",
  UPDATE_CLIENTE: "UPDATE_CLIENTE",
  DELETE_CLIENTE: "DELETE_CLIENTE",

  ADD_PET: "ADD_PET",
  UPDATE_PET: "UPDATE_PET",
  DELETE_PET: "DELETE_PET",
  UPDATE_PET_OBSERVACOES: "UPDATE_PET_OBSERVACOES",

  ADD_AGENDAMENTO: "ADD_AGENDAMENTO",
  DELETE_AGENDAMENTO: "DELETE_AGENDAMENTO",
  CICLO_STATUS_AGENDAMENTO: "CICLO_STATUS_AGENDAMENTO",

  ADD_VENDA: "ADD_VENDA",
  DELETE_VENDA: "DELETE_VENDA",

  ADD_ASSINATURA: "ADD_ASSINATURA",
  CANCEL_ASSINATURA: "CANCEL_ASSINATURA",

  ADD_DESPESA: "ADD_DESPESA",
  DELETE_DESPESA: "DELETE_DESPESA",

  ADD_SERVICO: "ADD_SERVICO",
  UPDATE_SERVICO: "UPDATE_SERVICO",
  DELETE_SERVICO: "DELETE_SERVICO",

  ADD_PLANO: "ADD_PLANO",
  UPDATE_PLANO: "UPDATE_PLANO",
  DELETE_PLANO: "DELETE_PLANO",

  UPDATE_CONFIGURACOES: "UPDATE_CONFIGURACOES",
};

const ORDEM_STATUS = ["Agendado", "Concluído", "Cancelado"];

export function appReducer(state, action) {
  switch (action.type) {
    case actionTypes.ADD_CLIENTE: {
      const cliente = { id: Date.now(), ...action.payload };
      return { ...state, clientes: [...state.clientes, cliente] };
    }

    case actionTypes.UPDATE_CLIENTE: {
      const { id, ...novosDados } = action.payload;
      return {
        ...state,
        clientes: state.clientes.map((c) => (c.id === id ? { ...c, ...novosDados } : c)),
      };
    }

    case actionTypes.DELETE_CLIENTE: {
      const id = action.payload;
      return {
        ...state,
        clientes: state.clientes.filter((c) => c.id !== id),
        // Mantém a regra original: apagar um cliente também remove seus pets.
        pets: state.pets.filter((p) => p.clienteId !== id),
      };
    }

    case actionTypes.ADD_PET: {
      const pet = {
        id: Date.now(),
        ...action.payload,
        clienteId: Number(action.payload.clienteId),
        observacoes: "",
      };
      return { ...state, pets: [...state.pets, pet] };
    }

    case actionTypes.UPDATE_PET: {
      const { id, ...novosDados } = action.payload;
      return {
        ...state,
        pets: state.pets.map((p) => (p.id === id ? { ...p, ...novosDados, clienteId: Number(novosDados.clienteId) } : p)),
      };
    }

    case actionTypes.DELETE_PET: {
      const id = action.payload;
      return { ...state, pets: state.pets.filter((p) => p.id !== id) };
    }

    case actionTypes.UPDATE_PET_OBSERVACOES: {
      const { id, observacoes } = action.payload;
      return {
        ...state,
        pets: state.pets.map((p) => (p.id === id ? { ...p, observacoes } : p)),
      };
    }

    case actionTypes.ADD_AGENDAMENTO: {
      const ag = {
        id: Date.now(),
        ...action.payload,
        petId: Number(action.payload.petId),
        valor: Number(action.payload.valor) || 0,
      };
      const agendamentos = [...state.agendamentos, ag].sort((a, b) =>
        `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`)
      );
      return { ...state, agendamentos };
    }

    case actionTypes.DELETE_AGENDAMENTO: {
      const id = action.payload;
      return { ...state, agendamentos: state.agendamentos.filter((a) => a.id !== id) };
    }

    case actionTypes.CICLO_STATUS_AGENDAMENTO: {
      const id = action.payload;
      return {
        ...state,
        agendamentos: state.agendamentos.map((a) =>
          a.id === id
            ? { ...a, status: ORDEM_STATUS[(ORDEM_STATUS.indexOf(a.status) + 1) % ORDEM_STATUS.length] }
            : a
        ),
      };
    }

    case actionTypes.ADD_VENDA: {
      const venda = { id: Date.now(), ...action.payload };
      return { ...state, vendas: [venda, ...state.vendas] };
    }

    case actionTypes.DELETE_VENDA: {
      const id = action.payload;
      return { ...state, vendas: state.vendas.filter((v) => v.id !== id) };
    }

    case actionTypes.ADD_ASSINATURA: {
      const assinatura = { id: Date.now(), ...action.payload };
      return { ...state, assinaturas: [...state.assinaturas, assinatura] };
    }

    case actionTypes.CANCEL_ASSINATURA: {
      const id = action.payload;
      return { ...state, assinaturas: state.assinaturas.filter((a) => a.id !== id) };
    }

    case actionTypes.ADD_DESPESA: {
      const despesa = { id: Date.now(), ...action.payload };
      return { ...state, despesas: [despesa, ...state.despesas] };
    }

    case actionTypes.DELETE_DESPESA: {
      const id = action.payload;
      return { ...state, despesas: state.despesas.filter((d) => d.id !== id) };
    }

    case actionTypes.ADD_SERVICO: {
      const servico = { id: Date.now(), ...action.payload };
      return { ...state, servicos: [...state.servicos, servico] };
    }

    case actionTypes.UPDATE_SERVICO: {
      const { id, ...novosDados } = action.payload;
      return {
        ...state,
        servicos: state.servicos.map((s) => (s.id === id ? { ...s, ...novosDados } : s)),
      };
    }

    case actionTypes.DELETE_SERVICO: {
      const id = action.payload;
      return { ...state, servicos: state.servicos.filter((s) => s.id !== id) };
    }

    case actionTypes.ADD_PLANO: {
      const plano = { ...action.payload };
      return { ...state, planos: [...state.planos, plano] };
    }

    case actionTypes.UPDATE_PLANO: {
      const { id, ...novosDados } = action.payload;
      return {
        ...state,
        planos: state.planos.map((p) => (p.id === id ? { ...p, ...novosDados } : p)),
      };
    }

    case actionTypes.DELETE_PLANO: {
      const id = action.payload;
      return { ...state, planos: state.planos.filter((p) => p.id !== id) };
    }

    case actionTypes.UPDATE_CONFIGURACOES: {
      return { ...state, configuracoes: { ...state.configuracoes, ...action.payload } };
    }

    default:
      return state;
  }
}
