import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";
import { Dog, Clock, Users, CalendarDays, ChevronRight, CreditCard } from "lucide-react";
import { formatCurrency } from "../../utils/format";

function Metrica({ icon: Icon, titulo, valor }) {
  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Icon size={14} />
        {titulo}
      </div>
      <p className="font-semibold text-xl mt-1">{valor}</p>
    </div>
  );
}

export default function Dashboard({
  clientes,
  pets,
  agendamentosHoje,
  totalEntradas,
  totalPorPagamento,
  statusCor,
  petInfo,
  donoDoPet,
  onAgendamentoClick,
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metrica icon={Users} titulo="Clientes" valor={clientes.length} />
        <Metrica icon={Dog} titulo="Pets" valor={pets.length} />
        <Metrica icon={CalendarDays} titulo="Hoje" valor={agendamentosHoje.length} />
        <Metrica icon={CreditCard} titulo="Faturamento" valor={formatCurrency(totalEntradas)} />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Agendamentos de hoje</h3>
        {agendamentosHoje.length === 0 ? (
          <EmptyState
            icon={Dog}
            titulo="Nenhum agendamento para hoje"
            descricao="Os agendamentos do dia aparecem aqui."
          />
        ) : (
          <div className="grid gap-3">
            {agendamentosHoje.map((a) => {
              const pet = petInfo(a.petId);
              const dono = donoDoPet(a.petId);

              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onAgendamentoClick?.(a, dono)}
                  className="w-full text-left p-4 bg-white border rounded-xl hover:shadow-md hover:border-blue-300 transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-blue-600">{a.hora}</span>
                        <StatusBadge status={a.status} colors={statusCor} />
                      </div>

                      <div className="flex items-center gap-2 mb-1 min-w-0">
                        <Dog size={16} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-800 truncate">
                          {pet?.nome || "Pet removido"}
                        </span>
                        {dono && <span className="text-sm text-gray-500 truncate">· {dono.nome}</span>}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {a.servico}
                        </span>
                        <span>{formatCurrency(a.valor)}</span>
                      </div>
                    </div>

                    <ChevronRight
                      size={20}
                      className="text-gray-300 group-hover:text-blue-400 transition-colors shrink-0"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Vendas por forma de pagamento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {totalPorPagamento.map(({ forma, total }) => (
            <div key={forma} className="border rounded-xl p-4">
              <p className="text-xs text-gray-400">{forma}</p>
              <p className="font-semibold text-lg mt-1">{formatCurrency(total)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
