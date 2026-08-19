import { useState } from "react";
import { Plus, Trash2, ShoppingCart, Package, AlertTriangle } from "lucide-react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import EmptyState from "../../common/EmptyState";
import { formatCurrency, formatDateBR } from "../../../utils/format";
import { mesmoId } from "../../../utils/id";
import { useConfirmacao } from "../../../hooks/useConfirmacao";

const SEM_ERROS = { item: "", qtd: "", valor: "" };
const classeSelect =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

// O <select> mistura serviços e produtos, então o valor carrega o tipo junto.
const PREFIXO_PRODUTO = "produto:";

export default function Vendas({
  clientes,
  vendas,
  servicosPadrao,
  produtos,
  formasPagamento,
  novaVenda,
  setNovaVenda,
  addVenda,
  delVenda,
  totalVendas,
  nomeCliente,
}) {
  const pedirConfirmacao = useConfirmacao();
  const [erros, setErros] = useState(SEM_ERROS);

  const produtoSelecionado = novaVenda.itemTipo.startsWith(PREFIXO_PRODUTO)
    ? produtos.find((p) => mesmoId(p.id, novaVenda.itemTipo.slice(PREFIXO_PRODUTO.length)))
    : null;

  function nomeDoItem() {
    if (novaVenda.itemTipo === "custom") return novaVenda.itemCustom.trim();
    if (produtoSelecionado) return produtoSelecionado.nome;
    return novaVenda.itemTipo;
  }

  function validar() {
    const qtd = Number(novaVenda.qtd);
    const valor = Number(novaVenda.valor);
    const erroQtd =
      !Number.isFinite(qtd) || qtd < 1
        ? "Quantidade mínima: 1."
        : produtoSelecionado && qtd > produtoSelecionado.quantidade
        ? `Só há ${produtoSelecionado.quantidade} em estoque. Faça uma entrada ou ajuste no Estoque.`
        : "";

    return {
      item: nomeDoItem() ? "" : "Selecione ou descreva o item vendido.",
      qtd: erroQtd,
      valor: Number.isFinite(valor) && valor > 0 ? "" : "Informe um valor maior que zero.",
    };
  }

  function selecionarItem(valorSelect) {
    if (valorSelect.startsWith(PREFIXO_PRODUTO)) {
      const produto = produtos.find((p) => mesmoId(p.id, valorSelect.slice(PREFIXO_PRODUTO.length)));
      setNovaVenda({ ...novaVenda, itemTipo: valorSelect, valor: produto?.precoVenda ?? novaVenda.valor });
      return;
    }
    const servico = servicosPadrao.find((s) => s.nome === valorSelect);
    setNovaVenda({ ...novaVenda, itemTipo: valorSelect, valor: servico ? servico.preco : novaVenda.valor });
  }

  function submeter() {
    const validacao = validar();
    setErros(validacao);
    if (Object.values(validacao).some(Boolean)) return;

    addVenda({
      clienteId: novaVenda.clienteId,
      item: nomeDoItem(),
      produtoId: produtoSelecionado?.id ?? null,
      qtd: novaVenda.qtd,
      valor: novaVenda.valor,
      formaPagamento: novaVenda.formaPagamento,
    });
    setErros(SEM_ERROS);
  }

  function confirmarExclusao(venda) {
    const produto = venda.produtoId ? produtos.find((p) => mesmoId(p.id, venda.produtoId)) : null;
    pedirConfirmacao({
      titulo: "Excluir venda?",
      mensagem: `${venda.item} · ${formatCurrency(venda.qtd * venda.valor)}`,
      detalhe: produto
        ? `O valor sai do faturamento e ${venda.qtd} unidade(s) voltam para o estoque de ${produto.nome}.`
        : "O valor sai do faturamento e do balanço financeiro.",
      textoConfirmar: "Excluir venda",
      aoConfirmar: () => delVenda(venda.id),
    });
  }

  const totalDaVenda = (Number(novaVenda.qtd) || 0) * (Number(novaVenda.valor) || 0);
  const semCatalogo = servicosPadrao.length === 0 && produtos.length === 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Vendas</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Nova venda</h3>

          {semCatalogo ? (
            <p className="text-sm text-gray-500">
              Cadastre serviços em Configurações ou produtos no Estoque para registrar vendas.
            </p>
          ) : (
            <>
              <Input label="Cliente (opcional)">
                <select
                  value={novaVenda.clienteId}
                  onChange={(e) => setNovaVenda({ ...novaVenda, clienteId: e.target.value })}
                  className={classeSelect}
                >
                  <option value="">Venda avulsa</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </Input>

              <Input label="Item" erro={erros.item}>
                <select
                  value={novaVenda.itemTipo}
                  onChange={(e) => selecionarItem(e.target.value)}
                  className={classeSelect}
                >
                  <option value="">Selecione o item</option>
                  {servicosPadrao.length > 0 && (
                    <optgroup label="Serviços">
                      {servicosPadrao.map((s) => (
                        <option key={s.id ?? s.nome} value={s.nome}>{s.nome}</option>
                      ))}
                    </optgroup>
                  )}
                  {produtos.length > 0 && (
                    <optgroup label="Produtos">
                      {produtos.map((p) => (
                        <option key={p.id} value={`${PREFIXO_PRODUTO}${p.id}`} disabled={p.quantidade === 0}>
                          {p.nome} {p.quantidade === 0 ? "(sem estoque)" : `(${p.quantidade} em estoque)`}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value="custom">Outro (digitar)...</option>
                </select>
              </Input>

              {produtoSelecionado && (
                <p className="-mt-1 text-sm text-blue-800 bg-blue-50 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <Package size={14} />
                  {produtoSelecionado.quantidade} em estoque — a venda dá baixa automaticamente
                </p>
              )}

              {novaVenda.itemTipo === "custom" && (
                <Input
                  label="Descrição do item"
                  placeholder="Ex.: Ração a granel"
                  value={novaVenda.itemCustom}
                  onChange={(e) => setNovaVenda({ ...novaVenda, itemCustom: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && submeter()}
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Quantidade"
                  type="number" min="1" step="1" inputMode="numeric"
                  value={novaVenda.qtd}
                  erro={erros.qtd}
                  onChange={(e) => setNovaVenda({ ...novaVenda, qtd: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && submeter()}
                />
                <Input
                  label="Valor unitário (R$)"
                  type="number" min="0" step="0.01" inputMode="decimal"
                  value={novaVenda.valor}
                  erro={erros.valor}
                  onChange={(e) => setNovaVenda({ ...novaVenda, valor: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && submeter()}
                />
              </div>

              <Input label="Forma de pagamento">
                <select
                  value={novaVenda.formaPagamento}
                  onChange={(e) => setNovaVenda({ ...novaVenda, formaPagamento: e.target.value })}
                  className={classeSelect}
                >
                  {formasPagamento.map((forma) => (
                    <option key={forma} value={forma}>{forma}</option>
                  ))}
                </select>
              </Input>

              <div className="flex justify-between items-center bg-white border rounded-lg px-3 py-2">
                <span className="text-sm font-medium">Total da venda</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(totalDaVenda)}</span>
              </div>

              <Button onClick={submeter} className="w-full">
                <Plus size={16} /> Registrar venda
              </Button>
            </>
          )}
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Histórico</h3>
            <span className="text-sm text-gray-500">
              Total: <strong className="text-green-600">{formatCurrency(totalVendas)}</strong>
            </span>
          </div>

          {vendas.length === 0 ? (
            <EmptyState icon={ShoppingCart} titulo="Nenhuma venda registrada" />
          ) : (
            <div className="space-y-2 lg:max-h-[32rem] lg:overflow-y-auto lg:pr-1">
              {vendas.map((venda) => (
                <div key={venda.id} className="flex items-start justify-between gap-3 p-4 border rounded-xl bg-white">
                  <div className="min-w-0">
                    <p className="font-medium truncate flex items-center gap-2">
                      {venda.produtoId && <Package size={14} className="text-gray-400 shrink-0" />}
                      {venda.item}
                    </p>
                    <p className="text-sm text-gray-500">
                      {venda.qtd} × {formatCurrency(venda.valor)} ={" "}
                      <strong>{formatCurrency(venda.qtd * venda.valor)}</strong>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {venda.data ? `${formatDateBR(venda.data)} · ` : ""}
                      {nomeCliente(venda.clienteId)} · {venda.formaPagamento}
                    </p>
                  </div>
                  <Button
                    onClick={() => confirmarExclusao(venda)}
                    variant="danger" size="sm"
                    title="Excluir venda"
                    aria-label={`Excluir venda de ${venda.item}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
