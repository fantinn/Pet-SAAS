import { Plus, Trash2, ChevronLeft, ChevronRight, Scissors, ShoppingCart, Tag } from "lucide-react";
import Button from "../../common/Button";
import { formatBRL, nomeDoMes } from "../../../utils/format";

export default function Financeiro({
  novaDespesa,
  setNovaDespesa,
  addDespesa,
  delDespesa,
  resumo,
  mesRef,
  onMesAnterior,
  onProximoMes,
  onVoltarMesAtual,
  ehMesAtual,
}) {
  const { totalEntradas, totalDespesas, saldo, totalServicos, totalVendas, totalPlanos, despesasDoMes, qtdServicos, ticketMedio } = resumo;

  const composicao = [
    { label: "Serviços", valor: totalServicos, icone: Scissors, cor: "text-blue-600" },
    { label: "Vendas", valor: totalVendas, icone: ShoppingCart, cor: "text-purple-600" },
    { label: "Planos", valor: totalPlanos, icone: Tag, cor: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Financeiro</h2>
          {!ehMesAtual && (
            <button
              onClick={onVoltarMesAtual}
              className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200"
              title="Você está vendo um mês passado"
            >
              vendo mês passado · voltar para o atual
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-gray-50 border rounded-lg p-1">
          <button onClick={onMesAnterior} className="p-1.5 hover:bg-gray-200 rounded" title="Mês anterior">
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 text-sm font-medium first-letter:uppercase min-w-[9rem] text-center">
            {nomeDoMes(mesRef)}
          </span>
          <button
            onClick={onProximoMes}
            disabled={ehMesAtual}
            className="p-1.5 hover:bg-gray-200 rounded disabled:text-gray-300 disabled:hover:bg-transparent"
            title="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600">Entradas</p>
          <p className="text-2xl font-bold text-green-700">{formatBRL(totalEntradas)}</p>
          <div className="mt-2 space-y-1">
            {composicao.map(({ label, valor, icone: Icone, cor }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
                <Icone size={12} className={cor} />
                <span className="flex-1">{label}</span>
                <span className="font-medium">{formatBRL(valor)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-600">Despesas</p>
          <p className="text-2xl font-bold text-red-700">{formatBRL(totalDespesas)}</p>
          <p className="text-xs text-gray-500 mt-2">
            {despesasDoMes.length} {despesasDoMes.length === 1 ? "lançamento" : "lançamentos"} no mês
          </p>
        </div>

        <div className={`p-4 rounded-lg ${saldo >= 0 ? "bg-green-50" : "bg-red-50"}`}>
          <p className={`text-sm ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>Saldo</p>
          <p className={`text-2xl font-bold ${saldo >= 0 ? "text-green-700" : "text-red-700"}`}>
            {formatBRL(saldo)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {qtdServicos} {qtdServicos === 1 ? "atendimento" : "atendimentos"}
            {qtdServicos > 0 && ` · ticket ${formatBRL(ticketMedio)}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3">Nova Despesa</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Descrição"
              value={novaDespesa.descricao}
              onChange={(e) => setNovaDespesa({ ...novaDespesa, descricao: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Valor"
              value={novaDespesa.valor}
              onChange={(e) => setNovaDespesa({ ...novaDespesa, valor: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="date"
              value={novaDespesa.data}
              onChange={(e) => setNovaDespesa({ ...novaDespesa, data: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <Button onClick={addDespesa} variant="danger" className="w-full">
              <Plus size={16} /> Registrar Despesa
            </Button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Despesas de {nomeDoMes(mesRef)}</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {despesasDoMes.map((despesa) => (
              <div key={despesa.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{despesa.descricao}</p>
                  <p className="text-sm text-gray-500">
                    {despesa.data.split("-").reverse().join("/")} · {formatBRL(despesa.valor)}
                  </p>
                </div>
                <Button onClick={() => delDespesa(despesa.id)} variant="danger">
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            {despesasDoMes.length === 0 && (
              <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                Nenhuma despesa neste mês
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
