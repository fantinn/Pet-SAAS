import { useState } from "react";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import EmptyState from "../../common/EmptyState";
import { formatCurrency, formatDateBR } from "../../../utils/format";
import { useConfirmacao } from "../../../hooks/useConfirmacao";

const SEM_ERROS = { item: "", qtd: "", valor: "" };
const classeSelect =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function validar(novaVenda) {
  const item = novaVenda.itemTipo === "custom" ? novaVenda.itemCustom.trim() : novaVenda.itemTipo;
  const qtd = Number(novaVenda.qtd);
  const valor = Number(novaVenda.valor);

  return {
    item: item ? "" : "Selecione ou descreva o item vendido.",
    qtd: Number.isFinite(qtd) && qtd >= 1 ? "" : "Quantidade mínima: 1.",
    valor: Number.isFinite(valor) && valor > 0 ? "" : "Informe um valor maior que zero.",
  };
}

const temErro = (erros) => Object.values(erros).some(Boolean);

export default function Vendas({
  clientes,
  vendas,
  servicosPadrao,
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

  const totalDaVenda = (Number(novaVenda.qtd) || 0) * (Number(novaVenda.valor) || 0);

  function submeter() {
    const validacao = validar(novaVenda);
    setErros(validacao);
    if (temErro(validacao)) return;
    addVenda();
    setErros(SEM_ERROS);
  }

  function confirmarExclusao(venda) {
    pedirConfirmacao({
      titulo: "Excluir venda?",
      mensagem: `${venda.item} · ${formatCurrency(venda.qtd * venda.valor)}`,
      detalhe: "O valor sai do faturamento e do balanço financeiro.",
      textoConfirmar: "Excluir venda",
      aoConfirmar: () => delVenda(venda.id),
    });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Vendas</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Nova venda</h3>

          <Input label="Cliente (opcional)">
            <select
              value={novaVenda.clienteId}
              onChange={(e) => setNovaVenda({ ...novaVenda, clienteId: e.target.value })}
              className={classeSelect}
            >
              <option value="">Venda avulsa</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Input>

          <Input label="Item" erro={erros.item}>
            <select
              value={novaVenda.itemTipo}
              onChange={(e) => {
                const servico = servicosPadrao.find((s) => s.nome === e.target.value);
                setNovaVenda({
                  ...novaVenda,
                  itemTipo: e.target.value,
                  valor: servico ? servico.preco : novaVenda.valor,
                });
              }}
              className={classeSelect}
            >
              <option value="">Selecione o item</option>
              {servicosPadrao.map((s) => (
                <option key={s.id ?? s.nome} value={s.nome}>
                  {s.nome}
                </option>
              ))}
              <option value="custom">Outro (digitar)...</option>
            </select>
          </Input>

          {novaVenda.itemTipo === "custom" && (
            <Input
              label="Descrição do item"
              placeholder="Ex.: Ração 10kg"
              value={novaVenda.itemCustom}
              onChange={(e) => setNovaVenda({ ...novaVenda, itemCustom: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && submeter()}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantidade"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={novaVenda.qtd}
              erro={erros.qtd}
              onChange={(e) => setNovaVenda({ ...novaVenda, qtd: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && submeter()}
            />
            <Input
              label="Valor unitário (R$)"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
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
                <option key={forma} value={forma}>
                  {forma}
                </option>
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
        </div>

        {/* Histórico */}
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
                <div
                  key={venda.id}
                  className="flex items-start justify-between gap-3 p-4 border rounded-xl bg-white"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{venda.item}</p>
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
                    variant="danger"
                    size="sm"
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
