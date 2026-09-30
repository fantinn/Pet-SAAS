import { useMemo, useState } from "react";
import { Download, TrendingUp, Scissors, Receipt, Ban } from "lucide-react";
import Button from "../../common/Button";
import { baixarCSV, numeroCSV } from "../../../utils/csv";
import { formatBRL, formatDataBR, nomeDoMes } from "../../../utils/format";
import { calcularRelatorio, ultimosMeses } from "../../../utils/relatorios";

const PERIODOS = [
  { meses: 3, label: "3 meses" },
  { meses: 6, label: "6 meses" },
  { meses: 12, label: "12 meses" },
];

function Cartao({ icone: Icone, label, valor, detalhe }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        <Icone size={13} />
        <p className="text-xs">{label}</p>
      </div>
      <p className="font-semibold text-lg leading-tight">{valor}</p>
      {detalhe && <p className="text-xs text-gray-400 mt-0.5">{detalhe}</p>}
    </div>
  );
}

function Ranking({ titulo, itens, vazio, formatarDetalhe }) {
  const maior = Math.max(...itens.map((i) => i.total), 0);
  return (
    <div>
      <h3 className="font-semibold mb-3">{titulo}</h3>
      {itens.length === 0 ? (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg py-4 text-center">{vazio}</p>
      ) : (
        <ul className="space-y-2">
          {itens.map((item) => (
            <li key={item.nome}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{item.nome}</span>
                <span className="font-medium shrink-0">{formatBRL(item.total)}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                <div
                  className="h-1.5 bg-blue-500 rounded-full"
                  style={{ width: `${maior ? (item.total / maior) * 100 : 0}%` }}
                />
              </div>
              {formatarDetalhe && <p className="text-xs text-gray-400 mt-0.5">{formatarDetalhe(item)}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Relatorios({ state, derived }) {
  const [periodo, setPeriodo] = useState(6);

  const meses = useMemo(() => ultimosMeses(derived.mesAtualRef, periodo), [derived.mesAtualRef, periodo]);
  const r = useMemo(() => calcularRelatorio({ state, derived, meses }), [state, derived, meses]);

  const maiorBarra = Math.max(...r.serie.flatMap((m) => [m.entradas, m.despesas]), 1);
  const maiorDia = Math.max(...r.porDiaSemana.map((d) => d.quantidade), 1);
  const rotuloPeriodo = `${nomeDoMes(meses[0])} a ${nomeDoMes(meses[meses.length - 1])}`;

  function exportarVendas() {
    baixarCSV(
      `vendas-${meses[0]}-a-${meses[meses.length - 1]}.csv`,
      [
        { titulo: "Data", valor: (v) => formatDataBR(v.data) },
        { titulo: "Cliente", valor: (v) => (v.clienteId ? derived.nomeCliente(v.clienteId) : "") },
        { titulo: "Item", valor: (v) => v.item },
        { titulo: "Quantidade", valor: (v) => v.qtd },
        { titulo: "Valor unitário", valor: (v) => numeroCSV(v.valor) },
        { titulo: "Total", valor: (v) => numeroCSV(v.qtd * v.valor) },
        { titulo: "Pagamento", valor: (v) => v.formaPagamento },
      ],
      r.vendas
    );
  }

  function exportarAgendamentos() {
    baixarCSV(
      `agendamentos-${meses[0]}-a-${meses[meses.length - 1]}.csv`,
      [
        { titulo: "Data", valor: (a) => formatDataBR(a.data) },
        { titulo: "Hora", valor: (a) => a.hora },
        { titulo: "Pet", valor: (a) => derived.petInfo(a.petId)?.nome || "" },
        { titulo: "Cliente", valor: (a) => derived.clienteDoPet(a.petId)?.nome || "" },
        { titulo: "Serviço", valor: (a) => a.servico },
        { titulo: "Status", valor: (a) => a.status },
        { titulo: "Valor", valor: (a) => numeroCSV(a.valor) },
      ],
      r.agendamentos
    );
  }

  function exportarDespesas() {
    baixarCSV(
      `despesas-${meses[0]}-a-${meses[meses.length - 1]}.csv`,
      [
        { titulo: "Data", valor: (d) => formatDataBR(d.data) },
        { titulo: "Descrição", valor: (d) => d.descricao },
        { titulo: "Valor", valor: (d) => numeroCSV(d.valor) },
      ],
      r.despesas
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Relatórios</h2>
          <p className="text-xs text-gray-400 first-letter:uppercase">{rotuloPeriodo}</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 border rounded-lg p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.meses}
              onClick={() => setPeriodo(p.meses)}
              className={`px-3 py-1 text-sm rounded ${
                periodo === p.meses ? "bg-white shadow-sm font-medium text-blue-700" : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Cartao
          icone={TrendingUp}
          label="Faturamento"
          valor={formatBRL(r.totais.entradas)}
          detalhe={r.melhorMes ? `melhor mês: ${nomeDoMes(r.melhorMes.mes).split(" de ")[0]}` : "sem entradas no período"}
        />
        <Cartao
          icone={Receipt}
          label="Resultado"
          valor={formatBRL(r.totais.saldo)}
          detalhe={`despesas ${formatBRL(r.totais.despesas)}`}
        />
        <Cartao
          icone={Scissors}
          label="Atendimentos"
          valor={r.atendimentos}
          detalhe={r.atendimentos > 0 ? `ticket médio ${formatBRL(r.ticketMedio)}` : "nenhum concluído"}
        />
        <Cartao
          icone={Ban}
          label="Cancelamentos"
          valor={`${(r.taxaCancelamento * 100).toFixed(0)}%`}
          detalhe={`de ${r.totalAgendamentos} agendamentos`}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Entradas x despesas por mês</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> Entradas</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400" /> Despesas</span>
          </div>
        </div>
        <div className="flex items-end gap-2 sm:gap-4 h-48 border-b px-1">
          {r.serie.map((m) => (
            <div key={m.mes} className="flex-1 min-w-0 h-full flex flex-col justify-end items-center gap-1">
              <div className="flex items-end gap-1 w-full justify-center flex-1">
                <div
                  className="w-1/2 max-w-[28px] bg-green-500 rounded-t"
                  style={{ height: `${(m.entradas / maiorBarra) * 100}%` }}
                  title={`Entradas: ${formatBRL(m.entradas)}`}
                />
                <div
                  className="w-1/2 max-w-[28px] bg-red-400 rounded-t"
                  style={{ height: `${(m.despesas / maiorBarra) * 100}%` }}
                  title={`Despesas: ${formatBRL(m.despesas)}`}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 sm:gap-4 px-1 mt-1">
          {r.serie.map((m) => (
            <div key={m.mes} className="flex-1 min-w-0 text-center">
              <p className="text-xs text-gray-500 capitalize truncate">
                {nomeDoMes(m.mes).split(" de ")[0].slice(0, 3)}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{formatBRL(m.saldo)}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-1">Valor abaixo do mês = saldo (entradas − despesas).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Ranking
          titulo="Serviços que mais faturam"
          itens={r.topServicos}
          vazio="Nenhum atendimento concluído no período."
          formatarDetalhe={(i) => `${i.quantidade} ${i.quantidade === 1 ? "atendimento" : "atendimentos"}`}
        />
        <Ranking
          titulo="Itens mais vendidos"
          itens={r.topItens}
          vazio="Nenhuma venda no período."
          formatarDetalhe={(i) => `${i.quantidade} ${i.quantidade === 1 ? "venda" : "vendas"}`}
        />
        <Ranking titulo="Melhores clientes" itens={r.topClientes} vazio="Sem receita por cliente no período." />
        <Ranking
          titulo="Vendas por forma de pagamento"
          itens={r.porPagamento}
          vazio="Nenhuma venda no período."
          formatarDetalhe={(i) => `${i.quantidade} ${i.quantidade === 1 ? "venda" : "vendas"}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-3">Dias mais movimentados</h3>
          <ul className="space-y-1.5">
            {r.porDiaSemana.map((d) => (
              <li key={d.nome} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-gray-600">{d.nome}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full">
                  <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${(d.quantidade / maiorDia) * 100}%` }} />
                </div>
                <span className="w-6 text-right text-gray-500">{d.quantidade}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-gray-400 mt-2">Atendimentos concluídos.</p>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Agendamentos por status</h3>
          <ul className="space-y-1.5">
            {r.porStatus.map((s) => (
              <li key={s.status} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                <span>{s.status}</span>
                <span className="font-medium">{s.quantidade}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Exportar para Excel</h3>
        <p className="text-xs text-gray-400 mb-3">Arquivos CSV do período selecionado.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportarVendas} disabled={r.vendas.length === 0}>
            <Download size={16} /> Vendas ({r.vendas.length})
          </Button>
          <Button variant="secondary" onClick={exportarAgendamentos} disabled={r.agendamentos.length === 0}>
            <Download size={16} /> Agendamentos ({r.agendamentos.length})
          </Button>
          <Button variant="secondary" onClick={exportarDespesas} disabled={r.despesas.length === 0}>
            <Download size={16} /> Despesas ({r.despesas.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
