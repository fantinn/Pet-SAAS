import { formatDate } from "./format.js";
import { mesmoId } from "./id.js";

/** Períodos prontos oferecidos na tela. */
export const PERIODOS = {
  esteMes: "Este mês",
  mesPassado: "Mês passado",
  ultimos30: "Últimos 30 dias",
  esteAno: "Este ano",
  personalizado: "Personalizado",
};

/** Converte a opção escolhida em um intervalo { de, ate } no formato AAAA-MM-DD. */
export function intervaloDoPeriodo(periodo, hoje = new Date()) {
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  switch (periodo) {
    case "mesPassado":
      return { de: formatDate(new Date(ano, mes - 1, 1)), ate: formatDate(new Date(ano, mes, 0)) };
    case "ultimos30": {
      const inicio = new Date(hoje);
      inicio.setDate(inicio.getDate() - 29);
      return { de: formatDate(inicio), ate: formatDate(hoje) };
    }
    case "esteAno":
      return { de: formatDate(new Date(ano, 0, 1)), ate: formatDate(new Date(ano, 11, 31)) };
    case "esteMes":
    default:
      return { de: formatDate(new Date(ano, mes, 1)), ate: formatDate(new Date(ano, mes + 1, 0)) };
  }
}

/** Datas são texto AAAA-MM-DD, então a comparação alfabética já é cronológica. */
export function dentroDoPeriodo(data, { de, ate }) {
  if (!data) return false;
  return data >= de && data <= ate;
}

const somaVenda = (v) => v.qtd * v.valor;

/** Agrupa somando por uma chave e devolve os maiores primeiro. */
function ranking(itens, chaveDe, valorDe, limite = 5) {
  const mapa = new Map();
  for (const item of itens) {
    const chave = chaveDe(item);
    if (chave === null || chave === undefined || chave === "") continue;
    const atual = mapa.get(chave) || { chave, total: 0, quantidade: 0 };
    atual.total += valorDe(item);
    atual.quantidade += Number(item.qtd) || 1;
    mapa.set(chave, atual);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total).slice(0, limite);
}

/**
 * Apura tudo o que a tela de Relatórios mostra.
 *
 * Sobre as assinaturas: não existe registro de cobrança mês a mês, só a data de
 * início. Então a receita de um plano entra no período em que a assinatura
 * começou — a mesma conta que o Financeiro faz — e a receita recorrente é
 * mostrada à parte, como um valor sempre atual.
 */
export function gerarRelatorio(state, intervalo) {
  const vendas = state.vendas.filter((v) => dentroDoPeriodo(v.data, intervalo));
  const despesasDoPeriodo = state.despesas.filter((d) => dentroDoPeriodo(d.data, intervalo));
  const assinaturasNovas = state.assinaturas.filter((a) => dentroDoPeriodo(a.dataInicio, intervalo));
  const agendamentos = state.agendamentos.filter((a) => dentroDoPeriodo(a.data, intervalo));

  const totalVendas = vendas.reduce((s, v) => s + somaVenda(v), 0);
  const totalAssinaturas = assinaturasNovas.reduce(
    (s, a) => s + (state.planos.find((p) => mesmoId(p.id, a.planoId))?.preco || 0),
    0
  );
  const faturamento = totalVendas + totalAssinaturas;
  const despesas = despesasDoPeriodo.reduce((s, d) => s + d.valor, 0);

  const receitaRecorrente = state.assinaturas.reduce(
    (s, a) => s + (state.planos.find((p) => mesmoId(p.id, a.planoId))?.preco || 0),
    0
  );

  const idsDeProduto = new Set(state.produtos.map((p) => String(p.id)));
  const vendasDeProduto = vendas.filter((v) => v.produtoId && idsDeProduto.has(String(v.produtoId)));
  const vendasDeServico = vendas.filter((v) => !v.produtoId);

  const nomeDoProduto = (id) => state.produtos.find((p) => mesmoId(p.id, id))?.nome || "Produto removido";
  const nomeDoCliente = (id) => state.clientes.find((c) => mesmoId(c.id, id))?.nome || "Cliente removido";

  const porStatus = { Agendado: 0, Concluído: 0, Cancelado: 0 };
  for (const a of agendamentos) {
    if (porStatus[a.status] !== undefined) porStatus[a.status] += 1;
  }
  const finalizados = porStatus["Concluído"] + porStatus["Cancelado"];

  return {
    intervalo,
    faturamento,
    totalVendas,
    totalAssinaturas,
    despesas,
    lucro: faturamento - despesas,
    receitaRecorrente,
    quantidadeVendas: vendas.length,
    ticketMedio: vendas.length ? totalVendas / vendas.length : 0,

    porDia: agruparPorDia(vendas, intervalo),

    topServicos: ranking(vendasDeServico, (v) => v.item, somaVenda),
    topProdutos: ranking(vendasDeProduto, (v) => nomeDoProduto(v.produtoId), somaVenda),
    topClientes: ranking(
      vendas.filter((v) => v.clienteId),
      (v) => nomeDoCliente(v.clienteId),
      somaVenda
    ),

    agendamentos: {
      total: agendamentos.length,
      ...porStatus,
      taxaConclusao: finalizados ? porStatus["Concluído"] / finalizados : null,
    },
  };
}

/** Série diária do faturamento de vendas, com os dias vazios preenchidos com zero. */
export function agruparPorDia(vendas, { de, ate }, limiteDeDias = 92) {
  const inicio = new Date(`${de}T00:00:00`);
  const fim = new Date(`${ate}T00:00:00`);
  if (Number.isNaN(inicio) || Number.isNaN(fim) || fim < inicio) return [];

  const dias = Math.round((fim - inicio) / 86400000) + 1;
  // Períodos muito longos viram uma serra ilegível: aí a série diária não ajuda.
  if (dias > limiteDeDias) return [];

  const totais = new Map();
  for (const v of vendas) {
    totais.set(v.data, (totais.get(v.data) || 0) + somaVenda(v));
  }

  const serie = [];
  for (let i = 0; i < dias; i++) {
    const dia = new Date(inicio);
    dia.setDate(dia.getDate() + i);
    const chave = formatDate(dia);
    serie.push({ data: chave, total: totais.get(chave) || 0 });
  }
  return serie;
}
