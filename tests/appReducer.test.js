import { test } from "node:test";
import assert from "node:assert/strict";
import { appReducer, actionTypes as A } from "../src/context/appReducer.js";
import { ESTADO_INICIAL } from "../src/data/constants.js";

const estado = () => JSON.parse(JSON.stringify(ESTADO_INICIAL));
const agendamento = {
  petId: "pet-exemplo",
  servico: "Banho",
  data: "2026-09-01",
  hora: "09:00",
  status: "Agendado",
  valor: 40,
};

test("registros criados no mesmo instante recebem ids diferentes", () => {
  let s = estado();
  s = appReducer(s, { type: A.ADD_CLIENTE, payload: { nome: "A", telefone: "" } });
  s = appReducer(s, { type: A.ADD_CLIENTE, payload: { nome: "B", telefone: "" } });
  const ids = s.clientes.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("excluir cliente leva junto pets, agendamentos e assinaturas", () => {
  let s = estado();
  s = appReducer(s, { type: A.ADD_AGENDAMENTO, payload: agendamento });
  s = appReducer(s, { type: A.ADD_ASSINATURA, payload: { clienteId: "cli-exemplo", planoId: "basico" } });
  s = appReducer(s, { type: A.ADD_VENDA, payload: { clienteId: "cli-exemplo", item: "Banho", qtd: 1, valor: 40 } });

  s = appReducer(s, { type: A.DELETE_CLIENTE, payload: "cli-exemplo" });

  assert.deepEqual(s.clientes, []);
  assert.deepEqual(s.pets, []);
  assert.deepEqual(s.agendamentos, [], "não pode sobrar agendamento de pet excluído");
  assert.deepEqual(s.assinaturas, []);
  assert.equal(s.vendas.length, 1, "venda é histórico financeiro e permanece");
  assert.equal(s.vendas[0].clienteId, "", "mas perde o vínculo com o cliente");
});

test("excluir pet leva junto os agendamentos dele", () => {
  let s = estado();
  s = appReducer(s, { type: A.ADD_AGENDAMENTO, payload: agendamento });
  s = appReducer(s, { type: A.DELETE_PET, payload: "pet-exemplo" });
  assert.deepEqual(s.agendamentos, []);
});

test("dados salvos com id numérico continuam editáveis", () => {
  let s = estado();
  s.clientes = [{ id: 1, nome: "Antigo", telefone: "" }];
  s.pets = [{ id: 7, nome: "Rex", clienteId: 1, especie: "Cachorro", raca: "", observacoes: "" }];

  s = appReducer(s, { type: A.UPDATE_CLIENTE, payload: { id: "1", nome: "Novo" } });
  assert.equal(s.clientes[0].nome, "Novo");

  s = appReducer(s, { type: A.DELETE_CLIENTE, payload: "1" });
  assert.deepEqual(s.pets, []);
});

test("agendamento entra ordenado por data e hora", () => {
  let s = estado();
  s = appReducer(s, { type: A.ADD_AGENDAMENTO, payload: { ...agendamento, hora: "15:00" } });
  s = appReducer(s, { type: A.ADD_AGENDAMENTO, payload: { ...agendamento, hora: "08:00" } });
  assert.deepEqual(s.agendamentos.map((a) => a.hora), ["08:00", "15:00"]);
});

test("status do agendamento cicla e volta ao início", () => {
  let s = estado();
  s = appReducer(s, { type: A.ADD_AGENDAMENTO, payload: agendamento });
  const id = s.agendamentos[0].id;
  const ciclo = ["Concluído", "Cancelado", "Agendado"];
  for (const esperado of ciclo) {
    s = appReducer(s, { type: A.CICLO_STATUS_AGENDAMENTO, payload: id });
    assert.equal(s.agendamentos[0].status, esperado);
  }
});

test("valores que chegam como texto viram número", () => {
  let s = estado();
  s = appReducer(s, { type: A.ADD_VENDA, payload: { item: "Ração", qtd: "3", valor: "25.5" } });
  assert.equal(s.vendas[0].qtd * s.vendas[0].valor, 76.5);

  s = appReducer(s, { type: A.ADD_DESPESA, payload: { descricao: "Luz", valor: "120" } });
  assert.equal(s.despesas[0].valor, 120);
});

test("mesmo cliente não assina o mesmo plano duas vezes", () => {
  let s = estado();
  const assinatura = { clienteId: "cli-exemplo", planoId: "basico" };
  s = appReducer(s, { type: A.ADD_ASSINATURA, payload: assinatura });
  s = appReducer(s, { type: A.ADD_ASSINATURA, payload: assinatura });
  assert.equal(s.assinaturas.length, 1);

  s = appReducer(s, { type: A.ADD_ASSINATURA, payload: { ...assinatura, planoId: "plus" } });
  assert.equal(s.assinaturas.length, 2, "outro plano é permitido");
});

test("plano novo ganha id em slug, sem colidir com os existentes", () => {
  let s = estado();
  s = appReducer(s, { type: A.ADD_PLANO, payload: { nome: "Básico", descricao: "x", preco: "50" } });
  assert.equal(s.planos.at(-1).id, "basico-2");
  assert.equal(s.planos.at(-1).preco, 50);
});

test("editar plano preserva o id usado pelas assinaturas", () => {
  let s = estado();
  s = appReducer(s, { type: A.ADD_ASSINATURA, payload: { clienteId: "cli-exemplo", planoId: "basico" } });
  s = appReducer(s, { type: A.UPDATE_PLANO, payload: { id: "basico", nome: "Essencial" } });
  assert.equal(s.planos[0].id, "basico");
  assert.equal(s.planos[0].nome, "Essencial");
  assert.equal(s.assinaturas[0].planoId, "basico");
});

test("excluir plano cancela as assinaturas dele", () => {
  let s = estado();
  s = appReducer(s, { type: A.ADD_ASSINATURA, payload: { clienteId: "cli-exemplo", planoId: "basico" } });
  s = appReducer(s, { type: A.DELETE_PLANO, payload: "basico" });
  assert.deepEqual(s.assinaturas, []);
});

test("renomear serviço atualiza os agendamentos que o usavam", () => {
  let s = estado();
  s = appReducer(s, { type: A.ADD_AGENDAMENTO, payload: agendamento });
  s = appReducer(s, { type: A.UPDATE_SERVICO, payload: { id: "srv-banho", nome: "Banho Especial" } });
  assert.equal(s.agendamentos[0].servico, "Banho Especial");
  assert.equal(s.servicos[0].nome, "Banho Especial");
});

test("configurações são mescladas, não substituídas", () => {
  const s = appReducer(estado(), { type: A.UPDATE_CONFIGURACOES, payload: { horarioFechamento: 20 } });
  assert.deepEqual(s.configuracoes, { horarioAbertura: 8, horarioFechamento: 20, intervaloMinutos: 30 });
});

test("ação desconhecida devolve o mesmo estado", () => {
  const inicial = estado();
  assert.equal(appReducer(inicial, { type: "NAO_EXISTE" }), inicial);
});

test("restaurar backup substitui o estado inteiro", () => {
  const backup = { ...estado(), clientes: [{ id: "x", nome: "Do backup", telefone: "" }], pets: [] };
  const s = appReducer(estado(), { type: A.RESTAURAR_ESTADO, payload: backup });
  assert.deepEqual(s.clientes, backup.clientes);
  assert.deepEqual(s.pets, []);
});
