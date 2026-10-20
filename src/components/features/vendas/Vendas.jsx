import { Plus, Trash2 } from "lucide-react";
import Button from "../../common/Button";
import { formatBRL, formatDataBR } from "../../../utils/format";

export default function Vendas({
  clientes,
  vendas,
  produtos = [],
  formasPagamento,
  novaVenda,
  setNovaVenda,
  addVenda,
  delVenda,
  totalVendasMes,
  nomeCliente
}) {
  const produtoSelecionado = novaVenda.itemTipo.startsWith("produto:")
    ? produtos.find((p) => `produto:${p.id}` === novaVenda.itemTipo)
    : null;
  const itemVenda = produtoSelecionado
    ? produtoSelecionado.nome
    : novaVenda.itemTipo === "custom"
    ? novaVenda.itemCustom
    : novaVenda.itemTipo;
  const acimaDoEstoque = produtoSelecionado && (Number(novaVenda.qtd) || 1) > produtoSelecionado.quantidade;

  function escolherItem(valor) {
    const produto = valor.startsWith("produto:") ? produtos.find((p) => `produto:${p.id}` === valor) : null;
    setNovaVenda({
      ...novaVenda,
      itemTipo: valor,
      valor: produto?.precoVenda ?? novaVenda.valor,
    });
  }

  function confirmarExclusao(venda) {
    const total = formatBRL(venda.qtd * venda.valor);
    if (!window.confirm(`Estornar a venda "${venda.item}" de ${total}? O histórico será mantido e os produtos serão devolvidos ao estoque.`)) return;
    return delVenda(venda.id);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Vendas</h2>
      <p className="text-sm text-gray-600">Serviços agendados entram no financeiro ao concluir o atendimento. Não registre esses serviços novamente como venda avulsa.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3">Nova Venda</h3>
          {(
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
                onChange={(e) => escolherItem(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Selecione o produto ou item avulso</option>
                {produtos.length > 0 && (
                  <optgroup label="Produtos (dá baixa no estoque)">
                    {produtos.map((p) => (
                      <option key={p.id} value={`produto:${p.id}`}>
                        {p.nome} — {p.quantidade} em estoque
                      </option>
                    ))}
                  </optgroup>
                )}
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
              {acimaDoEstoque && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Só há {produtoSelecionado.quantidade} em estoque. Reduza a quantidade para registrar a venda.
                </p>
              )}
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
              <Button onClick={addVenda} variant="primary" className="w-full" disabled={acimaDoEstoque || !itemVenda || Number(novaVenda.valor) <= 0 || !Number.isInteger(Number(novaVenda.qtd)) || Number(novaVenda.qtd) <= 0}>
                <Plus size={16} /> Registrar Venda
              </Button>
            </div>
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