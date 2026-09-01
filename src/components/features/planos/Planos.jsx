import { Trash2, Check, Plus, AlertCircle } from "lucide-react";
import Button from "../../common/Button";
import WhatsAppLink from "../../common/WhatsAppLink";
import { formatBRL, formatDataBR, nomeDoMes, mensagemCobranca } from "../../../utils/format";

export default function Planos({
  clientes,
  assinaturas,
  planos,
  clienteParaAssinar,
  setClienteParaAssinar,
  assinarPlano,
  cancelarAssinatura,
  nomeCliente,
  mensalidadesEmAberto,
  mesAtualRef,
  temCobrancaDoMes,
  gerarMensalidades,
  alternarPagamento,
}) {
  function confirmarCancelamento(assinatura, plano) {
    const cliente = nomeCliente(assinatura.clienteId);
    if (!window.confirm(`Cancelar a assinatura ${plano?.nome ? `"${plano.nome}" ` : ""}de ${cliente}? As mensalidades já pagas continuam no histórico, mas a cobrança em aberto é removida.`)) return;
    cancelarAssinatura(assinatura.id);
  }

  const totalEmAberto = mensalidadesEmAberto.reduce((s, m) => s + m.mensalidade.valor, 0);
  const semCobranca = assinaturas.length - temCobrancaDoMes;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Planos e Assinaturas</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {planos.map((plano) => {
          const jaAssinado = assinaturas.some(
            (a) => a.clienteId === clienteParaAssinar && a.planoId === plano.id
          );
          return (
            <div key={plano.id} className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg">{plano.nome}</h3>
              <p className="text-2xl font-bold text-blue-600">{formatBRL(plano.preco)}<span className="text-sm font-normal text-gray-500">/mês</span></p>
              <p className="text-sm text-gray-600 mt-2">{plano.descricao}</p>
              <div className="mt-4 space-y-2">
                <select
                  value={clienteParaAssinar}
                  onChange={(e) => setClienteParaAssinar(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Selecione o cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                <Button
                  onClick={() => assinarPlano(plano.id)}
                  variant="primary"
                  className="w-full"
                  disabled={!clienteParaAssinar || jaAssinado}
                  title={jaAssinado ? "Este cliente já tem esse plano ativo" : ""}
                >
                  {jaAssinado ? "Já assinado" : "Assinar Plano"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensalidades: só entra no faturamento o que foi realmente recebido. */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h3 className="font-semibold">Mensalidades em aberto</h3>
          {totalEmAberto > 0 && (
            <p className="text-sm text-gray-500">
              A receber: <span className="font-medium text-amber-700">{formatBRL(totalEmAberto)}</span>
            </p>
          )}
        </div>

        {semCobranca > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              {semCobranca} {semCobranca === 1 ? "assinatura ainda não tem" : "assinaturas ainda não têm"} cobrança de {nomeDoMes(mesAtualRef)}.
            </p>
            <Button onClick={() => gerarMensalidades(mesAtualRef)} variant="primary" className="text-xs shrink-0">
              <Plus size={14} /> Gerar cobranças do mês
            </Button>
          </div>
        )}

        {mensalidadesEmAberto.length === 0 ? (
          <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
            Nenhuma mensalidade em aberto
          </p>
        ) : (
          <div className="space-y-2">
            {mensalidadesEmAberto.map(({ mensalidade, cliente, plano, atrasada }) => (
              <div
                key={mensalidade.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border ${
                  atrasada ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {atrasada && <AlertCircle size={16} className="text-red-500 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {cliente?.nome || "Cliente removido"} · {plano?.nome}
                    </p>
                    <p className="text-xs text-gray-500 first-letter:uppercase">
                      {nomeDoMes(mensalidade.mesRef)} · {formatBRL(mensalidade.valor)}
                      {atrasada && <span className="text-red-600 font-medium"> · em atraso</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {cliente && (
                    <div className="text-xs">
                      <WhatsAppLink
                        telefone={cliente.telefone}
                        mensagem={mensagemCobranca({
                          plano: plano?.nome || "assinatura",
                          mesRef: mensalidade.mesRef,
                          valor: mensalidade.valor,
                          atrasada,
                        })}
                      >
                        Cobrar
                      </WhatsAppLink>
                    </div>
                  )}
                  <Button onClick={() => alternarPagamento(mensalidade.id)} variant="success" className="text-xs">
                    <Check size={14} /> Recebi
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold mb-3">Assinaturas Ativas</h3>
        {assinaturas.length === 0 ? (
          <p className="text-gray-500">Nenhuma assinatura ativa</p>
        ) : (
          <div className="space-y-2">
            {assinaturas.map((assinatura) => {
              const plano = planos.find((p) => p.id === assinatura.planoId);
              return (
                <div key={assinatura.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{nomeCliente(assinatura.clienteId)}</p>
                    <p className="text-sm text-gray-500">{plano?.nome} · {formatBRL(plano?.preco)}/mês</p>
                    <p className="text-sm text-gray-500">
                      Desde {formatDataBR(assinatura.dataInicio)}
                    </p>
                  </div>
                  <Button onClick={() => confirmarCancelamento(assinatura, plano)} variant="danger">
                    <Trash2 size={16} /> Cancelar
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
