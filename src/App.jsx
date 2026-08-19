import { useState } from "react";
import { Menu } from "lucide-react";
import { useApp } from "./context/AppProvider";
import { FORMAS_PAGAMENTO, STATUS_COR } from "./data/constants";
import { formatDate } from "./utils/format";

// Layout components
import Sidebar from "./components/layout/Sidebar";

// Feature components
import Dashboard from "./components/features/Dashboard";
import Clientes from "./components/features/clientes/Clientes";
import Pets from "./components/features/pets/Pets";
import Agendamentos from "./components/features/agendamentos/Agendamentos";
import Vendas from "./components/features/vendas/Vendas";
import Estoque from "./components/features/estoque/Estoque";
import Planos from "./components/features/planos/Planos";
import Financeiro from "./components/features/financeiro/Financeiro";
import Settings from "./components/features/settings/Settings";

// Custom hooks
import { useCalendar } from "./hooks/useCalendar";

const VENDA_VAZIA = {
  clienteId: "",
  itemTipo: "",
  itemCustom: "",
  qtd: 1,
  valor: "",
  formaPagamento: "Pix",
};

export default function PetshopSaaS() {
  const { state, derived, actions } = useApp();

  // Estado local de UI (não persiste)
  const [tab, setTab] = useState("dashboard");
  const [menuAberto, setMenuAberto] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [buscaPet, setBuscaPet] = useState("");
  const [petDetalheId, setPetDetalheId] = useState(null);

  // Formulários locais
  const [novoCliente, setNovoCliente] = useState({ nome: "", telefone: "" });
  const [novoPet, setNovoPet] = useState({ nome: "", especie: "Cachorro", raca: "", clienteId: "" });

  const [novoAg, setNovoAg] = useState({
    petId: "",
    servico: "",
    data: "",
    hora: "",
    status: "Agendado",
    valor: 0,
  });

  const [novaVenda, setNovaVenda] = useState(VENDA_VAZIA);

  const { mesAtual, diaSelecionado, irParaData, diasDoMes, prevMes, nextMes } = useCalendar();
  const [clienteParaAssinar, setClienteParaAssinar] = useState("");
  const [novaDespesa, setNovaDespesa] = useState({ descricao: "", valor: "", data: formatDate(new Date()) });

  // Handlers — as telas validam os dados e mandam o payload já pronto.
  function addCliente(dados) {
    actions.addCliente(dados ?? novoCliente);
    setNovoCliente({ nome: "", telefone: "" });
  }

  function addPet(dados) {
    actions.addPet(dados ?? novoPet);
    setNovoPet({ nome: "", especie: "Cachorro", raca: "", clienteId: "" });
  }

  function addAg() {
    actions.addAgendamento(novoAg);
    setNovoAg({ petId: "", servico: "", data: novoAg.data, hora: "", status: "Agendado", valor: 0 });
  }

  function addVenda(dados) {
    actions.addVenda({ ...dados, data: formatDate(new Date()) });
    setNovaVenda(VENDA_VAZIA);
  }

  function assinarPlano(planoId) {
    actions.addAssinatura({
      clienteId: clienteParaAssinar,
      planoId,
      dataInicio: formatDate(new Date()),
    });
  }

  function addDespesa() {
    actions.addDespesa(novaDespesa);
    setNovaDespesa({ descricao: "", valor: "", data: formatDate(new Date()) });
  }

  // Clicar em um agendamento do dashboard leva para a ficha do cliente.
  function handleAgendamentoClick(agendamento, cliente) {
    if (!cliente) return;
    setTab("clientes");
    setBuscaCliente(cliente.nome);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <Sidebar
        tab={tab}
        setTab={setTab}
        menuAberto={menuAberto}
        fecharMenu={() => setMenuAberto(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior: só aparece no mobile, onde o menu fica escondido */}
        <header className="lg:hidden flex items-center gap-3 bg-white border-b px-4 py-3">
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold">🐾 Petshop SaaS</span>
        </header>

        <main className="flex-1 bg-white p-4 sm:p-6 overflow-x-hidden">
          {tab === "dashboard" && (
            <Dashboard
              clientes={state.clientes}
              pets={state.pets}
              agendamentosHoje={derived.agendamentosHoje}
              totalEntradas={derived.totalEntradas}
              totalPorPagamento={derived.totalPorPagamento}
              statusCor={STATUS_COR}
              petInfo={derived.petInfo}
              donoDoPet={derived.donoDoPet}
              produtosEmFalta={derived.produtosEmFalta}
              onAgendamentoClick={handleAgendamentoClick}
              onVerEstoque={() => setTab("estoque")}
            />
          )}

          {tab === "settings" && (
            <Settings
              estado={state}
              onRestaurarBackup={actions.restaurarEstado}
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
            />
          )}

          {tab === "clientes" && (
            <Clientes
              clientes={state.clientes}
              pets={state.pets}
              agendamentos={state.agendamentos}
              buscaCliente={buscaCliente}
              setBuscaCliente={setBuscaCliente}
              novoCliente={novoCliente}
              setNovoCliente={setNovoCliente}
              addCliente={addCliente}
              delCliente={actions.deleteCliente}
              updateCliente={actions.updateCliente}
            />
          )}

          {tab === "pets" && (
            <Pets
              pets={state.pets}
              clientes={state.clientes}
              agendamentos={state.agendamentos}
              buscaPet={buscaPet}
              setBuscaPet={setBuscaPet}
              novoPet={novoPet}
              setNovoPet={setNovoPet}
              addPet={addPet}
              delPet={actions.deletePet}
              petDetalheId={petDetalheId}
              setPetDetalheId={setPetDetalheId}
              atualizarObs={actions.updatePetObservacoes}
              updatePet={actions.updatePet}
            />
          )}

          {tab === "agendamentos" && (
            <Agendamentos
              pets={state.pets}
              agendamentos={state.agendamentos}
              servicosPadrao={state.servicos}
              configuracoes={state.configuracoes}
              novoAg={novoAg}
              setNovoAg={setNovoAg}
              addAg={addAg}
              delAg={actions.deleteAgendamento}
              cicloStatus={actions.cicloStatusAgendamento}
              mesAtual={mesAtual}
              prevMes={prevMes}
              nextMes={nextMes}
              diaSelecionado={diaSelecionado}
              irParaData={irParaData}
              petInfo={derived.petInfo}
              donoDoPet={derived.donoDoPet}
              contaNoDia={derived.contaNoDia}
              statusCor={STATUS_COR}
              diasDoMes={diasDoMes}
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
              delVenda={actions.deleteVenda}
              totalVendas={derived.totalVendas}
              nomeCliente={derived.nomeCliente}
            />
          )}

          {tab === "estoque" && (
            <Estoque
              produtos={state.produtos}
              movimentacoes={state.movimentacoes}
              produtosEmFalta={derived.produtosEmFalta}
              valorDoEstoque={derived.valorDoEstoque}
              onAddProduto={actions.addProduto}
              onUpdateProduto={actions.updateProduto}
              onDeleteProduto={actions.deleteProduto}
              onMovimentar={actions.movimentarEstoque}
              onAjustar={actions.ajustarEstoque}
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
              cancelarAssinatura={actions.cancelAssinatura}
              nomeCliente={derived.nomeCliente}
            />
          )}

          {tab === "financeiro" && (
            <Financeiro
              despesas={state.despesas}
              novaDespesa={novaDespesa}
              setNovaDespesa={setNovaDespesa}
              addDespesa={addDespesa}
              delDespesa={actions.deleteDespesa}
              totalEntradas={derived.totalEntradas}
              totalDespesas={derived.totalDespesas}
              totalVendas={derived.totalVendas}
              totalPlanos={derived.totalPlanos}
              saldo={derived.saldo}
            />
          )}
        </main>
      </div>
    </div>
  );
}
