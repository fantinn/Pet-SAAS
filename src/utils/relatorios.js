import { deslocarMes } from "./format";

// Lista de "YYYY-MM" dos últimos `quantidade` meses, do mais antigo ao atual.
export function ultimosMeses(mesAtualRef, quantidade) {
  return Array.from({ length: quantidade }, (_, i) => deslocarMes(mesAtualRef, i - (quantidade - 1)));
}

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function agrupar(itens, chave, valor) {
  const mapa = new Map();
  for (const item of itens) {
    const k = chave(item);
    const atual = mapa.get(k) || { nome: k, quantidade: 0, total: 0 };
    atual.quantidade += 1;
    atual.total += valor(item);
    mapa.set(k, atual);
  }
  return [...mapa.values()];
}

// Consolida os dados do app num relatório do período (lista de meses "YYYY-MM").
// Só lê o estado que já está em memória: nada de consulta nova ao banco.
export function calcularRelatorio({ state, derived, meses }) {
  const noPeriodo = (dataStr) => meses.includes((dataStr || "").slice(0, 7));

  const serie = meses.map((mes) => {
    const r = derived.resumoFinanceiro(mes);
    return { mes, entradas: r.totalEntradas, despesas: r.totalDespesas, saldo: r.saldo };
  });

  const totais = serie.reduce(
    (acc, m) => ({
      entradas: acc.entradas + m.entradas,
      despesas: acc.despesas + m.despesas,
      saldo: acc.saldo + m.saldo,
    }),
    { entradas: 0, despesas: 0, saldo: 0 }
  );

  const agendamentos = state.agendamentos.filter((a) => noPeriodo(a.data));
  const concluidos = agendamentos.filter((a) => a.status === "Concluído");
  const cancelados = agendamentos.filter((a) => a.status === "Cancelado");
  const vendas = state.vendas.filter((v) => noPeriodo(v.data));
  const despesas = state.despesas.filter((d) => noPeriodo(d.data));

  const totalServicos = concluidos.reduce((s, a) => s + a.valor, 0);

  const topServicos = agrupar(concluidos, (a) => a.servico, (a) => a.valor)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const topItens = agrupar(vendas, (v) => v.item, (v) => v.qtd * v.valor)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Receita por cliente: serviços concluídos dos pets dele + vendas no nome dele.
  const receitaPorCliente = new Map();
  const somar = (clienteId, valor) => {
    if (!clienteId) return;
    receitaPorCliente.set(clienteId, (receitaPorCliente.get(clienteId) || 0) + valor);
  };
  concluidos.forEach((a) => somar(derived.petInfo(a.petId)?.clienteId, a.valor));
  vendas.forEach((v) => somar(v.clienteId, v.qtd * v.valor));
  const topClientes = [...receitaPorCliente.entries()]
    .map(([clienteId, total]) => ({ clienteId, nome: derived.nomeCliente(clienteId), total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const porPagamento = agrupar(vendas, (v) => v.formaPagamento, (v) => v.qtd * v.valor).sort(
    (a, b) => b.total - a.total
  );

  const porStatus = ["Agendado", "Concluído", "Cancelado"].map((status) => ({
    status,
    quantidade: agendamentos.filter((a) => a.status === status).length,
  }));

  const porDiaSemana = DIAS_SEMANA.map((nome, dia) => ({
    nome,
    quantidade: concluidos.filter((a) => new Date(`${a.data}T00:00:00`).getDay() === dia).length,
  }));

  const melhorMes = serie.length ? serie.reduce((max, m) => (m.entradas > max.entradas ? m : max)) : null;

  return {
    serie,
    totais,
    atendimentos: concluidos.length,
    ticketMedio: concluidos.length ? totalServicos / concluidos.length : 0,
    taxaCancelamento: agendamentos.length ? cancelados.length / agendamentos.length : 0,
    totalAgendamentos: agendamentos.length,
    topServicos,
    topItens,
    topClientes,
    porPagamento,
    porStatus,
    porDiaSemana,
    melhorMes: melhorMes && melhorMes.entradas > 0 ? melhorMes : null,
    agendamentos,
    vendas,
    despesas,
  };
}
