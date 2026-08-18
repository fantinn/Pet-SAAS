import { test } from "node:test";
import assert from "node:assert/strict";
import { migrarEstado } from "../src/data/migrarEstado.js";
import { ESTADO_INICIAL } from "../src/data/constants.js";

test("primeiro acesso usa o estado inicial", () => {
  assert.deepEqual(migrarEstado(null, ESTADO_INICIAL), ESTADO_INICIAL);
  assert.deepEqual(migrarEstado(undefined, ESTADO_INICIAL), ESTADO_INICIAL);
});

test("estado antigo recebe as chaves que ainda não existiam", () => {
  const antigo = {
    clientes: [{ id: 1, nome: "Ana" }],
    pets: [{ id: 2, nome: "Rex", clienteId: 1 }],
    agendamentos: [{ id: 3, petId: 2, valor: "40", data: "2026-01-01", hora: "09:00" }],
    vendas: [{ id: 4, qtd: "2", valor: "10.5" }],
    despesas: [],
    assinaturas: [],
  };

  const m = migrarEstado(antigo, ESTADO_INICIAL);

  assert.equal(m.servicos.length, 5);
  assert.equal(m.planos.length, 3);
  assert.deepEqual(m.configuracoes, ESTADO_INICIAL.configuracoes);
  assert.equal(m.clientes[0].nome, "Ana", "dados do usuário são preservados");
});

test("números salvos como texto são normalizados", () => {
  const m = migrarEstado(
    {
      agendamentos: [{ valor: "40" }],
      vendas: [{ qtd: "2", valor: "10.5" }],
      despesas: [{ valor: "99.9" }],
      servicos: [{ nome: "Banho", preco: "40", duracao: "60" }],
      planos: [{ id: "x", preco: "99" }],
    },
    ESTADO_INICIAL
  );

  assert.equal(m.agendamentos[0].valor, 40);
  assert.equal(m.vendas[0].qtd * m.vendas[0].valor, 21);
  assert.equal(m.despesas[0].valor, 99.9);
  assert.equal(m.servicos[0].preco, 40);
  assert.equal(m.planos[0].preco, 99);
});

test("campos ausentes ganham um padrão seguro", () => {
  const m = migrarEstado({ pets: [{ id: 1, nome: "Rex" }], agendamentos: [{ id: 2 }] }, ESTADO_INICIAL);
  assert.equal(m.pets[0].observacoes, "");
  assert.equal(m.agendamentos[0].status, "Agendado");
  assert.equal(m.agendamentos[0].valor, 0);
});

test("configuração parcial é completada com os padrões", () => {
  const m = migrarEstado({ configuracoes: { horarioFechamento: 20 } }, ESTADO_INICIAL);
  assert.deepEqual(m.configuracoes, { horarioAbertura: 8, horarioFechamento: 20, intervaloMinutos: 30 });
});

test("lista esvaziada pelo usuário não volta com os dados de exemplo", () => {
  const m = migrarEstado({ clientes: [], pets: [] }, ESTADO_INICIAL);
  assert.deepEqual(m.clientes, []);
  assert.deepEqual(m.pets, []);
});
