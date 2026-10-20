import { useWorkspace } from "./context/WorkspaceProvider.jsx";
import Equipe from "./components/features/settings/Equipe.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "./context/AppProvider";
import { FORMAS_PAGAMENTO, STATUS_COR } from "./data/constants";
import { hojePetshop, deslocarMes } from "./utils/format";

// Layout components
import { Menu, X } from "lucide-react";
import Sidebar from "./components/layout/Sidebar";

// Feature components
import Dashboard from "./components/features/Dashboard";
import Clientes from "./components/features/clientes/Clientes";
import Agendamentos from "./components/features/agendamentos/Agendamentos";
import Vendas from "./components/features/vendas/Vendas";
import Planos from "./components/features/planos/Planos";
import Financeiro from "./components/features/financeiro/Financeiro";
import Settings from "./components/features/settings/Settings";
import Estoque from "./components/features/estoque/Estoque";
import Relatorios from "./components/features/relatorios/Relatorios";

// Custom hooks
import { useCalendar } from "./hooks/useCalendar";

// A aba vive na URL: no celular o botão "voltar" é o gesto natural de
// navegação, e recarregar a página não pode jogar o usuário no Dashboard.
const ABAS = {
  dashboard: "Dashboard",
  agendamentos: "Agendamentos",
  clientes: "Clientes",
  vendas: "Vendas",
  estoque: "Estoque",
  financeiro: "Financeiro",
  relatorios: "Relatórios",
  planos: "Planos",
  settings: "Configurações",
  equipe: "Equipe",
  assinatura: "Assinatura do SaaS",
};

