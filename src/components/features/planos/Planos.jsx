import { useState } from "react";
import { Trash2, Tag, Check } from "lucide-react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import EmptyState from "../../common/EmptyState";
import { formatCurrency, formatDateBR } from "../../../utils/format";
import { mesmoId } from "../../../utils/id";
import { useConfirmacao } from "../../../hooks/useConfirmacao";

export default function Planos({
  clientes,
  assinaturas,
  planos,
  clienteParaAssinar,
  setClienteParaAssinar,
  assinarPlano,
  cancelarAssinatura,
  nomeCliente,
}) {
  const pedirConfirmacao = useConfirmacao();
  const [erro, setErro] = useState("");

  const receitaMensal = assinaturas.reduce(
    (total, a) => total + (planos.find((p) => mesmoId(p.id, a.planoId))?.preco || 0),
    0
  );

  const jaAssina = (planoId) =>
    assinaturas.some((a) => mesmoId(a.clienteId, clienteParaAssinar) && mesmoId(a.planoId, planoId));

  function tentarAssinar(plano) {
    if (!clienteParaAssinar) {
      setErro("Selecione o cliente que vai assinar.");
      return;
    }
    if (jaAssina(plano.id)) {
      setErro(`${nomeCliente(clienteParaAssinar)} já assina o plano ${plano.nome}.`);
      return;
    }
    setErro("");
    assinarPlano(plano.id);
  }

  function confirmarCancelamento(assinatura) {
    const plano = planos.find((p) => mesmoId(p.id, assinatura.planoId));
    pedirConfirmacao({
      titulo: "Cancelar assinatura?",
      mensagem: `${nomeCliente(assinatura.clienteId)} · ${plano?.nome || "Plano removido"}`,
      detalhe: "A receita recorrente deste plano sai do financeiro.",
      textoConfirmar: "Cancelar assinatura",
      textoCancelar: "Voltar",
      aoConfirmar: () => cancelarAssinatura(assinatura.id),
    });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Planos e Assinaturas</h2>

      {planos.length === 0 ? (
        <EmptyState
          icon={Tag}
          titulo="Nenhum plano cadastrado"
          descricao="Cadastre os planos em Configurações."
        />
      ) : (
        <>
          <div className="border rounded-xl p-4 bg-gray-50">
            <Input label="Assinar para o cliente" erro={erro} className="max-w-sm">
              <select
                value={clienteParaAssinar}
                onChange={(e) => {
                  setClienteParaAssinar(e.target.value);
                  setErro("");
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione o cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </Input>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {planos.map((plano) => {
              const assinado = clienteParaAssinar && jaAssina(plano.id);
              return (
                <div key={plano.id} className="border rounded-xl p-4 flex flex-col bg-white">
                  <h3 className="font-semibold text-lg">{plano.nome}</h3>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {formatCurrency(plano.preco)}
                    <span className="text-sm font-normal text-gray-500">/mês</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-2 flex-1">{plano.descricao}</p>
                  <Button
                    onClick={() => tentarAssinar(plano)}
                    variant={assinado ? "secondary" : "primary"}
                    className="w-full mt-4"
                    disabled={Boolean(assinado)}
                  >
                    {assinado ? (
                      <>
                        <Check size={16} /> Já assinado
                      </>
                    ) : (
                      "Assinar plano"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Assinaturas ativas</h3>
          {assinaturas.length > 0 && (
            <span className="text-sm text-gray-500">
              Receita recorrente: <strong className="text-green-600">{formatCurrency(receitaMensal)}</strong>
              /mês
            </span>
          )}
        </div>

        {assinaturas.length === 0 ? (
          <EmptyState icon={Tag} titulo="Nenhuma assinatura ativa" />
        ) : (
          <div className="space-y-2">
            {assinaturas.map((assinatura) => {
              const plano = planos.find((p) => mesmoId(p.id, assinatura.planoId));
              return (
                <div
                  key={assinatura.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 border rounded-xl bg-white"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{nomeCliente(assinatura.clienteId)}</p>
                    <p className="text-sm text-gray-500">
                      {plano?.nome || "Plano removido"} · {formatCurrency(plano?.preco)}/mês
                    </p>
                    {assinatura.dataInicio && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Desde {formatDateBR(assinatura.dataInicio)}
                      </p>
                    )}
                  </div>
                  <Button onClick={() => confirmarCancelamento(assinatura)} variant="danger" size="sm">
                    <Trash2 size={14} /> Cancelar
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
