import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../services/supabaseClient.jsx";
import { resumoDoMes } from "../utils/financeiro.js";
import { FORMAS_PAGAMENTO } from "../data/constants.jsx";
import { hojePetshop } from "../utils/format.jsx";
import { readAll, runActions } from "../services/data.js";
import { useWorkspace } from "./WorkspaceProvider.jsx";

const AppStateContext = createContext(null);



const ESTADO_VAZIO = {
  ready: false,
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
  produtos: [],
  // false enquanto a migration de estoque não foi aplicada no banco: o resto do
  // app continua funcionando e a aba Estoque explica o que falta.
  estoqueDisponivel: true,
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
const mapAgendamento = (r) => ({ id: r.id, petId: r.pet_id, servico: r.servico, data: r.data, hora: (r.hora || "").slice(0, 5), status: r.status, valor: Number(r.valor), duracao: r.duracao });
const mapVenda = (r) => ({ id: r.id, clienteId: r.cliente_id, item: r.item, qtd: r.qtd, valor: Number(r.valor), formaPagamento: r.forma_pagamento, data: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(r.created_at)) });
const mapDespesa = (r) => ({ id: r.id, descricao: r.descricao, valor: Number(r.valor), data: r.data });
const mapVacina = (r) => ({ id: r.id, petId: r.pet_id, nome: r.nome, dataAplicacao: r.data_aplicacao, proximaDose: r.proxima_dose });
const mapProduto = (r) => ({
  id: r.id,
  nome: r.nome,
  categoria: r.categoria || "",
  quantidade: r.quantidade,
  estoqueMinimo: r.estoque_minimo,
  precoCusto: Number(r.preco_custo),
  precoVenda: Number(r.preco_venda),
});


