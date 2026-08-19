import { test } from "node:test";
import assert from "node:assert/strict";
import { agruparPorDia, dentroDoPeriodo, gerarRelatorio, intervaloDoPeriodo } from "../src/utils/relatorios.js";

const hoje = new Date(2026, 7, 19); // 19/08/2026, uma quarta

const estado = () => ({
  clientes: [
    { id: "c1", nome: "Ana" },
    { id: "c2", nome: "Bruno" },
  ],
  pets: [],
  produtos: [{ id: "p1", nome: "Ração Premium", precoCusto: 120, precoVenda: 189.9 }],
  movimentacoes: [],
  planos: [
    { id: "basico", nome: "Básico", preco: 99 },
    { id: "plus", nome: "Plus", preco: 159 },
  ],
  assinaturas: [
    { id: "a1", clienteId: "c1", planoId: "basico", dataInicio: "2026-08-05" },
    { id: "a2", clienteId: "c2", planoId: "plus", dataInicio: "2026-07-10" },
  ],
  vendas: [
    { id: "v1", item: "Banho", qtd: 2, valor: 40, clienteId: "c1", data: "2026-08-05", formaPagamento: "Pix" },
    { id: "v2", item: "Ração Premium", produtoId: "p1", qtd: 1, valor: 189.9, clienteId: "c2", data: "2026-08-05", formaPagamento: "Cartão" },
    { id: "v3", item: "Tosa", qtd: 1, valor: 35, clienteId: "c1", data: "2026-08-19", formaPagamento: "Pix" },
    { id: "v4", item: "Banho", qtd: 1, valor: 40, clienteId: "", data: "2026-07-20", formaPagamento: "Pix" },
  ],
  despesas: [
    { id: "d1", descricao: "Shampoo", valor: 100, data: "2026-08-10" },
    { id: "d2", descricao: "Aluguel", valor: 900, data: "2026-07-01" },
  ],
  agendamentos: [
    { id: "ag1", data: "2026-08-05", status: "Concluído" },
    { id: "ag2", data: "2026-08-06", status: "Concluído" },
    { id: "ag3", data: "2026-08-07", status: "Cancelado" },
    { id: "ag4", data: "2026-08-25", status: "Agendado" },
    { id: "ag5", data: "2026-07-15", status: "Concluído" },
  ],
});

test("os períodos prontos viram o intervalo certo", () => {
  assert.deepEqual(intervaloDoPeriodo("esteMes", hoje), { de: "2026-08-01", ate: "2026-08-31" });
  assert.deepEqual(intervaloDoPeriodo("mesPassado", hoje), { de: "2026-07-01", ate: "2026-07-31" });
  assert.deepEqual(intervaloDoPeriodo("ultimos30", hoje), { de: "2026-07-21", ate: "2026-08-19" });
  assert.deepEqual(intervaloDoPeriodo("esteAno", hoje), { de: "2026-01-01", ate: "2026-12-31" });
});

test("mês passado em janeiro volta para dezembro do ano anterior", () => {
  assert.deepEqual(intervaloDoPeriodo("mesPassado", new Date(2026, 0, 15)), {
    de: "2025-12-01",
    ate: "2025-12-31",
  });
});

test("dentroDoPeriodo inclui as duas pontas", () => {
  const i = { de: "2026-08-01", ate: "2026-08-31" };
  assert.equal(dentroDoPeriodo("2026-08-01", i), true);
  assert.equal(dentroDoPeriodo("2026-08-31", i), true);
  assert.equal(dentroDoPeriodo("2026-07-31", i), false);
  assert.equal(dentroDoPeriodo("2026-09-01", i), false);
  assert.equal(dentroDoPeriodo(undefined, i), false, "venda antiga sem data fica de fora");
});

