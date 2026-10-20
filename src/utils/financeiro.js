export const centavos = valor => Math.round((Number(valor) + Number.EPSILON) * 100);
export const somarDinheiro = (items, valor) => items.reduce((sum, item) => sum + centavos(valor(item)), 0) / 100;

// Convenção do piloto: conclusão do serviço confirma seu recebimento.
// Mensalidades entram pelo dia do pagamento; pendências usam a competência.
export function resumoDoMes(state, mesRef, formas) {
  const noMes = data => (data || "").startsWith(mesRef);
  const servicos = state.agendamentos.filter(a => a.status === "Concluído" && noMes(a.data));
  const vendas = state.vendas.filter(v => !v.canceladaEm && noMes(v.data));
  const despesasDoMes = state.despesas.filter(d => !d.canceladaEm && noMes(d.data));
  const totalServicos = somarDinheiro(servicos, a => a.valor);
  const totalVendas = somarDinheiro(vendas, v => centavos(v.valor) * v.qtd / 100);
  const totalPlanos = somarDinheiro(state.mensalidades.filter(m => m.status === "Pago" && noMes(m.dataPagamento)), m => m.valor);
  const totalPlanosAReceber = somarDinheiro(state.mensalidades.filter(m => m.status === "Pendente" && m.mesRef === mesRef), m => m.valor);
  const totalDespesas = somarDinheiro(despesasDoMes, d => d.valor);
  const totalEntradas = (centavos(totalServicos) + centavos(totalVendas) + centavos(totalPlanos)) / 100;
  return {
    totalServicos,totalVendas,totalPlanos,totalPlanosAReceber,totalDespesas,totalEntradas,
    saldo: (centavos(totalEntradas)-centavos(totalDespesas))/100,despesasDoMes,
    qtdServicos:servicos.length,ticketMedio:servicos.length?totalServicos/servicos.length:0,
    totalPorPagamento:formas.map(forma => ({forma,total:somarDinheiro(vendas.filter(v=>v.formaPagamento===forma),v=>centavos(v.valor)*v.qtd/100)})),
  };
}