export function AppProvider({ children }) {
  const { workspace } = useWorkspace();
  const tenant = workspace.owner_id;
  const [state, setState] = useState(ESTADO_VAZIO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const fetchAll = useCallback(async () => {
    try {
      const tables = ["clientes","pets","servicos","planos","assinaturas","agendamentos","vendas","despesas","vacinas","mensalidades","produtos"];
      const maps = [mapCliente,mapPet,mapServico,mapPlano,mapAssinatura,mapAgendamento,mapVenda,mapDespesa,mapVacina,mapMensalidade,mapProduto];
      const results = await Promise.all(tables.map(t => readAll(t,tenant)));
      const cfg = await supabase.from("configuracoes").select("*").eq("owner_id",tenant).maybeSingle();
      const failed = [...results,cfg].find(r => r.error);
      if (failed) throw failed.error;
      const next = Object.fromEntries(tables.map((t,i) => [t,results[i].data.filter(r => !r.cancelada_em || t === "assinaturas").map(maps[i])]));
      next.agendamentos.sort((a,b) => (a.data+a.hora).localeCompare(b.data+b.hora));
      next.vendas.sort((a,b) => b.data.localeCompare(a.data));
      for (const t of ["clientes","pets","servicos","produtos"]) next[t].sort((a,b) => a.nome.localeCompare(b.nome,"pt-BR"));
      next.configuracoes = { horarioAbertura: cfg.data?.horario_abertura ?? 8, horarioFechamento: cfg.data?.horario_fechamento ?? 18 };
      next.estoqueDisponivel = true;
      next.ready = true;
      setState(next); setError("");
      return true;
    } catch (e) { setError(e.message || "Não foi possível carregar os dados."); return false; }
    finally { setLoading(false); }
  },[tenant]);
  useEffect(() => { fetchAll(); },[fetchAll]);
  // --- Dados derivados ---
  const derived = useMemo(() => {
    const hoje = new Date();
    const hojeStr = hojePetshop();

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
    const resumoFinanceiro = mesRef => resumoDoMes(state,mesRef,FORMAS_PAGAMENTO);

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

    // Produto no mínimo (ou abaixo) precisa de reposição — vem primeiro o que já zerou.
    const produtosBaixoEstoque = state.produtos
      .filter((p) => p.quantidade <= p.estoqueMinimo)
      .sort((a, b) => a.quantidade - b.quantidade);

    return {
      hoje,
      hojeStr,
      produtosBaixoEstoque,
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


  const actions = useMemo(() => {
    const save = async query => { const {error} = await query; if (error) throw error; await fetchAll(); };
    const attempts = new Map();
    const insert = async (table,data) => {
      const key = table + JSON.stringify(data);
      const id = attempts.get(key) || crypto.randomUUID();
      attempts.set(key,id);
      const { error } = await supabase.from(table).insert({ ...data,id }).select().single();
      if (error) {
        // Resposta perdida após commit: confirmar o mesmo UUID antes de repetir a criação.
        const existing = await supabase.from(table).select("id").eq("id",id).maybeSingle();
        if (existing.error || !existing.data) throw error;
      }
      attempts.delete(key);
      await fetchAll();
    };
    const update = (table,id,data) => save(supabase.from(table).update(data).eq("id",id).select().single());
    const remove = (table,id) => save(supabase.from(table).delete().eq("id",id).select().single());
    return runActions({
      addCliente: ({nome,telefone}) => insert("clientes",{nome,telefone}),
      updateCliente: (id,{nome,telefone}) => update("clientes",id,{nome,telefone}),
      deleteCliente: id => remove("clientes",id),
      addPet: ({nome,especie,raca,porte,clienteId}) => insert("pets",{nome,especie,raca,porte,cliente_id:clienteId,observacoes:""}),
      updatePet: (id,{nome,especie,raca,porte}) => update("pets",id,{nome,especie,raca,porte}),
      deletePet: id => remove("pets",id),
      updatePetObservacoes: (id,observacoes) => update("pets",id,{observacoes}),
      addVacina: ({petId,nome,dataAplicacao,proximaDose}) => insert("vacinas",{pet_id:petId,nome,data_aplicacao:dataAplicacao,proxima_dose:proximaDose||null}),
      deleteVacina: id => remove("vacinas",id),
      addAgendamento: ({petId,servico,data,hora,status,valor}) => insert("agendamentos",{pet_id:petId,servico,data,hora,status:status||"Agendado",valor:Number(valor)}),
      remarcarAgendamento: (id,{data,hora}) => update("agendamentos",id,{data,hora,status:"Agendado"}),
      deleteAgendamento: id => update("agendamentos",id,{status:"Cancelado"}),
      cicloStatusAgendamento: id => {
        const atual=stateRef.current.agendamentos.find(a=>a.id===id);
        if (!atual || atual.status === "Concluído") return;
        return update("agendamentos",id,{status:atual.status === "Cancelado" ? "Agendado" : "Concluído"});
      },
      addVenda: ({clienteId,item,qtd,valor,formaPagamento,produtoId,requestId}) => save(supabase.rpc("registrar_venda",{
        p_request:requestId,p_cliente:clienteId||null,p_item:item,p_qtd:qtd,p_valor:valor,p_forma:formaPagamento,p_produto:produtoId||null,
      })),
      deleteVenda: id => save(supabase.rpc("cancelar_venda",{p_id:id})),
      addProduto: ({nome,categoria,quantidade,estoqueMinimo,precoCusto,precoVenda}) => insert("produtos",{nome,categoria,quantidade,estoque_minimo:estoqueMinimo,preco_custo:precoCusto,preco_venda:precoVenda}),
      updateProduto: (id,{nome,categoria,estoqueMinimo,precoCusto,precoVenda}) => update("produtos",id,{nome,categoria,estoque_minimo:estoqueMinimo,preco_custo:precoCusto,preco_venda:precoVenda}),
      ajustarEstoque: async (id,delta) => {
        const key = `estoque:${id}:${delta}`;
        const request = attempts.get(key) || crypto.randomUUID();
        attempts.set(key,request);
        const { error } = await supabase.rpc("ajustar_estoque",{p_id:id,p_delta:delta,p_request:request});
        if (error) throw error;
        attempts.delete(key);
        await fetchAll();
      },
      deleteProduto: id => remove("produtos",id),
      addAssinatura: ({clienteId,planoId,dataInicio}) => insert("assinaturas",{cliente_id:clienteId,plano_id:planoId,data_inicio:dataInicio}),
      cancelAssinatura: id => update("assinaturas",id,{cancelada_em:hojePetshop()}),
      gerarMensalidades: mes => save(supabase.rpc("gerar_mensalidades",{p_mes:mes})),
      alternarPagamentoMensalidade: id => {
        const atual=stateRef.current.mensalidades.find(m=>m.id===id); if (!atual) return;
        const pago=atual.status!=="Pago";
        return update("mensalidades",id,{status:pago?"Pago":"Pendente",data_pagamento:pago?hojePetshop():null});
      },
      addDespesa: ({descricao,valor,data}) => insert("despesas",{descricao,valor,data}),
      deleteDespesa: id => save(supabase.rpc("cancelar_despesa",{p_id:id})),
      addServico: ({nome,preco,precoPequeno,precoGrande,duracao}) => insert("servicos",{nome,preco,preco_pequeno:precoPequeno,preco_grande:precoGrande,duracao}),
      updateServico: (id,{nome,preco,precoPequeno,precoGrande,duracao}) => update("servicos",id,{nome,preco,preco_pequeno:precoPequeno,preco_grande:precoGrande,duracao}),
      deleteServico: id => remove("servicos",id),
      addPlano: ({nome,descricao,preco}) => insert("planos",{slug:slugify(nome)+"-"+crypto.randomUUID(),nome,descricao,preco}),
      updatePlano: (id,{nome,descricao,preco}) => update("planos",id,{nome,descricao,preco}),
      deletePlano: id => remove("planos",id),
      updateConfiguracoes: ({horarioAbertura,horarioFechamento}) => save(supabase.from("configuracoes").upsert({owner_id:tenant,horario_abertura:horarioAbertura,horario_fechamento:horarioFechamento},{onConflict:"owner_id"}).select().single()),
    },setError);
  },[tenant,fetchAll]);
  const value = {state,derived,actions,loading,error,clearError:()=>setError(""),refetch:fetchAll};
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
export function useApp() {
  const ctx=useContext(AppStateContext); if (!ctx) throw new Error("useApp precisa de AppProvider"); return ctx;
}