test("faturamento do mês soma vendas do período e planos iniciados nele", () => {
  const r = gerarRelatorio(estado(), intervaloDoPeriodo("esteMes", hoje));
  assert.equal(r.totalVendas, 80 + 189.9 + 35, "só as vendas de agosto");
  assert.equal(r.totalAssinaturas, 99, "só o plano que começou em agosto");
  assert.equal(r.faturamento, 403.9);
  assert.equal(r.despesas, 100);
  assert.equal(r.lucro, 303.9);
  assert.equal(r.quantidadeVendas, 3);
  assert.equal(Number(r.ticketMedio.toFixed(2)), 101.63);
});

test("receita recorrente conta todas as assinaturas ativas, fora do período", () => {
  const r = gerarRelatorio(estado(), intervaloDoPeriodo("esteMes", hoje));
  assert.equal(r.receitaRecorrente, 99 + 159);
});

test("o mês passado enxerga outros números", () => {
  const r = gerarRelatorio(estado(), intervaloDoPeriodo("mesPassado", hoje));
  assert.equal(r.totalVendas, 40);
  assert.equal(r.totalAssinaturas, 159);
  assert.equal(r.despesas, 900);
  assert.equal(r.lucro, 40 + 159 - 900);
});

test("serviços e produtos são ranqueados separadamente", () => {
  const r = gerarRelatorio(estado(), intervaloDoPeriodo("esteMes", hoje));
  assert.deepEqual(r.topServicos.map((s) => s.chave), ["Banho", "Tosa"]);
  assert.equal(r.topServicos[0].total, 80);
  assert.deepEqual(r.topProdutos.map((p) => p.chave), ["Ração Premium"]);
  assert.equal(r.topProdutos[0].total, 189.9);
});

test("melhores clientes somam o que cada um gastou; venda avulsa não entra", () => {
  const r = gerarRelatorio(estado(), intervaloDoPeriodo("esteMes", hoje));
  assert.deepEqual(r.topClientes.map((c) => [c.chave, c.total]), [
    ["Bruno", 189.9],
    ["Ana", 115],
  ]);
});

test("agendamentos são contados por status, com taxa de conclusão", () => {
  const r = gerarRelatorio(estado(), intervaloDoPeriodo("esteMes", hoje));
  assert.equal(r.agendamentos.total, 4);
  assert.equal(r.agendamentos["Concluído"], 2);
  assert.equal(r.agendamentos["Cancelado"], 1);
  assert.equal(r.agendamentos["Agendado"], 1);
  assert.equal(r.agendamentos.taxaConclusao, 2 / 3, "os ainda agendados não entram na conta");
});

test("sem agendamentos finalizados a taxa é nula, não zero", () => {
  const s = estado();
  s.agendamentos = [{ id: "x", data: "2026-08-10", status: "Agendado" }];
  const r = gerarRelatorio(s, intervaloDoPeriodo("esteMes", hoje));
  assert.equal(r.agendamentos.taxaConclusao, null);
});

test("período sem movimento devolve tudo zerado, sem quebrar", () => {
  const r = gerarRelatorio(estado(), { de: "2020-01-01", ate: "2020-01-31" });
  assert.equal(r.faturamento, 0);
  assert.equal(r.ticketMedio, 0);
  assert.deepEqual(r.topServicos, []);
  assert.equal(r.agendamentos.taxaConclusao, null);
});

test("a série diária cobre todos os dias, inclusive os vazios", () => {
  const s = estado();
  const serie = agruparPorDia(s.vendas, { de: "2026-08-01", ate: "2026-08-31" });
  assert.equal(serie.length, 31);
  assert.equal(serie[0].data, "2026-08-01");
  assert.equal(serie.at(-1).data, "2026-08-31");
  assert.equal(serie.find((d) => d.data === "2026-08-05").total, 80 + 189.9);
  assert.equal(serie.find((d) => d.data === "2026-08-02").total, 0);
});

test("período longo demais não gera série diária ilegível", () => {
  assert.deepEqual(agruparPorDia([], { de: "2026-01-01", ate: "2026-12-31" }), []);
});

test("intervalo invertido não gera série", () => {
  assert.deepEqual(agruparPorDia([], { de: "2026-08-31", ate: "2026-08-01" }), []);
});
