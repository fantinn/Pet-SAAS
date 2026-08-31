import { useMemo, useState } from "react";
import { useApp } from "./context/AppProvider";
import { FORMAS_PAGAMENTO, STATUS_COR } from "./data/constants";
import { formatDate, deslocarMes } from "./utils/format";

// Layout components
import Sidebar from "./components/layout/Sidebar";

// Feature components
import Dashboard from "./components/features/Dashboard";
import Clientes from "./components/features/clientes/Clientes";
import Agendamentos from "./components/features/agendamentos/Agendamentos";
import Vendas from "./components/features/vendas/Vendas";
import Planos from "./components/features/planos/Planos";
import Financeiro from "./components/features/financeiro/Financeiro";
import Settings from "./components/features/settings/Settings";

// Custom hooks
import { useCalendar } from "./hooks/useCalendar";

export default function PetshopSaaS() {
  const { state, derived, actions, loading, error } = useApp();

  // Estado local de UI (não persiste)
  const [tab, setTab] = useState("dashboard");
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
  const [novaDespesa, setNovaDespesa] = useState({ descricao: "", valor: "", data: formatDate(new Date()) });

  // Mês em foco no Financeiro (começa no mês corrente)
  const [mesFinanceiro, setMesFinanceiro] = useState(derived.mesAtualRef);
  const resumoFinanceiro = useMemo(
    () => derived.resumoFinanceiro(mesFinanceiro),
    [derived, mesFinanceiro]
  );

  // Handlers
  function addCliente() {
    if (!novoCliente.nome) return;
    actions.addCliente(novoCliente);
    setNovoCliente({ nome: "", telefone: "" });
  }

  function updateCliente(id, novosDados) {
    actions.updateCliente(id, novosDados);
  }

  function delCliente(id) {
    actions.deleteCliente(id);
  }

  function addAg() {
    if (!novoAg.petId || !novoAg.data || !novoAg.hora) return;
    actions.addAgendamento(novoAg);
    setNovoAg({ petId: "", servico: "", data: "", hora: "", status: "Agendado", valor: 0 });
  }

  function delAg(id) {
    actions.deleteAgendamento(id);
  }

  function cicloStatus(id) {
    actions.cicloStatusAgendamento(id);
  }

  function addVenda() {
    const item = novaVenda.itemTipo === "custom" ? novaVenda.itemCustom : novaVenda.itemTipo;
    if (!item || !novaVenda.valor) return;
    actions.addVenda({
      clienteId: novaVenda.clienteId,
      item,
      qtd: Number(novaVenda.qtd) || 1,
      valor: Number(novaVenda.valor),
      formaPagamento: novaVenda.formaPagamento,
    });
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
    actions.deleteVenda(id);
  }

  function assinarPlano(planoId) {
    if (!clienteParaAssinar) return;
    actions.addAssinatura({
      clienteId: clienteParaAssinar,
      planoId,
      dataInicio: formatDate(new Date()),
    });
  }

  function cancelarAssinatura(id) {
    actions.cancelAssinatura(id);
  }

  function addDespesa() {
    if (!novaDespesa.descricao || !novaDespesa.valor) return;
    actions.addDespesa({
      descricao: novaDespesa.descricao,
      valor: Number(novaDespesa.valor),
      data: novaDespesa.data,
    });
    setNovaDespesa({ descricao: "", valor: "", data: formatDate(new Date()) });
  }

  function delDespesa(id) {
    actions.deleteDespesa(id);
  }

  function abrirCliente(cliente) {
    if (!cliente) return;
    setTab("clientes");
    setBuscaCliente(cliente.nome);
  }

  // Derived values for components
  const contaNoDia = (dataStr) => state.agendamentos.filter((a) => a.data === dataStr).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <Sidebar tab={tab} setTab={setTab} />

      <main className="flex-1 bg-white border-l p-6 overflow-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            Erro ao sincronizar com o banco: {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : (
          <>
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
            onCicloStatus={cicloStatus}
            onAbrirCliente={abrirCliente}
          />
        )}

        {tab === "settings" && (
          <Settings
            servicos={state.servicos}
            planos={state.planos}
            configuracoes={state.configuracoes}
            onAddServico={actions.addServico}
            onUpdateServico={actions.updateServico}
            onDeleteServico={actions.deleteServico}
            onAddPlano={actions.addPlano}
            onUpdatePlano={actions.updatePlano}
            onDeletePlano={actions.deletePlano}
            onUpdateConfiguracoes={actions.updateConfiguracoes}
            onLoadDemoData={actions.loadDemoData}
          />
        )}

        {tab === "clientes" && (
          <Clientes
            clientes={state.clientes}
            pets={state.pets}
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
            mesAtual={mesAtual}
            prevMes={prevMes}
            nextMes={nextMes}
            diaSelecionado={diaSelecionado}
            setDiaSelecionado={setDiaSelecionado}
            petInfo={derived.petInfo}
            nomeCliente={derived.nomeCliente}
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
            formasPagamento={FORMAS_PAGAMENTO}
            novaVenda={novaVenda}
            setNovaVenda={setNovaVenda}
            addVenda={addVenda}
            delVenda={delVenda}
            totalVendasMes={derived.resumoMes.totalVendas}
            nomeCliente={derived.nomeCliente}
          />
        )}

        {tab === "planos" && (
          <Planos
            clientes={state.clientes}
            assinaturas={state.assinaturas}
            planos={state.planos}
            clienteParaAssinar={clienteParaAssinar}
            setClienteParaAssinar={setClienteParaAssinar}
            assinarPlano={assinarPlano}
            cancelarAssinatura={cancelarAssinatura}
            nomeCliente={derived.nomeCliente}
          />
        )}

        {tab === "financeiro" && (
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
  );
}