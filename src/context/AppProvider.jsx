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
  vacinas: [],
  mensalidades: [],
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
const mapPet = (r) => ({ id: r.id, nome: r.nome, especie: r.especie, raca: r.raca, porte: r.porte, clienteId: r.cliente_id, observacoes: r.observacoes });
const mapServico = (r) => ({
  id: r.id,
  nome: r.nome,
  preco: Number(r.preco),
  precoPequeno: Number(r.preco_pequeno),
  precoGrande: Number(r.preco_grande),
  duracao: r.duracao,
});
const mapPlano = (r) => ({ id: r.id, slug: r.slug, nome: r.nome, descricao: r.descricao, preco: Number(r.preco) });
const mapAssinatura = (r) => ({ id: r.id, clienteId: r.cliente_id, planoId: r.plano_id, dataInicio: r.data_inicio, canceladaEm: r.cancelada_em });
const mapMensalidade = (r) => ({ id: r.id, assinaturaId: r.assinatura_id, mesRef: r.mes_ref, valor: Number(r.valor), status: r.status, dataPagamento: r.data_pagamento });
const mapAgendamento = (r) => ({ id: r.id, petId: r.pet_id, servico: r.servico, data: r.data, hora: (r.hora || "").slice(0, 5), status: r.status, valor: Number(r.valor) });
const mapVenda = (r) => ({ id: r.id, clienteId: r.cliente_id, item: r.item, qtd: r.qtd, valor: Number(r.valor), formaPagamento: r.forma_pagamento, data: (r.created_at || "").slice(0, 10) });
const mapDespesa = (r) => ({ id: r.id, descricao: r.descricao, valor: Number(r.valor), data: r.data });
const mapVacina = (r) => ({ id: r.id, petId: r.pet_id, nome: r.nome, dataAplicacao: r.data_aplicacao, proximaDose: r.proxima_dose });

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

    const [clientes, pets, servicos, planos, assinaturas, agendamentos, vendas, despesas, vacinas, mensalidades, config] = await Promise.all([
      supabase.from("clientes").select("*").order("nome"),
      supabase.from("pets").select("*").order("nome"),
      supabase.from("servicos").select("*").order("nome"),
      supabase.from("planos").select("*").order("preco"),
      supabase.from("assinaturas").select("*"),
      supabase.from("agendamentos").select("*").order("data").order("hora"),
      supabase.from("vendas").select("*").order("created_at", { ascending: false }),
      supabase.from("despesas").select("*").order("created_at", { ascending: false }),
      supabase.from("vacinas").select("*").order("proxima_dose"),
      supabase.from("mensalidades").select("*").order("mes_ref"),
      supabase.from("configuracoes").select("*").maybeSingle(),
    ]);

    const primeiroErro = [clientes, pets, servicos, planos, assinaturas, agendamentos, vendas, despesas, vacinas, mensalidades, config].find(
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
      vacinas: vacinas.data.map(mapVacina),
      mensalidades: mensalidades.data.map(mapMensalidade),
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
    const clienteDoPet = (petId) => {
      const pet = petInfo(petId);
      return pet ? state.clientes.find((c) => c.id === pet.clienteId) : null;
    };

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

      // Só entra como faturamento a mensalidade efetivamente recebida. Antes
      // toda assinatura ativa somava o valor cheio todo mês, paga ou não, e o
      // passado se reescrevia ao cancelar uma assinatura ou reajustar um plano.
      const mensalidadesDoMes = state.mensalidades.filter((m) => m.mesRef === mesRef);
      const totalPlanos = mensalidadesDoMes
        .filter((m) => m.status === "Pago")
        .reduce((s, m) => s + m.valor, 0);
      const totalPlanosAReceber = mensalidadesDoMes
        .filter((m) => m.status === "Pendente")
        .reduce((s, m) => s + m.valor, 0);

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
        totalPlanosAReceber,
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

    // Clientes que já vieram antes mas não voltam há um tempo (e não têm nada
    // marcado) — a lista de reativação que o dono usa para chamar no WhatsApp.
    const LIMITE_DIAS_SEM_RETORNO = 45;
    const diasEntre = (dataStr) =>
      Math.round((new Date(`${hojeStr}T00:00:00`) - new Date(`${dataStr}T00:00:00`)) / 86400000);

    const clientesParaReativar = state.clientes
      .map((cliente) => {
        const idsPets = new Set(state.pets.filter((p) => p.clienteId === cliente.id).map((p) => p.id));
        if (idsPets.size === 0) return null;

        const visitas = state.agendamentos.filter((a) => idsPets.has(a.petId) && a.status === "Concluído");
        if (visitas.length === 0) return null;

        const temFuturo = state.agendamentos.some(
          (a) => idsPets.has(a.petId) && a.status === "Agendado" && a.data >= hojeStr
        );
        if (temFuturo) return null;

        const ultima = visitas.reduce((max, a) => (a.data > max.data ? a : max));
        const dias = diasEntre(ultima.data);
        if (dias < LIMITE_DIAS_SEM_RETORNO) return null;

        return { cliente, pet: petInfo(ultima.petId), ultimaVisita: ultima, dias };
      })
      .filter(Boolean)
      .sort((a, b) => b.dias - a.dias);

    // Vacina vencida ou vencendo nas próximas semanas: é receita recorrente
    // que só acontece se alguém lembrar o dono a tempo.
    const DIAS_AVISO_VACINA = 30;
    const vacinasAVencer = state.vacinas
      .filter((v) => v.proximaDose && diasEntre(v.proximaDose) >= -DIAS_AVISO_VACINA)
      .map((v) => {
        const pet = petInfo(v.petId);
        return pet ? { vacina: v, pet, cliente: clienteDoPet(v.petId), dias: diasEntre(v.proximaDose) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.dias - a.dias);

    // Assinatura cancelada continua no banco pelo histórico, mas some das telas.
    const assinaturasAtivas = state.assinaturas.filter((a) => !a.canceladaEm);

    // Cobranças em aberto do mês corrente e dos anteriores: é a lista de
    // inadimplência que antes simplesmente não existia.
    const mensalidadesEmAberto = state.mensalidades
      .filter((m) => m.status === "Pendente" && m.mesRef <= mesAtualRef)
      .map((m) => {
        const assinatura = state.assinaturas.find((a) => a.id === m.assinaturaId);
        if (!assinatura) return null;
        return {
          mensalidade: m,
          cliente: state.clientes.find((c) => c.id === assinatura.clienteId),
          plano: state.planos.find((p) => p.id === assinatura.planoId),
          atrasada: m.mesRef < mesAtualRef,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.mensalidade.mesRef.localeCompare(b.mensalidade.mesRef));

    return {
      hoje,
      hojeStr,
      mesAtualRef,
      nomeCliente,
      petInfo,
      clienteDoPet,
      resumoFinanceiro,
      resumoMes,
      previstoHoje,
      agendamentosHoje,
      contaNoDia,
      clientesParaReativar,
      vacinasAVencer,
      assinaturasAtivas,
      mensalidadesEmAberto,
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
            vacinas: s.vacinas.filter((v) => !petsRemovidos.has(v.petId)),
          };
        });
      },

      addPet: async ({ nome, especie, raca, porte, clienteId }) => {
        const { data, error } = await supabase
          .from("pets")
          .insert({ nome, especie, raca, porte, cliente_id: clienteId, observacoes: "" })
          .select()
          .single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, pets: [...s.pets, mapPet(data)] }));
      },

      updatePet: async (id, { nome, especie, raca, porte }) => {
        const { data, error } = await supabase.from("pets").update({ nome, especie, raca, porte }).eq("id", id).select().single();
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
          vacinas: s.vacinas.filter((v) => v.petId !== id),
        }));
      },

      updatePetObservacoes: async (id, observacoes) => {
        const { data, error } = await supabase.from("pets").update({ observacoes }).eq("id", id).select().single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, pets: s.pets.map((p) => (p.id === id ? mapPet(data) : p)) }));
      },

      addVacina: async ({ petId, nome, dataAplicacao, proximaDose }) => {
        const { data, error } = await supabase
          .from("vacinas")
          .insert({ pet_id: petId, nome, data_aplicacao: dataAplicacao, proxima_dose: proximaDose || null })
          .select()
          .single();
        if (error) return setError(error.message);
        setState((s) => {
          const vacinas = [...s.vacinas, mapVacina(data)].sort((a, b) =>
            (a.proximaDose || "9999").localeCompare(b.proximaDose || "9999")
          );
          return { ...s, vacinas };
        });
      },

      deleteVacina: async (id) => {
        const { error } = await supabase.from("vacinas").delete().eq("id", id);
        if (error) return setError(error.message);
        setState((s) => ({ ...s, vacinas: s.vacinas.filter((v) => v.id !== id) }));
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

      // Remarcar: cliente ligar para mudar o horário é rotina, e antes só dava
      // para apagar e refazer o agendamento do zero.
      remarcarAgendamento: async (id, { data, hora }) => {
        const { data: row, error } = await supabase
          .from("agendamentos")
          .update({ data, hora, status: "Agendado" })
          .eq("id", id)
          .select()
          .single();
        if (error) return setError(error.message);
        setState((s) => {
          const agendamentos = s.agendamentos
            .map((a) => (a.id === id ? mapAgendamento(row) : a))
            .sort((a, b) => `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`));
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

      // Cancelar marca a data de saída em vez de apagar: as mensalidades já
      // pagas continuam contando no mês em que foram recebidas.
      cancelAssinatura: async (id) => {
        const hoje = new Date().toISOString().slice(0, 10);
        const { data, error } = await supabase
          .from("assinaturas")
          .update({ cancelada_em: hoje })
          .eq("id", id)
          .select()
          .single();
        if (error) return setError(error.message);
        setState((s) => ({
          ...s,
          assinaturas: s.assinaturas.map((a) => (a.id === id ? mapAssinatura(data) : a)),
          // Cobrança ainda em aberto de assinatura cancelada deixa de fazer sentido.
          mensalidades: s.mensalidades.filter((m) => !(m.assinaturaId === id && m.status === "Pendente")),
        }));
        await supabase.from("mensalidades").delete().eq("assinatura_id", id).eq("status", "Pendente");
      },

      // Gera a cobrança do mês para cada assinatura ativa que ainda não tem uma.
      gerarMensalidades: async (mesRef) => {
        const { assinaturas, planos, mensalidades } = stateRef.current;
        const jaTem = new Set(mensalidades.filter((m) => m.mesRef === mesRef).map((m) => m.assinaturaId));
        const fimDoMes = `${mesRef}-31`;

        const novas = assinaturas
          .filter((a) => !jaTem.has(a.id) && (a.dataInicio || "") <= fimDoMes)
          .filter((a) => !a.canceladaEm || a.canceladaEm.slice(0, 7) >= mesRef)
          .map((a) => ({
            assinatura_id: a.id,
            mes_ref: mesRef,
            valor: planos.find((p) => p.id === a.planoId)?.preco || 0,
            status: "Pendente",
          }));
        if (novas.length === 0) return;

        const { data, error } = await supabase.from("mensalidades").insert(novas).select();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, mensalidades: [...s.mensalidades, ...data.map(mapMensalidade)] }));
      },

      alternarPagamentoMensalidade: async (id) => {
        const atual = stateRef.current.mensalidades.find((m) => m.id === id);
        if (!atual) return;
        const virandoPago = atual.status === "Pendente";
        const { data, error } = await supabase
          .from("mensalidades")
          .update({
            status: virandoPago ? "Pago" : "Pendente",
            data_pagamento: virandoPago ? new Date().toISOString().slice(0, 10) : null,
          })
          .eq("id", id)
          .select()
          .single();
        if (error) return setError(error.message);
        setState((s) => ({
          ...s,
          mensalidades: s.mensalidades.map((m) => (m.id === id ? mapMensalidade(data) : m)),
        }));
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

      addServico: async ({ nome, preco, precoPequeno, precoGrande, duracao }) => {
        const { data, error } = await supabase
          .from("servicos")
          .insert({ nome, preco, preco_pequeno: precoPequeno, preco_grande: precoGrande, duracao })
          .select()
          .single();
        if (error) return setError(error.message);
        setState((s) => ({ ...s, servicos: [...s.servicos, mapServico(data)] }));
      },

      updateServico: async (id, { nome, preco, precoPequeno, precoGrande, duracao }) => {
        const { data, error } = await supabase
          .from("servicos")
          .update({ nome, preco, preco_pequeno: precoPequeno, preco_grande: precoGrande, duracao })
          .eq("id", id)
          .select()
          .single();
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
            porte: p.porte,
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
