import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularHorariosDisponiveis, horarioParaMinutos, minutosParaHorario } from "../src/utils/availability.js";

const servicos = [
  { nome: "Banho", duracao: 60 },
  { nome: "Banho e Tosa", duracao: 90 },
];
const configuracoes = { horarioAbertura: 8, horarioFechamento: 18, intervaloMinutos: 30 };
const agora = new Date(2026, 7, 18, 10, 5); // 18/08/2026 10:05
const amanha = "2026-08-19";

const horarios = (extra = {}) =>
  calcularHorariosDisponiveis({ data: amanha, agendamentos: [], servicos, duracao: 60, configuracoes, agora, ...extra });

test("respeita o horário de funcionamento configurado", () => {
  assert.equal(horarios()[0], "08:00");
  assert.equal(horarios().at(-1), "17:00");

  const meioPeriodo = horarios({ configuracoes: { horarioAbertura: 9, horarioFechamento: 12, intervaloMinutos: 30 } });
  assert.deepEqual(meioPeriodo, ["09:00", "09:30", "10:00", "10:30", "11:00"]);
});

test("não oferece horário que ultrapassa a hora de fechar", () => {
  assert.equal(horarios({ duracao: 90 }).at(-1), "16:30");
});

test("bloqueia horários que se sobrepõem a um agendamento", () => {
  const agendamentos = [{ data: amanha, hora: "09:00", servico: "Banho", status: "Agendado" }];
  const livres = horarios({ agendamentos });
  for (const h of ["08:30", "09:00", "09:30"]) {
    assert.ok(!livres.includes(h), `${h} deveria estar ocupado`);
  }
  assert.ok(livres.includes("08:00") && livres.includes("10:00"));
});

test("agendamento cancelado devolve o horário para a agenda", () => {
  const agendamentos = [{ data: amanha, hora: "09:00", servico: "Banho", status: "Cancelado" }];
  assert.ok(horarios({ agendamentos }).includes("09:00"));
});

test("hoje só mostra horários que ainda não passaram", () => {
  const hoje = horarios({ data: "2026-08-18" });
  assert.equal(hoje[0], "10:30");
});

test("data passada não tem horários", () => {
  assert.deepEqual(horarios({ data: "2026-08-01" }), []);
});

test("configuração inválida não gera horários", () => {
  assert.deepEqual(horarios({ configuracoes: { horarioAbertura: 18, horarioFechamento: 8 } }), []);
  assert.deepEqual(horarios({ data: "" }), []);
});

test("conversão entre horário e minutos", () => {
  assert.equal(horarioParaMinutos("14:30"), 870);
  assert.equal(minutosParaHorario(870), "14:30");
  assert.ok(Number.isNaN(horarioParaMinutos("")));
});
