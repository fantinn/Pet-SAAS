import StatusBadge from "../common/StatusBadge";
import { Dog, Clock, DollarSign } from "lucide-react";

export default function Dashboard({ clientes, pets, agendamentos, totalEntradas, statusCor, petInfo, onAgendamentoClick }) {
  const hoje = new Date();
  const formatDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const agendamentosHoje = agendamentos.filter((a) => a.data === formatDate(hoje));

  const getClienteFromPet = (petId) => {
    const pet = petInfo(petId);
    if (!pet) return null;
    return clientes.find((c) => c.id === pet.clienteId);
  };

  const handleAgendamentoClick = (agendamento) => {
    if (onAgendamentoClick) {
      const cliente = getClienteFromPet(agendamento.petId);
      onAgendamentoClick(agendamento, cliente);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">Clientes</p>
          <p className="font-semibold text-lg">{clientes.length}</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">Pets</p>
          <p className="font-semibold text-lg">{pets.length}</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">Hoje</p>
          <p className="font-semibold text-lg">{agendamentosHoje.length}</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">Faturamento</p>
          <p className="font-semibold text-lg">R$ {totalEntradas.toFixed(2)}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3">Agendamentos de hoje</p>
      
      {agendamentosHoje.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Dog className="mx-auto mb-2 text-gray-300" size={32} />
          <p className="text-sm text-gray-400">Nenhum agendamento para hoje.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {agendamentosHoje.map((a) => {
            const pet = petInfo(a.petId);
            const cliente = getClienteFromPet(a.petId);
            
            return (
              <button
                key={a.id}
                onClick={() => handleAgendamentoClick(a)}
                className="w-full text-left p-4 bg-white border rounded-lg hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-blue-600">{a.hora}</span>
                      <StatusBadge status={a.status} colors={statusCor} />
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                      <Dog size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-800">{pet?.nome || "Pet não encontrado"}</span>
                      {cliente && (
                        <span className="text-gray-400">·</span>
                      )}
                      {cliente && (
                        <span className="text-sm text-gray-600">{cliente.nome}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{a.servico}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} />
                        <span>R$ {a.valor.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 text-gray-300 group-hover:text-blue-400 transition-colors">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}