function abaDaUrl() {
  const alvo = window.location.hash.replace(/^#\/?/, "");
  return ABAS[alvo] ? alvo : "dashboard";
}

export default function PetshopSaaS() {
  const { state, derived, actions, loading, error, clearError, refetch } = useApp();
  const { manager, workspace } = useWorkspace();
  const vendaRequest = useRef(crypto.randomUUID());

  // Estado local de UI (não persiste)
  const [tab, setTab] = useState(abaDaUrl);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const aoMudarUrl = () => setTab(abaDaUrl());
    window.addEventListener("hashchange", aoMudarUrl);
    return () => window.removeEventListener("hashchange", aoMudarUrl);
  }, []);

  useEffect(() => {
    if (abaDaUrl() !== tab) window.location.hash = `#/${tab}`;
  }, [tab]);
  const [buscaCliente, setBuscaCliente] = useState("");

  // Formulários locais
  const [novoCliente, setNovoCliente] = useState({ nome: "", telefone: "" });

  const [novoAg, setNovoAg] = useState({
    petId: "",
    servico: "",
    data: "",
    hora: "",
    status: "Agendado",
    valor: 0,
  });

  const [novaVenda, setNovaVenda] = useState({
    clienteId: "",
    itemTipo: "",
    itemCustom: "",
    qtd: 1,
    valor: 0,
    formaPagamento: "Pix",
  });

  const { mesAtual, diaSelecionado, setDiaSelecionado, diasDoMes, prevMes, nextMes } = useCalendar();
  const [clienteParaAssinar, setClienteParaAssinar] = useState("");
  const [novaDespesa, setNovaDespesa] = useState({ descricao: "", valor: "", data: hojePetshop() });

  // Mês em foco no Financeiro (começa no mês corrente)
  const [mesFinanceiro, setMesFinanceiro] = useState(derived.mesAtualRef);
  const resumoFinanceiro = useMemo(
    () => derived.resumoFinanceiro(mesFinanceiro),
    [derived, mesFinanceiro]
  );

  // Evita duplicar registros no banco quando o usuário clica/toca duas vezes
  // rápido (comum no celular) enquanto a chamada ao Supabase ainda está em voo.
  const travasEmAndamento = useRef(new Set());
  async function umaVezPorVez(chave, fn) {
    if (travasEmAndamento.current.has(chave)) return;
    travasEmAndamento.current.add(chave);
    try { return await fn(); } finally { travasEmAndamento.current.delete(chave); }
  }

  // Handlers
  async function addCliente() {
    if (!novoCliente.nome) return;
    if (!await umaVezPorVez("addCliente", () => actions.addCliente(novoCliente))) return;
    setNovoCliente({ nome: "", telefone: "" });
  }

  function updateCliente(id, novosDados) {
    return actions.updateCliente(id, novosDados);
  }

  function delCliente(id) {
    return actions.deleteCliente(id);
  }

  async function addAg() {
    if (!novoAg.petId || !novoAg.data || !novoAg.hora) return;
    if (!await umaVezPorVez("addAg", () => actions.addAgendamento(novoAg))) return;
    setNovoAg({ petId: "", servico: "", data: "", hora: "", status: "Agendado", valor: 0 });
  }

  function delAg(id) {
    return actions.deleteAgendamento(id);
  }

  function cicloStatus(id) {
    return actions.cicloStatusAgendamento(id);
  }

  function addVacina(dados) {
    return umaVezPorVez("addVacina", () => actions.addVacina(dados));
  }

  function remarcarAg(id, { data, hora }) {
    return umaVezPorVez(`remarcarAg-${id}`, () => actions.remarcarAgendamento(id, { data, hora }));
  }

  async function addVenda() {
    // "produto:<id>" é um item do estoque; a venda dá baixa na quantidade.
    const produtoId = novaVenda.itemTipo.startsWith("produto:") ? novaVenda.itemTipo.slice("produto:".length) : null;
    const produto = produtoId ? state.produtos.find((p) => p.id === produtoId) : null;
    const item = produto ? produto.nome : novaVenda.itemTipo === "custom" ? novaVenda.itemCustom : novaVenda.itemTipo;
    if (!item || !novaVenda.valor) return;
    const ok = await umaVezPorVez("addVenda", () =>
      actions.addVenda({
        requestId: vendaRequest.current,
        clienteId: novaVenda.clienteId,
        item,
        qtd: Number(novaVenda.qtd) || 1,
        valor: Number(novaVenda.valor),
        formaPagamento: novaVenda.formaPagamento,
        produtoId: produto?.id,
      })
    );
    if (!ok) return;
    vendaRequest.current = crypto.randomUUID();
    setNovaVenda({
      clienteId: "",
      itemTipo: "",
      itemCustom: "",
      qtd: 1,
      valor: 0,
      formaPagamento: "Pix",
    });
  }

  function delVenda(id) {
    return actions.deleteVenda(id);
  }

  function assinarPlano(planoId) {
    if (!clienteParaAssinar) return;
    return umaVezPorVez(`assinarPlano-${planoId}`, () =>
      actions.addAssinatura({
        clienteId: clienteParaAssinar,
        planoId,
        dataInicio: hojePetshop(),
      })
    );
  }

  function cancelarAssinatura(id) {
    return actions.cancelAssinatura(id);
  }

  function gerarMensalidades(mesRef) {
    return umaVezPorVez(`gerarMensalidades-${mesRef}`, () => actions.gerarMensalidades(mesRef));
  }

  // Quantas assinaturas ativas já têm a cobrança do mês corrente gerada.
  const cobrancasDoMesAtual = useMemo(() => {
    const doMes = new Set(
      state.mensalidades.filter((m) => m.mesRef === derived.mesAtualRef).map((m) => m.assinaturaId)
    );
    return derived.assinaturasAtivas.filter((a) => doMes.has(a.id)).length;
  }, [state.mensalidades, derived.mesAtualRef, derived.assinaturasAtivas]);

  async function addDespesa() {
    if (!novaDespesa.descricao || !novaDespesa.valor) return;
    const ok = await umaVezPorVez("addDespesa", () =>
      actions.addDespesa({
        descricao: novaDespesa.descricao,
        valor: Number(novaDespesa.valor),
        data: novaDespesa.data,
      })
    );
    if (ok) setNovaDespesa({ descricao: "", valor: "", data: hojePetshop() });
  }

  function delDespesa(id) {
    return actions.deleteDespesa(id);
  }

  function abrirCliente(cliente) {
    if (!cliente) return;
    setTab("clientes");
    setBuscaCliente(cliente.nome);
  }

  // Derived values for components
  const contaNoDia = (dataStr) => state.agendamentos.filter((a) => a.data === dataStr).length;

  const tituloAba = ABAS[tab];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <Sidebar
        tab={tab}
        setTab={setTab}
        menuAberto={menuAberto}
        onFecharMenu={() => setMenuAberto(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Barra superior só no celular, onde a sidebar vira gaveta */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white border-b">
          <button
            onClick={() => setMenuAberto(true)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
            title="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <h1 className="font-semibold">{tituloAba}</h1>
        </header>

      <main className="flex-1 bg-white lg:border-l p-4 sm:p-6 overflow-auto">
        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start justify-between gap-3">
            <span>{error}</span><button className="underline" onClick={refetch}>Tentar novamente</button>
            <button onClick={clearError} className="shrink-0 p-0.5 hover:bg-red-100 rounded" title="Dispensar" aria-label="Dispensar erro">
              <X size={16} />
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : !state.ready ? (
          <p>Não foi possível carregar o petshop. Use “Tentar novamente” acima antes de continuar.</p>
        ) : (
          <>
        {!manager && ["settings","financeiro","relatorios","planos","equipe","assinatura"].includes(tab) && <p>Esta área é restrita à gestão.</p>}
        {tab === "equipe" && manager && <Equipe />}
        {tab === "assinatura" && manager && <section className="space-y-3"><h2 className="text-xl font-semibold">Assinatura do SaaS</h2><p>Status: {workspace.acesso}. Limite: {workspace.limite_membros} membros.</p><p>A cobrança online está desabilitada neste piloto. Os planos de clientes do petshop são gerenciados na aba Planos.</p></section>}
        {tab === "dashboard" && (
          <Dashboard
            clientes={state.clientes}
            pets={state.pets}
            agendamentosHoje={derived.agendamentosHoje}
            previstoHoje={derived.previstoHoje}
            resumoMes={derived.resumoMes}
            statusCor={STATUS_COR}
            petInfo={derived.petInfo}
            nomeCliente={derived.nomeCliente}
            clienteDoPet={derived.clienteDoPet}
            clientesParaReativar={derived.clientesParaReativar}
            vacinasAVencer={derived.vacinasAVencer}
            produtosBaixoEstoque={derived.produtosBaixoEstoque}
            onCicloStatus={cicloStatus}
            onAbrirCliente={abrirCliente}
            onAbrirEstoque={() => setTab("estoque")}
          />
        )}

        {tab === "settings" && manager && (
          <Settings
            servicos={state.servicos}
            planos={state.planos}
            assinaturas={derived.assinaturasAtivas}
            configuracoes={state.configuracoes}
            onAddServico={actions.addServico}
            onUpdateServico={actions.updateServico}
            onDeleteServico={actions.deleteServico}
            onAddPlano={actions.addPlano}
            onUpdatePlano={actions.updatePlano}
            onDeletePlano={actions.deletePlano}
            onUpdateConfiguracoes={actions.updateConfiguracoes}
          />
        )}

        {tab === "clientes" && (
          <Clientes
            clientes={state.clientes}
            pets={state.pets}
            agendamentos={state.agendamentos}
            hojeStr={derived.hojeStr}
            buscaCliente={buscaCliente}
            setBuscaCliente={setBuscaCliente}
            novoCliente={novoCliente}
            setNovoCliente={setNovoCliente}
            addCliente={addCliente}
            delCliente={delCliente}
            updateCliente={updateCliente}
            addPet={actions.addPet}
            delPet={actions.deletePet}
            updatePet={actions.updatePet}
            atualizarObs={actions.updatePetObservacoes}
            vacinas={state.vacinas}
            addVacina={addVacina}
            delVacina={actions.deleteVacina}
          />
        )}

        {tab === "agendamentos" && (
          <Agendamentos
            pets={state.pets}
            agendamentos={state.agendamentos}
            servicosPadrao={state.servicos}
            novoAg={novoAg}
            setNovoAg={setNovoAg}
            addAg={addAg}
            delAg={delAg}
            cicloStatus={cicloStatus}
            remarcarAg={remarcarAg}
            mesAtual={mesAtual}
            prevMes={prevMes}
            nextMes={nextMes}
            diaSelecionado={diaSelecionado}
            setDiaSelecionado={setDiaSelecionado}
            petInfo={derived.petInfo}
            nomeCliente={derived.nomeCliente}
            clienteDoPet={derived.clienteDoPet}
            contaNoDia={contaNoDia}
            statusCor={STATUS_COR}
            diasDoMes={diasDoMes}
            configuracoes={state.configuracoes}
          />
        )}

        {tab === "vendas" && (
          <Vendas
            clientes={state.clientes}
            vendas={state.vendas}
            servicosPadrao={state.servicos}
            produtos={state.produtos}
            formasPagamento={FORMAS_PAGAMENTO}
            novaVenda={novaVenda}
            setNovaVenda={setNovaVenda}
            addVenda={addVenda}
            delVenda={delVenda}
            totalVendasMes={derived.resumoMes.totalVendas}
            nomeCliente={derived.nomeCliente}
          />
        )}

        {tab === "estoque" && (
          <Estoque
            produtos={state.produtos}
            disponivel={state.estoqueDisponivel}
            onAdd={actions.addProduto}
            onUpdate={actions.updateProduto}
            onAjustar={actions.ajustarEstoque}
            onDelete={actions.deleteProduto}
          />
        )}

        {tab === "relatorios" && manager && <Relatorios state={state} derived={derived} />}

        {tab === "planos" && manager && (
          <Planos
            clientes={state.clientes}
            assinaturas={derived.assinaturasAtivas}
            planos={state.planos}
            clienteParaAssinar={clienteParaAssinar}
            setClienteParaAssinar={setClienteParaAssinar}
            assinarPlano={assinarPlano}
            cancelarAssinatura={cancelarAssinatura}
            nomeCliente={derived.nomeCliente}
            mensalidadesEmAberto={derived.mensalidadesEmAberto}
            mesAtualRef={derived.mesAtualRef}
            temCobrancaDoMes={cobrancasDoMesAtual}
            gerarMensalidades={gerarMensalidades}
            alternarPagamento={actions.alternarPagamentoMensalidade}
          />
        )}

        {tab === "financeiro" && manager && (
          <Financeiro
            novaDespesa={novaDespesa}
            setNovaDespesa={setNovaDespesa}
            addDespesa={addDespesa}
            delDespesa={delDespesa}
            resumo={resumoFinanceiro}
            mesRef={mesFinanceiro}
            onMesAnterior={() => setMesFinanceiro(deslocarMes(mesFinanceiro, -1))}
            onProximoMes={() => setMesFinanceiro(deslocarMes(mesFinanceiro, 1))}
            onVoltarMesAtual={() => setMesFinanceiro(derived.mesAtualRef)}
            ehMesAtual={mesFinanceiro >= derived.mesAtualRef}
          />
        )}
          </>
        )}
      </main>
      </div>
    </div>
  );
}
