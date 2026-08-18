import { useState } from "react";
import { Plus, Trash2, Receipt, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import EmptyState from "../../common/EmptyState";
import { formatCurrency, formatDateBR } from "../../../utils/format";
import { useConfirmacao } from "../../../hooks/useConfirmacao";

const SEM_ERROS = { descricao: "", valor: "", data: "" };

function validar({ descricao, valor, data }) {
  const numero = Number(valor);
  return {
    descricao: descricao.trim() ? "" : "Descreva a despesa.",
    valor: Number.isFinite(numero) && numero > 0 ? "" : "Informe um valor maior que zero.",
    data: data ? "" : "Informe a data.",
  };
}

const temErro = (erros) => Object.values(erros).some(Boolean);

function Cartao({ icon: Icon, titulo, valor, detalhe, tom }) {
  const tons = {
    verde: "bg-green-50 text-green-700 border-green-100",
    vermelho: "bg-red-50 text-red-700 border-red-100",
    neutro: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return (
    <div className={`border rounded-xl p-4 ${tons[tom]}`}>
      <div className="flex items-center gap-2 text-sm">
        <Icon size={16} />
        {titulo}
      </div>
      <p className="text-2xl font-bold mt-1">{formatCurrency(valor)}</p>
      {detalhe && <p className="text-xs opacity-75 mt-1">{detalhe}</p>}
    </div>
  );
}

export default function Financeiro({
  despesas,
  novaDespesa,
  setNovaDespesa,
  addDespesa,
  delDespesa,
  totalEntradas,
  totalDespesas,
  totalVendas,
  totalPlanos,
  saldo,
}) {
  const pedirConfirmacao = useConfirmacao();
  const [erros, setErros] = useState(SEM_ERROS);

  function submeter() {
    const validacao = validar(novaDespesa);
    setErros(validacao);
    if (temErro(validacao)) return;
    addDespesa();
    setErros(SEM_ERROS);
  }

  function confirmarExclusao(despesa) {
    pedirConfirmacao({
      titulo: "Excluir despesa?",
      mensagem: `${despesa.descricao} · ${formatCurrency(despesa.valor)}`,
      textoConfirmar: "Excluir despesa",
      aoConfirmar: () => delDespesa(despesa.id),
    });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Financeiro</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Cartao
          icon={TrendingUp}
          tom="verde"
          titulo="Entradas"
          valor={totalEntradas}
          detalhe={`Vendas ${formatCurrency(totalVendas)} + Planos ${formatCurrency(totalPlanos)}`}
        />
        <Cartao icon={TrendingDown} tom="vermelho" titulo="Despesas" valor={totalDespesas} />
        <Cartao icon={Wallet} tom={saldo >= 0 ? "verde" : "vermelho"} titulo="Saldo" valor={saldo} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Nova despesa</h3>
          <Input
            label="Descrição"
            placeholder="Ex.: compra de shampoo"
            value={novaDespesa.descricao}
            erro={erros.descricao}
            onChange={(e) => setNovaDespesa({ ...novaDespesa, descricao: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submeter()}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valor (R$)"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={novaDespesa.valor}
              erro={erros.valor}
              onChange={(e) => setNovaDespesa({ ...novaDespesa, valor: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && submeter()}
            />
            <Input
              label="Data"
              type="date"
              value={novaDespesa.data}
              erro={erros.data}
              onChange={(e) => setNovaDespesa({ ...novaDespesa, data: e.target.value })}
            />
          </div>
          <Button onClick={submeter} variant="danger" className="w-full">
            <Plus size={16} /> Registrar despesa
          </Button>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Histórico de despesas</h3>
          {despesas.length === 0 ? (
            <EmptyState icon={Receipt} titulo="Nenhuma despesa registrada" />
          ) : (
            <div className="space-y-2 lg:max-h-96 lg:overflow-y-auto lg:pr-1">
              {despesas.map((despesa) => (
                <div
                  key={despesa.id}
                  className="flex items-center justify-between gap-3 p-4 border rounded-xl bg-white"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{despesa.descricao}</p>
                    <p className="text-sm text-gray-500">
                      {formatDateBR(despesa.data)} · {formatCurrency(despesa.valor)}
                    </p>
                  </div>
                  <Button
                    onClick={() => confirmarExclusao(despesa)}
                    variant="danger"
                    size="sm"
                    title="Excluir despesa"
                    aria-label={`Excluir despesa ${despesa.descricao}`}
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
