import StatusBadge from "../common/StatusBadge";
import { Dog, Clock, Check, MessageCircle, Users, CalendarDays, TrendingUp } from "lucide-react";
import { formatBRL } from "../../utils/format";

function Metrica({ icone: Icone, label, valor, detalhe }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        <Icone size={13} />
        <p className="text-xs">{label}</p>
      </div>
      <p className="font-semibold text-lg leading-tight">{valor}</p>
      {detalhe && <p className="text-xs text-gray-400 mt-0.5">{detalhe}</p>}
    </div>
  );
}

export default function Dashboard({
  clientes,
  pets,
  agendamentosHoje,
  previstoHoje,
  resumoMes,
  statusCor,
  petInfo,
  nomeCliente,
  onCicloStatus,
  onAbrirCliente,
}) {
  const clientePorPet = (petId) => {
    const pet = petInfo(petId);
    if (!pet) return null;
    return clientes.find((c) => c.id === pet.clienteId);
  };

  const pendentesHoje = agendamentosHoje.filter((a) => a.status === "Agendado").length;

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Metrica
          icone={CalendarDays}
          label="Hoje"
          valor={agendamentosHoje.length}
          detalhe={pendentesHoje > 0 ? `${pendentesHoje} a atender` : "tudo resolvido"}
        />
        <Metrica
          icone={Clock}
          label="Previsto hoje"
          valor={formatBRL(previstoHoje)}
          detalhe="se todos comparecerem"
        />
        <Metrica
          icone={TrendingUp}
          label="Faturamento do mês"
          valor={formatBRL(resumoMes.totalEntradas)}
          detalhe={`saldo ${formatBRL(resumoMes.saldo)}`}
        />
        <Metrica
          icone={Users}
          label="Base"
          valor={`${clientes.length} / ${pets.length}`}
          detalhe="clientes / pets"
        />
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
            const cliente = clientePorPet(a.petId);
            const digitos = (cliente?.telefone || "").replace(/\D/g, "");
            const linkZap = digitos
              ? `https://wa.me/${digitos.startsWith("55") ? digitos : "55" + digitos}`
              : null;

            return (
              <div
                key={a.id}
                className={`p-4 bg-white border rounded-lg transition-colors ${
                  a.status === "Cancelado" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-blue-600">{a.hora}</span>
                      <button onClick={() => onCicloStatus(a.id)} title="Alterar status">
                        <StatusBadge status={a.status} colors={statusCor} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Dog size={16} className="text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-800">{pet?.nome || "Pet removido"}</span>
                      {cliente && (
                        <>
                          <span className="text-gray-300">·</span>
                          <button
                            onClick={() => onAbrirCliente(cliente)}
                            className="text-sm text-gray-600 hover:text-blue-600 hover:underline"
                          >
                            {cliente.nome}
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{a.servico}</span>
                      <span className="font-medium text-gray-700">{formatBRL(a.valor)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {a.status === "Agendado" && (
                      <button
                        onClick={() => onCicloStatus(a.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"
                      >
                        <Check size={14} /> Concluir
                      </button>
                    )}
                    {linkZap && (
                      <a
                        href={linkZap}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                      >
                        <MessageCircle size={13} /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
