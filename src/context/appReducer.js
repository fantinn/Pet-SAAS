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

  ADD_PRODUTO: "ADD_PRODUTO",
  UPDATE_PRODUTO: "UPDATE_PRODUTO",
  DELETE_PRODUTO: "DELETE_PRODUTO",
  MOVIMENTAR_ESTOQUE: "MOVIMENTAR_ESTOQUE",
  AJUSTAR_ESTOQUE: "AJUSTAR_ESTOQUE",

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

// Cada tipo de movimentação diz para que lado o estoque anda.
const SINAL_MOVIMENTACAO = { entrada: 1, estorno: 1, venda: -1, perda: -1, uso: -1 };

/** Aplica uma movimentação: atualiza a quantidade do produto e registra o histórico. */
function movimentar(state, { produtoId, tipo, quantidade, observacao = "", vendaId = null, data }) {
  const produto = state.produtos.find((p) => mesmoId(p.id, produtoId));
  if (!produto) return state;

  const sinal = SINAL_MOVIMENTACAO[tipo] ?? 0;
  const qtd = Math.abs(numero(quantidade));
  if (!sinal || qtd === 0) return state;

  // A tela impede vender mais do que existe; o Math.max é só uma rede de
  // segurança para o estoque nunca ficar negativo.
  const novaQuantidade = Math.max(0, produto.quantidade + sinal * qtd);

  const movimentacao = {
    id: uid(),
    produtoId: produto.id,
    tipo,
    quantidade: qtd,
    quantidadeAnterior: produto.quantidade,
    quantidadeFinal: novaQuantidade,
    observacao,
    vendaId,
    data: data || new Date().toISOString().slice(0, 10),
  };

  return {
    ...state,
    produtos: state.produtos.map((p) =>
      mesmoId(p.id, produto.id) ? { ...p, quantidade: novaQuantidade } : p
    ),
    movimentacoes: [movimentacao, ...state.movimentacoes],
  };
}

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

    case actionTypes.ADD_PRODUTO: {
      const produto = {
        id: uid(),
        ...action.payload,
        precoVenda: numero(action.payload.precoVenda),
        precoCusto: numero(action.payload.precoCusto),
        quantidade: numero(action.payload.quantidade),
        estoqueMinimo: numero(action.payload.estoqueMinimo),
      };
      const comProduto = { ...state, produtos: [...state.produtos, produto] };
      // Estoque inicial entra como movimentação, para o histórico não começar torto.
      return produto.quantidade > 0
        ? movimentar(
            { ...comProduto, produtos: comProduto.produtos.map((p) => (p.id === produto.id ? { ...p, quantidade: 0 } : p)) },
            { produtoId: produto.id, tipo: "entrada", quantidade: produto.quantidade, observacao: "Estoque inicial" }
          )
        : comProduto;
    }

    case actionTypes.UPDATE_PRODUTO: {
      const { id, ...novosDados } = action.payload;
      // A quantidade só muda por movimentação, nunca editando o cadastro.
      delete novosDados.quantidade;
      return {
        ...state,
        produtos: state.produtos.map((p) =>
          mesmoId(p.id, id)
            ? {
                ...p,
                ...novosDados,
                precoVenda: numero(novosDados.precoVenda ?? p.precoVenda),
                precoCusto: numero(novosDados.precoCusto ?? p.precoCusto),
                estoqueMinimo: numero(novosDados.estoqueMinimo ?? p.estoqueMinimo),
              }
            : p
        ),
      };
    }

    case actionTypes.DELETE_PRODUTO: {
      const id = action.payload;
      return {
        ...state,
        produtos: state.produtos.filter((p) => !mesmoId(p.id, id)),
        movimentacoes: state.movimentacoes.filter((m) => !mesmoId(m.produtoId, id)),
        // As vendas continuam no histórico, só perdem o vínculo com o produto.
        vendas: state.vendas.map((v) => (mesmoId(v.produtoId, id) ? { ...v, produtoId: null } : v)),
      };
    }

    case actionTypes.MOVIMENTAR_ESTOQUE: {
      return movimentar(state, action.payload);
    }

    case actionTypes.AJUSTAR_ESTOQUE: {
      const { produtoId, novaQuantidade, observacao = "" } = action.payload;
      const produto = state.produtos.find((p) => mesmoId(p.id, produtoId));
      if (!produto) return state;

      const alvo = Math.max(0, numero(novaQuantidade));
      if (alvo === produto.quantidade) return state;

      const movimentacao = {
        id: uid(),
        produtoId: produto.id,
        tipo: "ajuste",
        quantidade: Math.abs(alvo - produto.quantidade),
        quantidadeAnterior: produto.quantidade,
        quantidadeFinal: alvo,
        observacao,
        vendaId: null,
        data: new Date().toISOString().slice(0, 10),
      };

      return {
        ...state,
        produtos: state.produtos.map((p) => (mesmoId(p.id, produto.id) ? { ...p, quantidade: alvo } : p)),
        movimentacoes: [movimentacao, ...state.movimentacoes],
      };
    }

    case actionTypes.ADD_VENDA: {
      const venda = {
        id: uid(),
        produtoId: null,
        ...action.payload,
        qtd: numero(action.payload.qtd, 1),
        valor: numero(action.payload.valor),
        data: action.payload.data,
      };
      const comVenda = { ...state, vendas: [venda, ...state.vendas] };

      // Vender um produto tira do estoque na mesma ação.
      return venda.produtoId
        ? movimentar(comVenda, {
            produtoId: venda.produtoId,
            tipo: "venda",
            quantidade: venda.qtd,
            vendaId: venda.id,
            data: venda.data,
            observacao: venda.item,
          })
        : comVenda;
    }

    case actionTypes.DELETE_VENDA: {
      const id = action.payload;
      const venda = state.vendas.find((v) => mesmoId(v.id, id));
      const semVenda = { ...state, vendas: state.vendas.filter((v) => !mesmoId(v.id, id)) };

      // Desfazer a venda devolve o produto ao estoque.
      return venda?.produtoId
        ? movimentar(semVenda, {
            produtoId: venda.produtoId,
            tipo: "estorno",
            quantidade: venda.qtd,
            vendaId: venda.id,
            observacao: `Venda excluída: ${venda.item}`,
          })
        : semVenda;
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
