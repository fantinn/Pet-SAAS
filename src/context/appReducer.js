// Reducer central da aplicação. Cada "case" corresponde a uma função que
// existia solta no App.jsx original (addCliente, delPet, cicloStatus, etc.).
// Mantivemos as mesmas regras de negócio — só organizamos onde elas vivem.
import { uid, mesmoId } from "../utils/id.js";
import { slugify } from "../utils/format.js";

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

  RESTAURAR_ESTADO: "RESTAURAR_ESTADO",
};

const ORDEM_STATUS = ["Agendado", "Concluído", "Cancelado"];

const numero = (valor, padrao = 0) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : padrao;
};

export function appReducer(state, action) {
  switch (action.type) {
    case actionTypes.ADD_CLIENTE: {
      const cliente = { id: uid(), ...action.payload };
      return { ...state, clientes: [...state.clientes, cliente] };
    }

    case actionTypes.UPDATE_CLIENTE: {
      const { id, ...novosDados } = action.payload;
      return {
        ...state,
        clientes: state.clientes.map((c) => (mesmoId(c.id, id) ? { ...c, ...novosDados } : c)),
      };
    }

    case actionTypes.DELETE_CLIENTE: {
      const id = action.payload;
      // Apagar o cliente remove tudo que dependia dele; sem isso ficavam
      // pets órfãos e agendamentos apontando para um dono inexistente.
      const petsRemovidos = state.pets.filter((p) => mesmoId(p.clienteId, id)).map((p) => p.id);
      return {
        ...state,
        clientes: state.clientes.filter((c) => !mesmoId(c.id, id)),
        pets: state.pets.filter((p) => !mesmoId(p.clienteId, id)),
        agendamentos: state.agendamentos.filter(
          (a) => !petsRemovidos.some((petId) => mesmoId(petId, a.petId))
        ),
        assinaturas: state.assinaturas.filter((a) => !mesmoId(a.clienteId, id)),
        // Vendas são histórico financeiro: ficam, apenas sem vínculo de cliente.
        vendas: state.vendas.map((v) => (mesmoId(v.clienteId, id) ? { ...v, clienteId: "" } : v)),
      };
    }

    case actionTypes.ADD_PET: {
      const pet = { id: uid(), observacoes: "", ...action.payload };
      return { ...state, pets: [...state.pets, pet] };
    }

    case actionTypes.UPDATE_PET: {
      const { id, ...novosDados } = action.payload;
      return {
        ...state,
        pets: state.pets.map((p) => (mesmoId(p.id, id) ? { ...p, ...novosDados } : p)),
      };
    }

    case actionTypes.DELETE_PET: {
      const id = action.payload;
      return {
        ...state,
        pets: state.pets.filter((p) => !mesmoId(p.id, id)),
        agendamentos: state.agendamentos.filter((a) => !mesmoId(a.petId, id)),
      };
    }

    case actionTypes.UPDATE_PET_OBSERVACOES: {
      const { id, observacoes } = action.payload;
      return {
        ...state,
        pets: state.pets.map((p) => (mesmoId(p.id, id) ? { ...p, observacoes } : p)),
      };
    }

    case actionTypes.ADD_AGENDAMENTO: {
      const ag = {
        id: uid(),
        ...action.payload,
        valor: numero(action.payload.valor),
      };
      const agendamentos = [...state.agendamentos, ag].sort((a, b) =>
        `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`)
      );
      return { ...state, agendamentos };
    }

    case actionTypes.DELETE_AGENDAMENTO: {
      const id = action.payload;
      return { ...state, agendamentos: state.agendamentos.filter((a) => !mesmoId(a.id, id)) };
    }

    case actionTypes.CICLO_STATUS_AGENDAMENTO: {
      const id = action.payload;
      return {
        ...state,
        agendamentos: state.agendamentos.map((a) =>
          mesmoId(a.id, id)
            ? { ...a, status: ORDEM_STATUS[(ORDEM_STATUS.indexOf(a.status) + 1) % ORDEM_STATUS.length] }
            : a
        ),
      };
    }

    case actionTypes.ADD_VENDA: {
      const venda = {
        id: uid(),
        ...action.payload,
        qtd: numero(action.payload.qtd, 1),
        valor: numero(action.payload.valor),
        data: action.payload.data,
      };
      return { ...state, vendas: [venda, ...state.vendas] };
    }

    case actionTypes.DELETE_VENDA: {
      const id = action.payload;
      return { ...state, vendas: state.vendas.filter((v) => !mesmoId(v.id, id)) };
    }

    case actionTypes.ADD_ASSINATURA: {
      const { clienteId, planoId } = action.payload;
      // Um cliente não assina o mesmo plano duas vezes.
      const jaAssina = state.assinaturas.some(
        (a) => mesmoId(a.clienteId, clienteId) && mesmoId(a.planoId, planoId)
      );
      if (jaAssina) return state;
      return { ...state, assinaturas: [...state.assinaturas, { id: uid(), ...action.payload }] };
    }

    case actionTypes.CANCEL_ASSINATURA: {
      const id = action.payload;
      return { ...state, assinaturas: state.assinaturas.filter((a) => !mesmoId(a.id, id)) };
    }

    case actionTypes.ADD_DESPESA: {
      const despesa = { id: uid(), ...action.payload, valor: numero(action.payload.valor) };
      return { ...state, despesas: [despesa, ...state.despesas] };
    }

    case actionTypes.DELETE_DESPESA: {
      const id = action.payload;
      return { ...state, despesas: state.despesas.filter((d) => !mesmoId(d.id, id)) };
    }

    case actionTypes.ADD_SERVICO: {
      const servico = {
        id: uid(),
        ...action.payload,
        preco: numero(action.payload.preco),
        duracao: numero(action.payload.duracao, 30),
      };
      return { ...state, servicos: [...state.servicos, servico] };
    }

    case actionTypes.UPDATE_SERVICO: {
      const { id, ...novosDados } = action.payload;
      const anterior = state.servicos.find((s) => mesmoId(s.id, id));
      if (!anterior) return state;
      const atualizado = { ...anterior, ...novosDados };
      const renomeado = novosDados.nome !== undefined && novosDados.nome !== anterior.nome;
      return {
        ...state,
        servicos: state.servicos.map((s) => (mesmoId(s.id, id) ? atualizado : s)),
        // Agendamentos guardam o serviço pelo nome: renomear precisa levá-los junto,
        // senão a duração usada no cálculo de horários some.
        agendamentos: renomeado
          ? state.agendamentos.map((a) =>
              a.servico === anterior.nome ? { ...a, servico: atualizado.nome } : a
            )
          : state.agendamentos,
      };
    }

    case actionTypes.DELETE_SERVICO: {
      const id = action.payload;
      return { ...state, servicos: state.servicos.filter((s) => !mesmoId(s.id, id)) };
    }

    case actionTypes.ADD_PLANO: {
      const nome = action.payload.nome;
      const base = slugify(action.payload.id || nome) || uid();
      // Garante id único mesmo com dois planos de nome parecido.
      let id = base;
      let sufixo = 2;
      while (state.planos.some((p) => p.id === id)) id = `${base}-${sufixo++}`;
      const plano = { ...action.payload, id, preco: numero(action.payload.preco) };
      return { ...state, planos: [...state.planos, plano] };
    }

    case actionTypes.UPDATE_PLANO: {
      const { id, ...novosDados } = action.payload;
      // O id do plano é a chave usada pelas assinaturas — não pode ser editado.
      delete novosDados.id;
      return {
        ...state,
        planos: state.planos.map((p) => (mesmoId(p.id, id) ? { ...p, ...novosDados } : p)),
      };
    }

    case actionTypes.DELETE_PLANO: {
      const id = action.payload;
      return {
        ...state,
        planos: state.planos.filter((p) => !mesmoId(p.id, id)),
        assinaturas: state.assinaturas.filter((a) => !mesmoId(a.planoId, id)),
      };
    }

    case actionTypes.UPDATE_CONFIGURACOES: {
      return { ...state, configuracoes: { ...state.configuracoes, ...action.payload } };
    }

    // Substitui tudo pelo conteúdo de um backup já validado e migrado.
    case actionTypes.RESTAURAR_ESTADO: {
      return action.payload;
    }

    default:
      return state;
  }
}
