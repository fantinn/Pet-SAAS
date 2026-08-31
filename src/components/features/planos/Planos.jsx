import { Trash2 } from "lucide-react";
import Button from "../../common/Button";
import { formatBRL } from "../../../utils/format";

export default function Planos({ 
  clientes, 
  assinaturas, 
  planos, 
  clienteParaAssinar, 
  setClienteParaAssinar, 
  assinarPlano, 
  cancelarAssinatura,
  nomeCliente 
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Planos e Assinaturas</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {planos.map((plano) => (
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
              >
                Assinar Plano
              </Button>
            </div>
          </div>
        ))}
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
                      Desde {(assinatura.dataInicio || "").split("-").reverse().join("/")}
                    </p>
                  </div>
                  <Button onClick={() => cancelarAssinatura(assinatura.id)} variant="danger">
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