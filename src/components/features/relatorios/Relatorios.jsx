import { useMemo, useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Wallet, Receipt, CheckCircle2, XCircle, CalendarClock, Repeat } from "lucide-react";
import Input from "../../common/Input";
import EmptyState from "../../common/EmptyState";
import { formatCurrency, formatDateBR } from "../../../utils/format";
import { PERIODOS, gerarRelatorio, intervaloDoPeriodo } from "../../../utils/relatorios.js";

// Um único hue para magnitude: o comprimento da barra é que codifica o valor,
// a cor não carrega informação nenhuma.
const HUE = "#256abf";

const classeSelect =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function Metrica({ icon: Icon, titulo, valor, detalhe, tom = "neutro" }) {
  const tons = {
    neutro: "text-gray-500",
    positivo: "text-green-700",
    negativo: "text-red-700",
  };
  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Icon size={14} /> {titulo}
      </div>
      <p className={`font-semibold text-xl mt-1 ${tons[tom]}`}>{valor}</p>
      {detalhe && <p className="text-xs text-gray-400 mt-1">{detalhe}</p>}
    </div>
  );
}

/** Barras horizontais ordenadas: rótulo, barra e valor, sem legenda (série única). */
function Ranking({ titulo, itens, vazio, formatar = formatCurrency }) {
  const maior = Math.max(...itens.map((i) => i.total), 0);

  return (
    <div className="border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{titulo}</h3>
      {itens.length === 0 ? (
        <p className="text-sm text-gray-400">{vazio}</p>
      ) : (
        <ul className="space-y-3">
          {itens.map((item) => (
            <li key={item.chave}>
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="text-sm text-gray-700 truncate">{item.chave}</span>
                <span className="text-sm font-medium tabular-nums shrink-0">{formatar(item.total)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-sm">
                <div
                  className="h-full rounded-r"
                  style={{
                    width: maior > 0 ? `${Math.max((item.total / maior) * 100, 2)}%` : "0%",
                    backgroundColor: HUE,
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {item.quantidade} {item.quantidade === 1 ? "unidade" : "unidades"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Colunas do faturamento diário. Valores no hover, para não poluir com 31 números. */
function FaturamentoPorDia({ serie }) {
  const maior = Math.max(...serie.map((d) => d.total), 0);

  if (serie.length === 0) {
    return (
      <div className="border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Faturamento por dia</h3>
        <p className="text-sm text-gray-400">
          Disponível para períodos de até 3 meses — em intervalos maiores a série diária fica ilegível.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Faturamento por dia</h3>
        <span className="text-xs text-gray-400">Maior dia: {formatCurrency(maior)}</span>
      </div>

      {maior === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma venda registrada neste período.</p>
      ) : (
        <>
          <div className="flex items-end gap-[2px] h-40 border-b border-gray-200">
            {serie.map((dia) => (
              <div
                key={dia.data}
                className="flex-1 h-full flex items-end group relative"
                title={`${formatDateBR(dia.data)}: ${formatCurrency(dia.total)}`}
              >
                <div
                  className="w-full max-w-[24px] mx-auto rounded-t transition-opacity group-hover:opacity-70"
                  style={{
                    height: dia.total > 0 ? `${Math.max((dia.total / maior) * 100, 2)}%` : "0",
                    backgroundColor: HUE,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{formatDateBR(serie[0].data)}</span>
            <span>{formatDateBR(serie.at(-1).data)}</span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Status dos agendamentos com ícone e rótulo em cada linha.
 * Não usamos barra empilhada colorida: verde e vermelho lado a lado ficam
 * indistinguíveis para quem tem daltonismo do tipo deutan.
 */
function StatusAgendamentos({ dados }) {
  const linhas = [
    { rotulo: "Concluídos", valor: dados["Concluído"], icon: CheckCircle2, cor: "text-green-700" },
    { rotulo: "Cancelados", valor: dados["Cancelado"], icon: XCircle, cor: "text-red-700" },
    { rotulo: "Ainda agendados", valor: dados["Agendado"], icon: CalendarClock, cor: "text-blue-700" },
  ];

  return (
    <div className="border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Agendamentos no período</h3>

      {dados.total === 0 ? (
        <p className="text-sm text-gray-400">Nenhum agendamento neste período.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {linhas.map(({ rotulo, valor, icon: Icon, cor }) => (
              <li key={rotulo} className="flex items-center justify-between gap-3">
                <span className={`flex items-center gap-2 text-sm ${cor}`}>
                  <Icon size={16} /> {rotulo}
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {valor}
                  <span className="text-gray-400 font-normal">
                    {" "}
                    ({Math.round((valor / dados.total) * 100)}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {dados.taxaConclusao !== null && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-400">Taxa de conclusão</p>
              <p className="text-2xl font-bold mt-0.5">{Math.round(dados.taxaConclusao * 100)}%</p>
              <p className="text-xs text-gray-400 mt-1">
                Entre os já finalizados; os ainda agendados não entram na conta.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Relatorios({ state }) {
  const [periodo, setPeriodo] = useState("esteMes");
  const [personalizado, setPersonalizado] = useState(() => intervaloDoPeriodo("esteMes"));

  const intervalo = periodo === "personalizado" ? personalizado : intervaloDoPeriodo(periodo);
  const intervaloValido = intervalo.de && intervalo.ate && intervalo.de <= intervalo.ate;

  const relatorio = useMemo(
    () => (intervaloValido ? gerarRelatorio(state, intervalo) : null),
    [state, intervalo.de, intervalo.ate, intervaloValido]
  );

  const semMovimento =
    relatorio && relatorio.faturamento === 0 && relatorio.despesas === 0 && relatorio.agendamentos.total === 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Relatórios</h2>

      {/* Filtros em uma linha, acima de tudo */}
      <div className="border rounded-xl p-4 bg-gray-50">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Período">
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className={classeSelect}>
              {Object.entries(PERIODOS).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>{rotulo}</option>
              ))}
            </select>
          </Input>

          {periodo === "personalizado" && (
            <>
              <Input
                label="De"
                type="date"
                value={personalizado.de}
                onChange={(e) => setPersonalizado({ ...personalizado, de: e.target.value })}
              />
              <Input
                label="Até"
                type="date"
                value={personalizado.ate}
                erro={intervaloValido ? "" : "A data final precisa ser depois da inicial."}
                onChange={(e) => setPersonalizado({ ...personalizado, ate: e.target.value })}
              />
            </>
          )}
        </div>
        {intervaloValido && (
          <p className="text-xs text-gray-500 mt-3">
            {formatDateBR(intervalo.de)} até {formatDateBR(intervalo.ate)}
          </p>
        )}
      </div>

      {!relatorio ? (
        <EmptyState icon={BarChart3} titulo="Escolha um período válido" />
      ) : semMovimento ? (
        <EmptyState
          icon={BarChart3}
          titulo="Nenhum movimento neste período"
          descricao="Registre vendas, despesas ou agendamentos para ver os números aqui."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Metrica
              icon={TrendingUp}
              titulo="Faturamento"
              valor={formatCurrency(relatorio.faturamento)}
              detalhe={`Vendas ${formatCurrency(relatorio.totalVendas)} + planos ${formatCurrency(relatorio.totalAssinaturas)}`}
              tom="positivo"
            />
            <Metrica icon={TrendingDown} titulo="Despesas" valor={formatCurrency(relatorio.despesas)} tom="negativo" />
            <Metrica
              icon={Wallet}
              titulo="Lucro"
              valor={formatCurrency(relatorio.lucro)}
              tom={relatorio.lucro >= 0 ? "positivo" : "negativo"}
            />
            <Metrica
              icon={Receipt}
              titulo="Ticket médio"
              valor={formatCurrency(relatorio.ticketMedio)}
              detalhe={`${relatorio.quantidadeVendas} ${relatorio.quantidadeVendas === 1 ? "venda" : "vendas"}`}
            />
          </div>

          <div className="border rounded-xl p-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Repeat size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">Receita recorrente das assinaturas ativas:</span>
            <span className="text-sm font-semibold">{formatCurrency(relatorio.receitaRecorrente)}/mês</span>
            <span className="text-xs text-gray-400 w-full sm:w-auto">
              valor atual, independente do período escolhido
            </span>
          </div>

          <FaturamentoPorDia serie={relatorio.porDia} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Ranking
              titulo="Serviços mais vendidos"
              itens={relatorio.topServicos}
              vazio="Nenhum serviço vendido neste período."
            />
            <Ranking
              titulo="Produtos mais vendidos"
              itens={relatorio.topProdutos}
              vazio="Nenhum produto vendido neste período."
            />
            <Ranking
              titulo="Clientes que mais gastaram"
              itens={relatorio.topClientes}
              vazio="Nenhuma venda vinculada a um cliente neste período."
            />
            <StatusAgendamentos dados={relatorio.agendamentos} />
          </div>
        </>
      )}
    </div>
  );
}
