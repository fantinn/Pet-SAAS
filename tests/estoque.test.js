import { test } from "node:test";
import assert from "node:assert/strict";
import { appReducer, actionTypes as A } from "../src/context/appReducer.js";
import { ESTADO_INICIAL } from "../src/data/constants.js";

const estado = () => JSON.parse(JSON.stringify(ESTADO_INICIAL));
const racao = (s) => s.produtos.find((p) => p.id === "prod-racao");
const vender = (s, extra = {}) =>
  appReducer(s, {
    type: A.ADD_VENDA,
    payload: { item: "Ração Premium 10kg", produtoId: "prod-racao", qtd: 2, valor: 189.9, data: "2026-08-19", ...extra },
  });

test("cadastrar produto registra o estoque inicial como entrada", () => {
  const s = appReducer(estado(), {
    type: A.ADD_PRODUTO,
    payload: { nome: "Coleira", categoria: "Acessórios", precoVenda: "45", precoCusto: "20", quantidade: "10", estoqueMinimo: "2" },
  });
  const novo = s.produtos.at(-1);
  assert.equal(novo.quantidade, 10);
  assert.equal(novo.precoVenda, 45, "preço vem como número");

  const mov = s.movimentacoes[0];
  assert.equal(mov.tipo, "entrada");
  assert.equal(mov.quantidade, 10);
  assert.equal(mov.quantidadeAnterior, 0);
  assert.equal(mov.quantidadeFinal, 10);
});

test("produto sem estoque inicial não gera movimentação", () => {
  const s = appReducer(estado(), {
    type: A.ADD_PRODUTO,
    payload: { nome: "Coleira", precoVenda: 45, precoCusto: 20, quantidade: 0, estoqueMinimo: 2 },
  });
  assert.equal(s.movimentacoes.length, 0);
});

test("vender um produto dá baixa no estoque", () => {
  const s = vender(estado());
  assert.equal(racao(s).quantidade, 6, "8 - 2");
  const mov = s.movimentacoes[0];
  assert.equal(mov.tipo, "venda");
  assert.equal(mov.vendaId, s.vendas[0].id, "a movimentação aponta para a venda");
});

test("vender um serviço não mexe no estoque", () => {
  const s = appReducer(estado(), {
    type: A.ADD_VENDA,
    payload: { item: "Banho", qtd: 1, valor: 40, data: "2026-08-19" },
  });
  assert.equal(racao(s).quantidade, 8);
  assert.equal(s.movimentacoes.length, 0);
});

test("excluir a venda devolve o produto ao estoque", () => {
  let s = vender(estado());
  assert.equal(racao(s).quantidade, 6);

  s = appReducer(s, { type: A.DELETE_VENDA, payload: s.vendas[0].id });
  assert.equal(racao(s).quantidade, 8, "voltou ao que era");
  assert.equal(s.movimentacoes[0].tipo, "estorno");
  assert.equal(s.movimentacoes.length, 2, "a venda e o estorno ficam no histórico");
});

test("excluir venda de serviço não inventa estorno", () => {
  let s = appReducer(estado(), { type: A.ADD_VENDA, payload: { item: "Banho", qtd: 1, valor: 40 } });
  s = appReducer(s, { type: A.DELETE_VENDA, payload: s.vendas[0].id });
  assert.equal(s.movimentacoes.length, 0);
});

test("o estoque nunca fica negativo", () => {
  const s = vender(estado(), { qtd: 999 });
  assert.equal(racao(s).quantidade, 0);
  assert.equal(s.movimentacoes[0].quantidadeFinal, 0);
});

test("perda e uso interno tiram do estoque; entrada acrescenta", () => {
  let s = appReducer(estado(), {
    type: A.MOVIMENTAR_ESTOQUE,
    payload: { produtoId: "prod-racao", tipo: "perda", quantidade: 1, observacao: "Saco rasgado" },
  });
  assert.equal(racao(s).quantidade, 7);

  s = appReducer(s, { type: A.MOVIMENTAR_ESTOQUE, payload: { produtoId: "prod-racao", tipo: "uso", quantidade: 2 } });
  assert.equal(racao(s).quantidade, 5);

  s = appReducer(s, { type: A.MOVIMENTAR_ESTOQUE, payload: { produtoId: "prod-racao", tipo: "entrada", quantidade: 10 } });
  assert.equal(racao(s).quantidade, 15);
  assert.equal(s.movimentacoes[0].observacao, "");
});

test("movimentação inválida não altera nada", () => {
  const inicial = estado();
  for (const payload of [
    { produtoId: "nao-existe", tipo: "entrada", quantidade: 5 },
    { produtoId: "prod-racao", tipo: "tipo-inventado", quantidade: 5 },
    { produtoId: "prod-racao", tipo: "entrada", quantidade: 0 },
  ]) {
    const s = appReducer(inicial, { type: A.MOVIMENTAR_ESTOQUE, payload });
    assert.deepEqual(s.produtos, inicial.produtos);
    assert.deepEqual(s.movimentacoes, []);
  }
});

test("ajuste de inventário grava a diferença e o valor final", () => {
  const s = appReducer(estado(), {
    type: A.AJUSTAR_ESTOQUE,
    payload: { produtoId: "prod-racao", novaQuantidade: 5, observacao: "Contagem do mês" },
  });
  assert.equal(racao(s).quantidade, 5);
  const mov = s.movimentacoes[0];
  assert.equal(mov.tipo, "ajuste");
  assert.equal(mov.quantidade, 3, "diferença entre 8 e 5");
  assert.equal(mov.quantidadeAnterior, 8);
  assert.equal(mov.quantidadeFinal, 5);
});

test("ajuste para a mesma quantidade não vira movimentação", () => {
  const s = appReducer(estado(), { type: A.AJUSTAR_ESTOQUE, payload: { produtoId: "prod-racao", novaQuantidade: 8 } });
  assert.deepEqual(s.movimentacoes, []);
});

test("editar o produto não altera a quantidade pelo cadastro", () => {
  const s = appReducer(estado(), {
    type: A.UPDATE_PRODUTO,
    payload: { id: "prod-racao", nome: "Ração Super Premium", precoVenda: "199.9", quantidade: 999 },
  });
  assert.equal(racao(s).nome, "Ração Super Premium");
  assert.equal(racao(s).precoVenda, 199.9);
  assert.equal(racao(s).quantidade, 8, "quantidade só muda por movimentação");
});

test("excluir produto limpa o histórico dele e desvincula as vendas", () => {
  let s = vender(estado());
  s = appReducer(s, { type: A.DELETE_PRODUTO, payload: "prod-racao" });
  assert.equal(s.produtos.some((p) => p.id === "prod-racao"), false);
  assert.deepEqual(s.movimentacoes, []);
  assert.equal(s.vendas.length, 1, "a venda continua no histórico financeiro");
  assert.equal(s.vendas[0].produtoId, null);
});
