import { Plus, Trash2 } from "lucide-react";
import Button from "../../common/Button";
import { formatBRL, formatDataBR } from "../../../utils/format";

export default function Vendas({
  clientes,
  vendas,
  servicosPadrao,
  formasPagamento,
  novaVenda,
  setNovaVenda,
  addVenda,
  delVenda,
  totalVendasMes,
  nomeCliente
}) {
  function confirmarExclusao(venda) {
    const total = formatBRL(venda.qtd * venda.valor);
    if (!window.confirm(`Excluir a venda "${venda.item}" de ${total}? Não dá para desfazer.`)) return;
    delVenda(venda.id);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Vendas</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3">Nova Venda</h3>
          {servicosPadrao.length > 0 ? (
            <div className="space-y-3">
              <select
                value={novaVenda.clienteId}
                onChange={(e) => setNovaVenda({ ...novaVenda, clienteId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Selecione o cliente (opcional)</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <select
                value={novaVenda.itemTipo}
                onChange={(e) => {
                  const servico = servicosPadrao.find(s => s.nome === e.target.value);
                  setNovaVenda({ ...novaVenda, itemTipo: e.target.value, valor: servico?.preco || novaVenda.valor });
                }}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Selecione o serviço</option>
                {servicosPadrao.map((s) => (
                  <option key={s.nome} value={s.nome}>{s.nome}</option>
                ))}
                <option value="custom">Customizado...</option>
              </select>
              {novaVenda.itemTipo === "custom" && (
                <input
                  type="text"
                  placeholder="Nome do item"
                  value={novaVenda.itemCustom}
                  onChange={(e) => setNovaVenda({ ...novaVenda, itemCustom: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              )}
              <input
                type="number"
                placeholder="Quantidade"
                value={novaVenda.qtd}
                onChange={(e) => setNovaVenda({ ...novaVenda, qtd: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Valor unitário"
                value={novaVenda.valor}
                onChange={(e) => setNovaVenda({ ...novaVenda, valor: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <select
                value={novaVenda.formaPagamento}
                onChange={(e) => setNovaVenda({ ...novaVenda, formaPagamento: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {formasPagamento.map((forma) => (
                  <option key={forma} value={forma}>{forma}</option>
                ))}
              </select>
              <Button onClick={addVenda} variant="primary" className="w-full">
                <Plus size={16} /> Registrar Venda
              </Button>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 bg-gray-50 rounded">
              Nenhum serviço cadastrado. Vá em Configurações para adicionar serviços.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-3 gap-3">
            <h3 className="font-semibold">Últimas vendas</h3>
            <p className="text-sm text-gray-500">
              Mês: <span className="font-medium text-gray-700">{formatBRL(totalVendasMes)}</span>
            </p>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {vendas.map((venda) => (
              <div key={venda.id} className="flex items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="min-w-0">
                  <p className="font-medium">{venda.item}</p>
                  <p className="text-sm text-gray-500">
                    {venda.qtd}x {formatBRL(venda.valor)} = {formatBRL(venda.qtd * venda.valor)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDataBR(venda.data)} · {nomeCliente(venda.clienteId)} · {venda.formaPagamento}
                  </p>
                </div>
                <Button onClick={() => confirmarExclusao(venda)} variant="danger">
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            {vendas.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhuma venda registrada</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}