import { Plus, Trash2, ChevronLeft, ChevronRight, Clock, DollarSign } from "lucide-react";
import Button from "../../common/Button";
import StatusBadge from "../../common/StatusBadge";
import { calcularHorariosDisponiveis } from "../../../utils/availability.js";

export default function Agendamentos({ 
  pets, 
  agendamentos, 
  servicosPadrao, 
  novoAg, 
  setNovoAg, 
  addAg, 
  delAg, 
  cicloStatus,
  mesAtual, 
  prevMes, 
  nextMes, 
  diaSelecionado, 
  setDiaSelecionado,
  petInfo,
  nomeCliente,
  contaNoDia,
  statusCor,
  diasDoMes
}) {
  const agendamentosDoDia = agendamentos.filter((a) => a.data === diaSelecionado);
  
  // Helper functions for smart flow
  const getPetSelected = () => pets.find(p => String(p.id) === String(novoAg.petId));
  const getServicoSelected = () => servicosPadrao.find(s => s.nome === novoAg.servico);
  const getHorariosDisponiveis = () => {
    if (!novoAg.data || !novoAg.servico) return [];
    const servico = getServicoSelected();
    if (!servico) return [];
    return calcularHorariosDisponiveis(novoAg.data, agendamentos, servico.duracao, servicosPadrao);
  };

  const handlePetChange = (e) => {
    setNovoAg({ ...novoAg, petId: e.target.value });
  };

  const handleServicoChange = (e) => {
    const servico = servicosPadrao.find(s => s.nome === e.target.value);
    setNovoAg({ 
      ...novoAg, 
      servico: e.target.value, 
      valor: servico?.preco || 0,
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Agendamentos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
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
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
                {petSelected && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                    <span className="font-medium">Dono:</span> {nomeCliente(petSelected.clienteId)}
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
                      <span className="font-medium">Preço:</span> R$ {servicoSelected.preco}
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
                    <span className="text-lg font-bold text-green-600">R$ {servicoSelected.preco.toFixed(2)}</span>
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
        <h3 className="font-semibold mb-3">Agendamentos do Dia: {diaSelecionado}</h3>
        {agendamentosDoDia.length === 0 ? (
          <p className="text-gray-500">Nenhum agendamento para este dia</p>
        ) : (
          <div className="space-y-2">
            {agendamentosDoDia.map((ag) => (
              <div key={ag.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{petInfo(ag.petId)?.nome} - {ag.servico}</p>
                  <p className="text-sm text-gray-500">{ag.hora} - R$ {ag.valor.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => cicloStatus(ag.id)}
                    className="px-3 py-2 rounded-lg"
                  >
                    <StatusBadge status={ag.status} colors={statusCor} />
                  </button>
                  <Button onClick={() => delAg(ag.id)} variant="danger">
                    <Trash2 size={16} />
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