import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../services/supabaseClient.jsx";
import { useAuth } from "./AuthProvider.jsx";
import { FORMAS_PAGAMENTO } from "../data/constants.jsx";
import { formatDate } from "../utils/format.jsx";
import { buildSeedData } from "../data/seedData.jsx";

const AppStateContext = createContext(null);

const ORDEM_STATUS = ["Agendado", "Concluído", "Cancelado"];

const ESTADO_VAZIO = {
  clientes: [],
  pets: [],
  agendamentos: [],
  vendas: [],
  assinaturas: [],
  despesas: [],
  servicos: [],
  planos: [],
  configuracoes: { horarioAbertura: 8, horarioFechamento: 18 },
};

function slugify(texto) {
  return (
    (texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "plano"
  );
}

// --- Mapeamento DB (snake_case) <-> estado do app (camelCase) ---
const mapCliente = (r) => ({ id: r.id, nome: r.nome, telefone: r.telefone });
const mapPet = (r) => ({ id: r.id, nome: r.nome, especie: r.especie, raca: r.raca, clienteId: r.cliente_id, observacoes: r.observacoes });
const mapServico = (r) => ({ id: r.id, nome: r.nome, preco: Number(r.preco), duracao: r.duracao });
const mapPlano = (r) => ({ id: r.id, slug: r.slug, nome: r.nome, descricao: r.descricao, preco: Number(r.preco) });
const mapAssinatura = (r) => ({ id: r.id, clienteId: r.cliente_id, planoId: r.plano_id, dataInicio: r.data_inicio });
const mapAgendamento = (r) => ({ id: r.id, petId: r.pet_id, servico: r.servico, data: r.data, hora: (r.hora || "").slice(0, 5), status: r.status, valor: Number(r.valor) });
const mapVenda = (r) => ({ id: r.id, clienteId: r.cliente_id, item: r.item, qtd: r.qtd, valor: Number(r.valor), formaPagamento: r.forma_pagamento, data: (r.created_at || "").slice(0, 10) });
const mapDespesa = (r) => ({ id: r.id, descricao: r.descricao, valor: Number(r.valor), data: r.data });

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(ESTADO_VAZIO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Permite que ações leiam o estado mais recente sem precisar recriar
  // a referência de `actions` a cada mudança de estado.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    const [clientes, pets, servicos, planos, assinaturas, agendamentos, vendas, despesas, config] = await Promise.all([
      supabase.from("clientes").select("*").order("nome"),
      supabase.from("pets").select("*").order("nome"),
      supabase.from("servicos").select("*").order("nome"),
      supabase.from("planos").select("*").order("preco"),
      supabase.from("assinaturas").select("*"),
      supabase.from("agendamentos").select("*").order("data").order("hora"),
      supabase.from("vendas").select("*").order("created_at", { ascending: false }),
      supabase.from("despesas").select("*").order("created_at", { ascending: false }),
      supabase.from("configuracoes").select("*").maybeSingle(),
    ]);

    const primeiroErro = [clientes, pets, servicos, planos, assinaturas, agendamentos, vendas, despesas, config].find(
      (r) => r.error
    );
    if (primeiroErro) {
      setError(primeiroErro.error.message);
      setLoading(false);
      return;
    }

    setState({
      clientes: clientes.data.map(mapCliente),
      pets: pets.data.map(mapPet),
      servicos: servicos.data.map(mapServico),
      planos: planos.data.map(mapPlano),
      assinaturas: assinaturas.data.map(mapAssinatura),
      agendamentos: agendamentos.data.map(mapAgendamento),
      vendas: vendas.data.map(mapVenda),
      despesas: despesas.data.map(mapDespesa),
      configuracoes: config.data
        ? { horarioAbertura: config.data.horario_abertura, horarioFechamento: config.data.horario_fechamento }
        : { horarioAbertura: 8, horarioFechamento: 18 },
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchAll();
  }, [user, fetchAll]);

  // --- Dados derivados ---
  const derived = useMemo(() => {
    const hoje = new Date();
    const hojeStr = formatDate(hoje);

    const nomeCliente = (id) => state.clientes.find((c) => c.id === id)?.nome || "—";
    const petInfo = (id) => state.pets.find((p) => p.id === id);

    // Resumo financeiro de um mês ("YYYY-MM"). O faturamento de um petshop vem
    // principalmente dos serviços prestados, então agendamentos concluídos
    // contam como entrada — sem exigir que o dono registre a mesma coisa duas
    // vezes (uma no agendamento, outra em vendas).
    const resumoFinanceiro = (mesRef) => {
      const doMes = (dataStr) => (dataStr || "").startsWith(mesRef);

      const servicosConcluidos = state.agendamentos.filter((a) => a.status === "Concluído" && doMes(a.data));
      const totalServicos = servicosConcluidos.reduce((s, a) => s + a.valor, 0);

      const vendasDoMes = state.vendas.filter((v) => doMes(v.data));
      const totalVendas = vendasDoMes.reduce((s, v) => s + v.qtd * v.valor, 0);

      // Uma assinatura gera receita recorrente em todo mês a partir do início.
      const fimDoMes = `${mesRef}-31`;
      const totalPlanos = state.assinaturas
        .filter((a) => (a.dataInicio || "") <= fimDoMes)
        .reduce((s, a) => s + (state.planos.find((p) => p.id === a.planoId)?.preco || 0), 0);

      const despesasDoMes = state.despesas.filter((d) => doMes(d.data));
      const totalDespesas = despesasDoMes.reduce((s, d) => s + d.valor, 0);

      const totalEntradas = totalServicos + totalVendas + totalPlanos;

      const totalPorPagamento = FORMAS_PAGAMENTO.map((forma) => ({
        forma,
        total: vendasDoMes
          .filter((v) => v.formaPagamento === forma)
          .reduce((s, v) => s + v.qtd * v.valor, 0),
      }));

      return {
        totalServicos,
        totalVendas,
        totalPlanos,
        totalEntradas,
        totalDespesas,
        saldo: totalEntradas - totalDespesas,
        totalPorPagamento,
        despesasDoMes,
        qtdServicos: servicosConcluidos.length,
        ticketMedio: servicosConcluidos.length ? totalServicos / servicosConcluidos.length : 0,
      };
    };

    const mesAtualRef = hojeStr.slice(0, 7);
    const resumoMes = resumoFinanceiro(mesAtualRef);

    const agendamentosHoje = state.agendamentos.filter((a) => a.data === hojeStr);
    const contaNoDia = (dataStr) => state.agendamentos.filter((a) => a.data === dataStr).length;

    // Previsto para hoje: o que ainda não foi cancelado.
    const previstoHoje = agendamentosHoje
      .filter((a) => a.status !== "Cancelado")
      .reduce((s, a) => s + a.valor, 0);

    return {
      hoje,
      hojeStr,
      mesAtualRef,
      nomeCliente,
      petInfo,
      resumoFinanceiro,
      resumoMes,
      previstoHoje,
      agendamentosHoje,
      contaNoDia,
    };
  }, [state]);

  // --- Ações (cada uma escreve no Supabase e depois atualiza o cache local) ---
  const actions = useMemo(
    () => ({
      addCliente: async ({ nome, telefone }) => {
        const { data, error } = await supabase.from("clientes").insert({ nome, telefone }).select().single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, clientes: [...s.clientes, mapCliente(data)] }));
      },

      updateCliente: async (id, { nome, telefone }) => {
        const { data, error } = await supabase.from("clientes").update({ nome, telefone }).eq("id", id).select().single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, clientes: s.clientes.map((c) => (c.id === id ? mapCliente(data) : c)) }));
      },

      deleteCliente: async (id) => {
        const { error } = await supabase.from("clientes").delete().eq("id", id);
        if (error) return setError(error.message);
        setState((s) => {
          const petsRemovidos = new Set(s.pets.filter((p) => p.clienteId === id).map((p) => p.id));
          return {
            ...s,
            clientes: s.clientes.filter((c) => c.id !== id),
            pets: s.pets.filter((p) => p.clienteId !== id),
            assinaturas: s.assinaturas.filter((a) => a.clienteId !== id),
            vendas: s.vendas.map((v) => (v.clienteId === id ? { ...v, clienteId: null } : v)),
            agendamentos: s.agendamentos.filter((a) => !petsRemovidos.has(a.petId)),
          };
        });
      },

      addPet: async ({ nome, especie, raca, clienteId }) => {
        const { data, error } = await supabase
          .from("pets")
          .insert({ nome, especie, raca, cliente_id: clienteId, observacoes: "" })
          .select()
          .single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, pets: [...s.pets, mapPet(data)] }));
      },

      updatePet: async (id, { nome, especie, raca }) => {
        const { data, error } = await supabase.from("pets").update({ nome, especie, raca }).eq("id", id).select().single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, pets: s.pets.map((p) => (p.id === id ? mapPet(data) : p)) }));
      },

      deletePet: async (id) => {
        const { error } = await supabase.from("pets").delete().eq("id", id);
        if (error) return setError(error.message);
        setState((s) => ({
          ...s,
          pets: s.pets.filter((p) => p.id !== id),
          agendamentos: s.agendamentos.filter((a) => a.petId !== id),
        }));
      },

      updatePetObservacoes: async (id, observacoes) => {
        const { data, error } = await supabase.from("pets").update({ observacoes }).eq("id", id).select().single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, pets: s.pets.map((p) => (p.id === id ? mapPet(data) : p)) }));
      },

      addAgendamento: async ({ petId, servico, data, hora, status, valor }) => {
        const { data: row, error } = await supabase
          .from("agendamentos")
          .insert({ pet_id: petId, servico, data, hora, status: status || "Agendado", valor: Number(valor) || 0 })
          .select()
          .single();
        if (error) return setError(error.message);
        setState((s) => {
          const novo = mapAgendamento(row);
          const agendamentos = [...s.agendamentos, novo].sort((a, b) => `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`));
          return { ...s, agendamentos };
        });
      },

      deleteAgendamento: async (id) => {
        const { error } = await supabase.from("agendamentos").delete().eq("id", id);
        if (error) return setError(error.message);
        setState((s) => ({ ...s, agendamentos: s.agendamentos.filter((a) => a.id !== id) }));
      },

      cicloStatusAgendamento: async (id) => {
        const atual = stateRef.current.agendamentos.find((a) => a.id === id);
        if (!atual) return;
        const novoStatus = ORDEM_STATUS[(ORDEM_STATUS.indexOf(atual.status) + 1) % ORDEM_STATUS.length];
        const { data, error } = await supabase.from("agendamentos").update({ status: novoStatus }).eq("id", id).select().single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, agendamentos: s.agendamentos.map((a) => (a.id === id ? mapAgendamento(data) : a)) }));
      },

      addVenda: async ({ clienteId, item, qtd, valor, formaPagamento }) => {
        const { data, error } = await supabase
          .from("vendas")
          .insert({ cliente_id: clienteId || null, item, qtd, valor, forma_pagamento: formaPagamento })
          .select()
          .single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, vendas: [mapVenda(data), ...s.vendas] }));
      },

      deleteVenda: async (id) => {
        const { error } = await supabase.from("vendas").delete().eq("id", id);
        if (error) return setError(error.message);
        setState((s) => ({ ...s, vendas: s.vendas.filter((v) => v.id !== id) }));
      },

      addAssinatura: async ({ clienteId, planoId, dataInicio }) => {
        const { data, error } = await supabase
          .from("assinaturas")
          .insert({ cliente_id: clienteId, plano_id: planoId, data_inicio: dataInicio })
          .select()
          .single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, assinaturas: [...s.assinaturas, mapAssinatura(data)] }));
      },

      cancelAssinatura: async (id) => {
        const { error } = await supabase.from("assinaturas").delete().eq("id", id);
        if (error) return setError(error.message);
        setState((s) => ({ ...s, assinaturas: s.assinaturas.filter((a) => a.id !== id) }));
      },

      addDespesa: async ({ descricao, valor, data }) => {
        const { data: row, error } = await supabase.from("despesas").insert({ descricao, valor, data }).select().single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, despesas: [mapDespesa(row), ...s.despesas] }));
      },

      deleteDespesa: async (id) => {
        const { error } = await supabase.from("despesas").delete().eq("id", id);
        if (error) return setError(error.message);
        setState((s) => ({ ...s, despesas: s.despesas.filter((d) => d.id !== id) }));
      },

      addServico: async ({ nome, preco, duracao }) => {
        const { data, error } = await supabase.from("servicos").insert({ nome, preco, duracao }).select().single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, servicos: [...s.servicos, mapServico(data)] }));
      },

      updateServico: async (id, { nome, preco, duracao }) => {
        const { data, error } = await supabase.from("servicos").update({ nome, preco, duracao }).eq("id", id).select().single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, servicos: s.servicos.map((sv) => (sv.id === id ? mapServico(data) : sv)) }));
      },

      deleteServico: async (id) => {
        const { error } = await supabase.from("servicos").delete().eq("id", id);
        if (error) return setError(error.message);
        setState((s) => ({ ...s, servicos: s.servicos.filter((sv) => sv.id !== id) }));
      },

      addPlano: async ({ nome, descricao, preco }) => {
        const slug = `${slugify(nome)}-${Math.random().toString(36).slice(2, 6)}`;
        const { data, error } = await supabase.from("planos").insert({ slug, nome, descricao, preco }).select().single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, planos: [...s.planos, mapPlano(data)] }));
      },

      updatePlano: async (id, { nome, descricao, preco }) => {
        const { data, error } = await supabase.from("planos").update({ nome, descricao, preco }).eq("id", id).select().single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, planos: s.planos.map((p) => (p.id === id ? mapPlano(data) : p)) }));
      },

      deletePlano: async (id) => {
        const { error } = await supabase.from("planos").delete().eq("id", id);
        if (error) return setError(error.message);
        setState((s) => ({
          ...s,
          planos: s.planos.filter((p) => p.id !== id),
          assinaturas: s.assinaturas.filter((a) => a.planoId !== id),
        }));
      },

      updateConfiguracoes: async ({ horarioAbertura, horarioFechamento }) => {
        const { data, error } = await supabase
          .from("configuracoes")
          .upsert(
            { owner_id: user.id, horario_abertura: horarioAbertura, horario_fechamento: horarioFechamento },
            { onConflict: "owner_id" }
          )
          .select()
          .single();
        if (error) return setError(error.message);
        setState((s) => ({
          ...s,
          configuracoes: { horarioAbertura: data.horario_abertura, horarioFechamento: data.horario_fechamento },
        }));
      },

      // Substitui os dados transacionais do usuário por um conjunto fictício,
      // só para demonstração. Serviços e planos padrão (semeados no cadastro) são mantidos.
      loadDemoData: async () => {
        if (!user) return;
        setLoading(true);
        setError("");
        try {
          const seed = buildSeedData();

          await supabase.from("clientes").delete().eq("owner_id", user.id);
          await supabase.from("vendas").delete().eq("owner_id", user.id);
          await supabase.from("despesas").delete().eq("owner_id", user.id);

          const { data: planosAtuais, error: planosErr } = await supabase
            .from("planos")
            .select("id, slug")
            .eq("owner_id", user.id);
          if (planosErr) throw planosErr;
          const planoIdPorSlug = Object.fromEntries(planosAtuais.map((p) => [p.slug, p.id]));

          const clientesParaInserir = seed.clientes.map(({ id, ...c }) => c);
          const { data: clientesInseridos, error: clientesErr } = await supabase
            .from("clientes")
            .insert(clientesParaInserir)
            .select();
          if (clientesErr) throw clientesErr;
          const clienteIdMap = {};
          seed.clientes.forEach((c, i) => {
            clienteIdMap[c.id] = clientesInseridos[i].id;
          });

          const petsParaInserir = seed.pets.map((p) => ({
            nome: p.nome,
            especie: p.especie,
            raca: p.raca,
            observacoes: p.observacoes,
            cliente_id: clienteIdMap[p.clienteId],
          }));
          const { data: petsInseridos, error: petsErr } = await supabase.from("pets").insert(petsParaInserir).select();
          if (petsErr) throw petsErr;
          const petIdMap = {};
          seed.pets.forEach((p, i) => {
            petIdMap[p.id] = petsInseridos[i].id;
          });

          const agendamentosParaInserir = seed.agendamentos.map((a) => ({
            pet_id: petIdMap[a.petId],
            servico: a.servico,
            data: a.data,
            hora: a.hora,
            status: a.status,
            valor: a.valor,
          }));
          const { error: agErr } = await supabase.from("agendamentos").insert(agendamentosParaInserir);
          if (agErr) throw agErr;

          const vendasParaInserir = seed.vendas.map((v) => ({
            cliente_id: clienteIdMap[v.clienteId] || null,
            item: v.item,
            qtd: v.qtd,
            valor: v.valor,
            forma_pagamento: v.formaPagamento,
          }));
          const { error: vendasErr } = await supabase.from("vendas").insert(vendasParaInserir);
          if (vendasErr) throw vendasErr;

          const assinaturasParaInserir = seed.assinaturas
            .filter((a) => clienteIdMap[a.clienteId] && planoIdPorSlug[a.planoId])
            .map((a) => ({
              cliente_id: clienteIdMap[a.clienteId],
              plano_id: planoIdPorSlug[a.planoId],
              data_inicio: a.dataInicio,
            }));
          if (assinaturasParaInserir.length > 0) {
            const { error: assErr } = await supabase.from("assinaturas").insert(assinaturasParaInserir);
            if (assErr) throw assErr;
          }

          const despesasParaInserir = seed.despesas.map(({ id, ...d }) => d);
          const { error: despesasErr } = await supabase.from("despesas").insert(despesasParaInserir);
          if (despesasErr) throw despesasErr;

          await fetchAll();
        } catch (err) {
          setError(err.message || "Erro ao carregar dados de demonstração");
          setLoading(false);
        }
      },
    }),
    [user, fetchAll]
  );

  const value = useMemo(
    () => ({ state, derived, actions, loading, error, refetch: fetchAll }),
    [state, derived, actions, loading, error, fetchAll]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useApp precisa ser usado dentro de <AppProvider>");
  return ctx;
}
