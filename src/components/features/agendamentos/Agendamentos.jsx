import { useRef, useState } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, Clock, DollarSign, CalendarClock, RotateCcw, AlertTriangle } from "lucide-react";
import Button from "../../common/Button";
import StatusBadge from "../../common/StatusBadge";
import WhatsAppLink from "../../common/WhatsAppLink";
import { calcularHorariosDisponiveis } from "../../../utils/availability.js";
import { formatBRL, formatDataBR, mensagemConfirmacao } from "../../../utils/format";
import { precoPorPorte } from "../../../data/constants";

// Um retorno de banho/tosa costuma cair em torno de um mês depois.
const DIAS_ATE_RETORNO = 30;

function somarDias(dataStr, dias) {
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  const d = new Date(ano, mes - 1, dia + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Agendamentos({
  pets,
  agendamentos,
  servicosPadrao,
  novoAg,
  setNovoAg,
  addAg,
  delAg,
  cicloStatus,
  remarcarAg,
  mesAtual,
  prevMes,
  nextMes,
  diaSelecionado,
  setDiaSelecionado,
  petInfo,
  nomeCliente,
  clienteDoPet,
  contaNoDia,
  statusCor,
  diasDoMes,
  configuracoes
}) {
  const agendamentosDoDia = agendamentos.filter((a) => a.data === diaSelecionado);

  const formRef = useRef(null);
  const [remarcando, setRemarcando] = useState(null); // { id, data, hora }

  function iniciarRemarcacao(ag) {
    setRemarcando({ id: ag.id, data: ag.data, hora: "" });
  }

  // Ao remarcar, o próprio agendamento não pode bloquear o horário dele.
  function horariosParaRemarcar(ag) {
    const servico = servicosPadrao.find((s) => s.nome === ag.servico);
    if (!servico || !remarcando?.data) return [];
    return calcularHorariosDisponiveis(
      remarcando.data, agendamentos, servico.duracao, servicosPadrao, configuracoes, ag.id
    );
  }

  function salvarRemarcacao() {
    if (!remarcando?.data || !remarcando?.hora) return;
    remarcarAg(remarcando.id, { data: remarcando.data, hora: remarcando.hora });
    setDiaSelecionado(remarcando.data);
    setRemarcando(null);
  }

  // Sai do atendimento já deixando o próximo marcado: é assim que a agenda
  // de um petshop não esvazia.
  function agendarRetorno(ag) {
    const servico = servicosPadrao.find((s) => s.nome === ag.servico);
    setNovoAg({
      petId: ag.petId,
      servico: ag.servico,
      data: somarDias(ag.data, DIAS_ATE_RETORNO),
      hora: "",
      status: "Agendado",
      valor: servico ? precoPorPorte(servico, petInfo(ag.petId)?.porte) : ag.valor,
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Helper functions for smart flow
  const getPetSelected = () => pets.find(p => String(p.id) === String(novoAg.petId));
  const getServicoSelected = () => servicosPadrao.find(s => s.nome === novoAg.servico);
  const getHorariosDisponiveis = () => {
    if (!novoAg.data || !novoAg.servico) return [];
    const servico = getServicoSelected();
    if (!servico) return [];
    return calcularHorariosDisponiveis(novoAg.data, agendamentos, servico.duracao, servicosPadrao, configuracoes);
  };

  function confirmarExclusao(ag) {
    const pet = petInfo(ag.petId);
    const alvo = `${pet?.nome ? `${pet.nome} - ` : ""}${ag.servico} às ${ag.hora}`;
    if (!window.confirm(`Excluir o agendamento de ${alvo}? Não dá para desfazer.`)) return;
    delAg(ag.id);
  }

  // O preço acompanha o porte do pet, então trocar qualquer um dos dois
  // recalcula o valor do agendamento.
  const handlePetChange = (e) => {
    const petId = e.target.value;
    const pet = pets.find((p) => String(p.id) === String(petId));
    const servico = servicosPadrao.find((s) => s.nome === novoAg.servico);
    setNovoAg({ ...novoAg, petId, valor: precoPorPorte(servico, pet?.porte) });
  };

  const handleServicoChange = (e) => {
    const servico = servicosPadrao.find(s => s.nome === e.target.value);
    setNovoAg({
      ...novoAg,
      servico: e.target.value,
      valor: precoPorPorte(servico, getPetSelected()?.porte),
      hora: "" // Reset hora when service changes
    });
  };

  const handleDataChange = (e) => {
    setNovoAg({ 
      ...novoAg, 
      data: e.target.value,
      hora: "" // Reset hora when date changes
    });
  };

  const handleHoraChange = (e) => {
    setNovoAg({ ...novoAg, hora: e.target.value });
  };

  const petSelected = getPetSelected();
  const servicoSelected = getServicoSelected();
  const horariosDisponiveis = getHorariosDisponiveis();
  const valorDoServico = precoPorPorte(servicoSelected, petSelected?.porte);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Agendamentos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div ref={formRef}>
          <h3 className="font-semibold mb-3">Novo Agendamento</h3>
          {servicosPadrao && servicosPadrao.length > 0 ? (
            <div className="space-y-4">
              {/* Pet Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selecionar Pet</label>
                <select
                  value={novoAg.petId}
                  onChange={handlePetChange}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Selecione o pet</option>
                  {/* O dono no rótulo evita escolher o "Thor" errado quando há homônimos. */}
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome} · {nomeCliente(p.clienteId)}</option>
                  ))}
                </select>
                {petSelected && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                    <span className="font-medium">Dono:</span> {nomeCliente(petSelected.clienteId)}
                    <span className="text-gray-500"> · porte {(petSelected.porte || "Médio").toLowerCase()}</span>
                  </div>
                )}
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selecionar Serviço</label>
                <select
                  value={novoAg.servico}
                  onChange={handleServicoChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  disabled={!novoAg.petId}
                >
                  <option value="">Selecione o serviço</option>
                  {servicosPadrao.map((s) => (
                    <option key={s.nome} value={s.nome}>{s.nome}</option>
                  ))}
                </select>
                {servicoSelected && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-green-600" />
                      <span className="font-medium">Preço:</span> {formatBRL(valorDoServico)}
                      {petSelected && <span className="text-gray-500">(porte {petSelected.porte?.toLowerCase()})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-green-600" />
                      <span className="font-medium">Duração:</span> {servicoSelected.duracao} min
                    </div>
                  </div>
                )}
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selecionar Data</label>
                <input
                  type="date"
                  value={novoAg.data}
                  onChange={handleDataChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  disabled={!novoAg.servico}
                />
              </div>

              {/* Time Selection - Only show available slots */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {novoAg.data && novoAg.servico ? "Horários Disponíveis" : "Horário"}
                </label>
                {novoAg.data && novoAg.servico ? (
                  horariosDisponiveis.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {horariosDisponiveis.map((horario) => (
                        <button
                          key={horario}
                          onClick={() => handleHoraChange({ target: { value: horario } })}
                          className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                            novoAg.hora === horario 
                              ? 'bg-blue-500 text-white border-blue-500' 
                              : 'bg-white hover:bg-blue-50'
                          }`}
                        >
                          {horario}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 bg-red-50 p-2 rounded">
                      Não há horários disponíveis para esta data e serviço.
                    </p>
                  )
                ) : (
                  <input
                    type="time"
                    value={novoAg.hora}
                    onChange={(e) => setNovoAg({ ...novoAg, hora: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    disabled
                  />
                )}
              </div>

              {/* Price Display (Auto-filled) */}
              {servicoSelected && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Valor Total:</span>
                    <span className="text-lg font-bold text-green-600">{formatBRL(valorDoServico)}</span>
                  </div>
                </div>
              )}

              <Button 
                onClick={addAg} 
                variant="primary" 
                className="w-full"
                disabled={!novoAg.petId || !novoAg.servico || !novoAg.data || !novoAg.hora}
              >
                <Plus size={16} /> Agendar
              </Button>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 bg-gray-50 rounded">
              Nenhum serviço cadastrado. Vá em Configurações para adicionar serviços.
            </p>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-3">Calendário</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMes} className="p-2 hover:bg-gray-200 rounded">
                <ChevronLeft size={20} />
              </button>
              <span className="font-semibold">
                {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={nextMes} className="p-2 hover:bg-gray-200 rounded">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
                <div key={dia} className="font-semibold text-gray-500">{dia}</div>
              ))}
              {diasDoMes(mesAtual).map((dia, idx) => {
                if (!dia) return <div key={idx} className="p-2" />;
                const diaStr = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
                const count = contaNoDia(diaStr);
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setDiaSelecionado(diaStr);
                      setNovoAg({ ...novoAg, data: diaStr, hora: "" });
                    }}
                    className={`p-2 rounded hover:bg-blue-100 ${
                      diaStr === diaSelecionado ? 'bg-blue-500 text-white' : ''
                    }`}
                  >
                    {dia.getDate()}
                    {count > 0 && <div className="text-xs mt-1">{count}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Agendamentos de {formatDataBR(diaSelecionado)}</h3>
        {agendamentosDoDia.length === 0 ? (
          <p className="text-gray-500">Nenhum agendamento para este dia</p>
        ) : (
          <div className="space-y-2">
            {agendamentosDoDia.map((ag) => {
              const pet = petInfo(ag.petId);
              const cliente = clienteDoPet(ag.petId);
              const observacoes = (pet?.observacoes || "").trim();
              const estaRemarcando = remarcando?.id === ag.id;
              const horariosRemarcar = estaRemarcando ? horariosParaRemarcar(ag) : [];

              return (
                <div key={ag.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{pet?.nome || "Pet removido"} - {ag.servico}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {ag.hora} · {formatBRL(ag.valor)}
                        {pet && ` · ${nomeCliente(pet.clienteId)}`}
                      </p>
                      {ag.status === "Agendado" && cliente && (
                        <WhatsAppLink
                          telefone={cliente.telefone}
                          mensagem={mensagemConfirmacao({ petNome: pet?.nome || "seu pet", servico: ag.servico, data: ag.data, hora: ag.hora })}
                        />
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => cicloStatus(ag.id)}
                        className="px-3 py-2 rounded-lg"
                        title="Alterar status"
                      >
                        <StatusBadge status={ag.status} colors={statusCor} />
                      </button>
                      <Button onClick={() => confirmarExclusao(ag)} variant="danger">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Quem vai dar o banho precisa ver "morde ao secar" aqui, não
                      escondido na ficha do cliente. */}
                  {observacoes && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                      {observacoes}
                    </p>
                  )}

                  {(ag.status === "Agendado" || ag.status === "Concluído") && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {ag.status === "Agendado" && (
                        <Button
                          onClick={() => (estaRemarcando ? setRemarcando(null) : iniciarRemarcacao(ag))}
                          variant="secondary"
                          className="text-xs"
                        >
                          <CalendarClock size={14} /> {estaRemarcando ? "Cancelar" : "Remarcar"}
                        </Button>
                      )}
                      {ag.status === "Concluído" && (
                        <Button onClick={() => agendarRetorno(ag)} variant="secondary" className="text-xs">
                          <RotateCcw size={14} /> Agendar retorno
                        </Button>
                      )}
                    </div>
                  )}

                  {estaRemarcando && (
                    <div className="mt-3 p-3 bg-white border rounded-lg space-y-2">
                      <input
                        type="date"
                        value={remarcando.data}
                        onChange={(e) => setRemarcando({ ...remarcando, data: e.target.value, hora: "" })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                      {horariosRemarcar.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {horariosRemarcar.map((horario) => (
                            <button
                              key={horario}
                              onClick={() => setRemarcando({ ...remarcando, hora: horario })}
                              className={`px-2 py-1.5 border rounded-lg text-sm transition-colors ${
                                remarcando.hora === horario
                                  ? "bg-blue-500 text-white border-blue-500"
                                  : "bg-white hover:bg-blue-50"
                              }`}
                            >
                              {horario}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-red-500 bg-red-50 p-2 rounded">
                          Nenhum horário livre nesta data.
                        </p>
                      )}
                      <Button
                        onClick={salvarRemarcacao}
                        variant="success"
                        className="w-full text-xs"
                        disabled={!remarcando.hora}
                      >
                        Confirmar novo horário
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}