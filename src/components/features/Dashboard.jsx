import StatusBadge from "../common/StatusBadge";
import WhatsAppLink from "../common/WhatsAppLink";
import { Dog, Clock, Check, Users, CalendarDays, TrendingUp, UserX, AlertTriangle, Syringe } from "lucide-react";
import { formatBRL, formatDataBR, mensagemConfirmacao, mensagemReativacao, mensagemVacina } from "../../utils/format";

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
  clienteDoPet,
  clientesParaReativar,
  vacinasAVencer,
  onCicloStatus,
  onAbrirCliente,
}) {

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
            const cliente = clienteDoPet(a.petId);

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

                    {/* Cuidados do pet à vista antes do atendimento começar. */}
                    {(pet?.observacoes || "").trim() && (
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                        {pet.observacoes.trim()}
                      </p>
                    )}
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
                    {cliente && (
                      <div className="text-xs">
                        <WhatsAppLink
                          telefone={cliente.telefone}
                          mensagem={mensagemConfirmacao({ petNome: pet?.nome || "seu pet", servico: a.servico, data: a.data, hora: a.hora })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {vacinasAVencer.length > 0 && (
        <div className="mt-8">
          <p className="text-xs text-gray-400 mb-3">
            Vacinas · {vacinasAVencer.length} {vacinasAVencer.length === 1 ? "dose vencida ou vencendo" : "doses vencidas ou vencendo"}
          </p>
          <div className="grid gap-2">
            {vacinasAVencer.map(({ vacina, pet, cliente, dias }) => {
              const vencida = dias > 0;
              return (
                <div
                  key={vacina.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
                    vencida ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Syringe size={16} className={`shrink-0 ${vencida ? "text-red-500" : "text-blue-500"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {pet.nome} · {vacina.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {vencida
                          ? `venceu há ${dias} ${dias === 1 ? "dia" : "dias"}`
                          : dias === 0
                          ? "vence hoje"
                          : `vence em ${-dias} ${dias === -1 ? "dia" : "dias"}`}
                        {" "}· {formatDataBR(vacina.proximaDose)}
                        {cliente && ` · ${cliente.nome}`}
                      </p>
                    </div>
                  </div>
                  {cliente && (
                    <div className="text-xs shrink-0">
                      <WhatsAppLink
                        telefone={cliente.telefone}
                        mensagem={mensagemVacina({
                          petNome: pet.nome,
                          vacina: vacina.nome,
                          proximaDose: vacina.proximaDose,
                          dias,
                        })}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {clientesParaReativar.length > 0 && (
        <div className="mt-8">
          <p className="text-xs text-gray-400 mb-3">
            Sem retorno · {clientesParaReativar.length} {clientesParaReativar.length === 1 ? "cliente" : "clientes"} não agendam há mais de 45 dias
          </p>
          <div className="grid gap-2">
            {clientesParaReativar.map(({ cliente, pet, dias }) => (
              <div
                key={cliente.id}
                className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserX size={16} className="text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <button
                      onClick={() => onAbrirCliente(cliente)}
                      className="text-sm font-medium text-gray-800 hover:text-blue-600 hover:underline"
                    >
                      {cliente.nome}
                    </button>
                    <p className="text-xs text-gray-500">
                      {pet?.nome || "pet"} · há {dias} dias sem vir
                    </p>
                  </div>
                </div>
                <div className="text-xs shrink-0">
                  <WhatsAppLink
                    telefone={cliente.telefone}
                    mensagem={mensagemReativacao({ petNome: pet?.nome || "seu pet", dias })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
