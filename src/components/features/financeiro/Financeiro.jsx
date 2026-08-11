import { Plus, Trash2 } from "lucide-react";
import Button from "../../common/Button";

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
  saldo 
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Financeiro</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600">Total Entradas</p>
          <p className="text-2xl font-bold text-green-700">R$ {totalEntradas.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Vendas: R$ {totalVendas.toFixed(2)} + Planos: R$ {totalPlanos.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-600">Total Despesas</p>
          <p className="text-2xl font-bold text-red-700">R$ {totalDespesas.toFixed(2)}</p>
        </div>
        <div className={`p-4 rounded-lg ${saldo >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className={`text-sm ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>Saldo</p>
          <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            R$ {saldo.toFixed(2)}
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
          <h3 className="font-semibold mb-3">Histórico de Despesas</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {despesas.map((despesa) => (
              <div key={despesa.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{despesa.descricao}</p>
                  <p className="text-sm text-gray-500">{despesa.data} - R$ {despesa.valor.toFixed(2)}</p>
                </div>
                <Button onClick={() => delDespesa(despesa.id)} variant="danger">
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            {despesas.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhuma despesa registrada</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}