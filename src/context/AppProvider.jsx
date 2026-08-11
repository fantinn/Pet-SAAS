import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { appReducer, actionTypes } from "./appReducer.jsx";
import { ESTADO_INICIAL, FORMAS_PAGAMENTO } from "../data/constants.jsx";
import { formatDate } from "../utils/format.jsx";
import * as storage from "../services/storageService.jsx";

const STORAGE_KEY = "estado";

const AppStateContext = createContext(null);

function init() {
  return storage.load(STORAGE_KEY, ESTADO_INICIAL);
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, undefined, init);

  // Persiste automaticamente sempre que o estado transacional mudar.
  // É a única linha responsável por resolver o problema de "perde tudo ao
  // recarregar a página" da versão anterior.
  useEffect(() => {
    storage.save(STORAGE_KEY, state);
  }, [state]);

  // --- Dados derivados (equivalentes às variáveis calculadas no App.jsx) ---
  const derived = useMemo(() => {
    const hoje = new Date();
    const hojeStr = formatDate(hoje);

    const nomeCliente = (id) => state.clientes.find((c) => c.id === id)?.nome || "—";
    const petInfo = (id) => state.pets.find((p) => p.id === id);

    const totalVendas = state.vendas.reduce((s, v) => s + v.qtd * v.valor, 0);
    const totalPlanos = state.assinaturas.reduce(
      (s, a) => s + (state.planos.find((p) => p.id === a.planoId)?.preco || 0),
      0
    );
    const totalEntradas = totalVendas + totalPlanos;
    const totalDespesas = state.despesas.reduce((s, d) => s + d.valor, 0);
    const saldo = totalEntradas - totalDespesas;

    const totalPorPagamento = FORMAS_PAGAMENTO.map((forma) => ({
      forma,
      total: state.vendas
        .filter((v) => v.formaPagamento === forma)
        .reduce((s, v) => s + v.qtd * v.valor, 0),
    }));

    const agendamentosHoje = state.agendamentos.filter((a) => a.data === hojeStr);
    const contaNoDia = (dataStr) => state.agendamentos.filter((a) => a.data === dataStr).length;

    return {
      hoje,
      hojeStr,
      nomeCliente,
      petInfo,
      totalVendas,
      totalPlanos,
      totalEntradas,
      totalDespesas,
      saldo,
      totalPorPagamento,
      agendamentosHoje,
      contaNoDia,
    };
  }, [state]);

  // --- Ações expostas (equivalentes às funções addCliente, delPet, etc.) ---
  const actions = useMemo(
    () => ({
      addCliente: (payload) => dispatch({ type: actionTypes.ADD_CLIENTE, payload }),
      updateCliente: (id, novosDados) => dispatch({ type: actionTypes.UPDATE_CLIENTE, payload: { id, ...novosDados } }),
      deleteCliente: (id) => dispatch({ type: actionTypes.DELETE_CLIENTE, payload: id }),

      addPet: (payload) => dispatch({ type: actionTypes.ADD_PET, payload }),
      updatePet: (id, novosDados) => dispatch({ type: actionTypes.UPDATE_PET, payload: { id, ...novosDados } }),
      deletePet: (id) => dispatch({ type: actionTypes.DELETE_PET, payload: id }),
      updatePetObservacoes: (id, observacoes) =>
        dispatch({ type: actionTypes.UPDATE_PET_OBSERVACOES, payload: { id, observacoes } }),

      addAgendamento: (payload) => dispatch({ type: actionTypes.ADD_AGENDAMENTO, payload }),
      deleteAgendamento: (id) => dispatch({ type: actionTypes.DELETE_AGENDAMENTO, payload: id }),
      cicloStatusAgendamento: (id) =>
        dispatch({ type: actionTypes.CICLO_STATUS_AGENDAMENTO, payload: id }),

      addVenda: (payload) => dispatch({ type: actionTypes.ADD_VENDA, payload }),
      deleteVenda: (id) => dispatch({ type: actionTypes.DELETE_VENDA, payload: id }),

      addAssinatura: (payload) => dispatch({ type: actionTypes.ADD_ASSINATURA, payload }),
      cancelAssinatura: (id) => dispatch({ type: actionTypes.CANCEL_ASSINATURA, payload: id }),

      addDespesa: (payload) => dispatch({ type: actionTypes.ADD_DESPESA, payload }),
      deleteDespesa: (id) => dispatch({ type: actionTypes.DELETE_DESPESA, payload: id }),

      addServico: (payload) => dispatch({ type: actionTypes.ADD_SERVICO, payload }),
      updateServico: (id, novosDados) => dispatch({ type: actionTypes.UPDATE_SERVICO, payload: { id, ...novosDados } }),
      deleteServico: (id) => dispatch({ type: actionTypes.DELETE_SERVICO, payload: id }),

      addPlano: (payload) => dispatch({ type: actionTypes.ADD_PLANO, payload }),
      updatePlano: (id, novosDados) => dispatch({ type: actionTypes.UPDATE_PLANO, payload: { id, ...novosDados } }),
      deletePlano: (id) => dispatch({ type: actionTypes.DELETE_PLANO, payload: id }),

      updateConfiguracoes: (payload) => dispatch({ type: actionTypes.UPDATE_CONFIGURACOES, payload }),
    }),
    []
  );

  const value = useMemo(
    () => ({ state, derived, actions }),
    [state, derived, actions]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useApp precisa ser usado dentro de <AppProvider>");
  return ctx;
}
