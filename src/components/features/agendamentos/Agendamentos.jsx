import { Plus, Trash2, ChevronLeft, ChevronRight, Clock, DollarSign, CalendarDays } from "lucide-react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import StatusBadge from "../../common/StatusBadge";
import EmptyState from "../../common/EmptyState";
import { calcularHorariosDisponiveis } from "../../../utils/availability.js";
import { formatCurrency, formatDate, formatDateLongoBR } from "../../../utils/format";
import { mesmoId } from "../../../utils/id";
import { useConfirmacao } from "../../../hooks/useConfirmacao";

const classeSelect =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400";

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Agendamentos({
  pets,
  agendamentos,
  servicosPadrao,
  configuracoes,
  novoAg,
  setNovoAg,
  addAg,
  delAg,
  cicloStatus,
  mesAtual,
  prevMes,
  nextMes,
  diaSelecionado,
  irParaData,
  petInfo,
  donoDoPet,
  contaNoDia,
  statusCor,
  diasDoMes,
}) {
  const pedirConfirmacao = useConfirmacao();

  const hojeStr = formatDate(new Date());
  const agendamentosDoDia = agendamentos.filter((a) => a.data === diaSelecionado);

  const petSelecionado = pets.find((p) => mesmoId(p.id, novoAg.petId));
  const servicoSelecionado = servicosPadrao.find((s) => s.nome === novoAg.servico);
  const dono = petSelecionado ? donoDoPet(petSelecionado.id) : null;

  const horariosDisponiveis =
    novoAg.data && servicoSelecionado
      ? calcularHorariosDisponiveis({
          data: novoAg.data,
          agendamentos,
          servicos: servicosPadrao,
          duracao: servicoSelecionado.duracao,
          configuracoes,
        })
      : [];

  const podeAgendar = Boolean(novoAg.petId && novoAg.servico && novoAg.data && novoAg.hora);

  function selecionarServico(nome) {
    const servico = servicosPadrao.find((s) => s.nome === nome);
    setNovoAg({ ...novoAg, servico: nome, valor: servico?.preco || 0, hora: "" });
  }

  function confirmarExclusao(ag) {
    const pet = petInfo(ag.petId);
    pedirConfirmacao({
      titulo: "Excluir agendamento?",
      mensagem: `${pet?.nome || "Pet"} · ${ag.servico} · ${ag.hora}`,
      textoConfirmar: "Excluir",
      aoConfirmar: () => delAg(ag.id),
    });
  }

  if (!servicosPadrao?.length) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Agendamentos</h2>
        <EmptyState
          icon={CalendarDays}
          titulo="Nenhum serviço cadastrado"
          descricao="Vá em Configurações e cadastre os serviços antes de agendar."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Agendamentos</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="border rounded-xl p-4 bg-gray-50 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Novo agendamento</h3>

          <Input label="Pet">
            <select
              value={novoAg.petId}
              onChange={(e) => setNovoAg({ ...novoAg, petId: e.target.value })}
              className={classeSelect}
            >
              <option value="">Selecione o pet</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </Input>
          {petSelecionado && (
            <p className="-mt-2 text-sm text-blue-800 bg-blue-50 rounded-lg px-3 py-1.5">
              Dono: <span className="font-medium">{dono?.nome || "não encontrado"}</span>
            </p>
          )}

          <Input label="Serviço">
            <select
              value={novoAg.servico}
              onChange={(e) => selecionarServico(e.target.value)}
              className={classeSelect}
              disabled={!novoAg.petId}
            >
              <option value="">Selecione o serviço</option>
              {servicosPadrao.map((s) => (
                <option key={s.id ?? s.nome} value={s.nome}>
                  {s.nome}
                </option>
              ))}
            </select>
          </Input>
          {servicoSelecionado && (
            <div className="-mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm bg-white border rounded-lg px-3 py-2">
              <span className="flex items-center gap-1.5">
                <DollarSign size={14} className="text-green-600" />
                {formatCurrency(servicoSelecionado.preco)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-blue-600" />
                {servicoSelecionado.duracao} min
              </span>
            </div>
          )}

          <Input
            label="Data"
            type="date"
            value={novoAg.data}
            min={hojeStr}
            disabled={!novoAg.servico}
            onChange={(e) => {
              setNovoAg({ ...novoAg, data: e.target.value, hora: "" });
              irParaData(e.target.value);
            }}
          />

          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Horários disponíveis</p>
            {!novoAg.data || !servicoSelecionado ? (
              <p className="text-sm text-gray-400 bg-white border border-dashed rounded-lg px-3 py-2">
                Escolha o serviço e a data para ver os horários livres.
              </p>
            ) : horariosDisponiveis.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Nenhum horário livre nesta data para {servicoSelecionado.duracao} min. Tente outro dia ou
                ajuste o horário de funcionamento em Configurações.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {horariosDisponiveis.map((horario) => (
                  <button
                    key={horario}
                    type="button"
                    onClick={() => setNovoAg({ ...novoAg, hora: horario })}
                    aria-pressed={novoAg.hora === horario}
                    className={`px-2 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      novoAg.hora === horario
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white border-gray-300 hover:bg-blue-50"
                    }`}
                  >
                    {horario}
                  </button>
                ))}
              </div>
            )}
          </div>

          {servicoSelecionado && (
            <div className="flex justify-between items-center bg-white border rounded-lg px-3 py-2">
              <span className="text-sm font-medium">Valor total</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(servicoSelecionado.preco)}
              </span>
            </div>
          )}

          <Button onClick={addAg} className="w-full" disabled={!podeAgendar}>
            <Plus size={16} /> Agendar
          </Button>
        </div>

        {/* Calendário */}
        <div className="border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <Button onClick={prevMes} variant="ghost" size="sm" aria-label="Mês anterior">
              <ChevronLeft size={20} />
            </Button>
            <span className="font-semibold first-letter:uppercase">
              {mesAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </span>
            <Button onClick={nextMes} variant="ghost" size="sm" aria-label="Próximo mês">
              <ChevronRight size={20} />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {SEMANA.map((dia) => (
              <div key={dia} className="font-semibold text-gray-400 text-xs py-1">
                {dia}
              </div>
            ))}
            {diasDoMes(mesAtual).map((dia, idx) => {
              if (!dia) return <div key={`vazio-${idx}`} />;
              const diaStr = formatDate(dia);
              const total = contaNoDia(diaStr);
              const selecionado = diaStr === diaSelecionado;
              const ehHoje = diaStr === hojeStr;

              return (
                <button
                  key={diaStr}
                  type="button"
                  onClick={() => {
                    irParaData(diaStr);
                    setNovoAg({ ...novoAg, data: diaStr, hora: "" });
                  }}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    selecionado
                      ? "bg-blue-600 text-white"
                      : ehHoje
                      ? "bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <span>{dia.getDate()}</span>
                  {total > 0 && (
                    <span
                      className={`text-[10px] leading-none mt-0.5 px-1 rounded-full ${
                        selecionado ? "bg-white/25" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agenda do dia */}
      <div>
        <h3 className="font-semibold mb-3 first-letter:uppercase">{formatDateLongoBR(diaSelecionado)}</h3>
        {agendamentosDoDia.length === 0 ? (
          <EmptyState icon={CalendarDays} titulo="Nenhum agendamento neste dia" />
        ) : (
          <div className="space-y-2">
            {agendamentosDoDia.map((ag) => (
              <div
                key={ag.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 border rounded-xl bg-white"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {ag.hora} · {petInfo(ag.petId)?.nome || "Pet removido"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {ag.servico} · {formatCurrency(ag.valor)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cicloStatus(ag.id)}
                    title="Clique para mudar o status"
                    className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <StatusBadge status={ag.status} colors={statusCor} />
                  </button>
                  <Button
                    onClick={() => confirmarExclusao(ag)}
                    variant="danger"
                    size="sm"
                    title="Excluir agendamento"
                    aria-label="Excluir agendamento"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
