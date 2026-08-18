import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatCurrency,
  formatDate,
  formatDateBR,
  formatPhone,
  linkWhatsapp,
  slugify,
  telefoneValido,
} from "../src/utils/format.js";

// Intl separa "R$" do número com espaço não-quebrável (U+00A0), que é o certo
// para não quebrar linha no meio do valor. Comparamos com espaço comum.
const moeda = (valor) => formatCurrency(valor).replace(/\u00a0/g, " ");

test("formatCurrency usa o padrão brasileiro", () => {
  assert.equal(moeda(1234.5), "R$ 1.234,50");
  assert.equal(moeda("70"), "R$ 70,00");
  assert.equal(moeda(undefined), "R$ 0,00");
  assert.equal(moeda(NaN), "R$ 0,00");
});

test("formatPhone aplica a máscara conforme o usuário digita", () => {
  assert.equal(formatPhone("129"), "(12) 9");
  assert.equal(formatPhone("1233331111"), "(12) 3333-1111");
  assert.equal(formatPhone("12999991111"), "(12) 99999-1111");
  assert.equal(formatPhone("(12) 99999-1111"), "(12) 99999-1111");
  assert.equal(formatPhone("129999911119999"), "(12) 99999-1111", "ignora dígitos além do 11º");
});

test("telefoneValido aceita vazio, fixo e celular", () => {
  assert.equal(telefoneValido(""), true);
  assert.equal(telefoneValido("1233331111"), true);
  assert.equal(telefoneValido("12999991111"), true);
  assert.equal(telefoneValido("123"), false);
});

test("datas circulam entre o formato do input e o de exibição", () => {
  assert.equal(formatDate(new Date(2026, 7, 18)), "2026-08-18");
  assert.equal(formatDateBR("2026-08-18"), "18/08/2026");
  assert.equal(formatDateBR(""), "—");
});

test("linkWhatsapp prefixa o DDI quando falta", () => {
  assert.equal(linkWhatsapp("(12) 99999-1111"), "https://wa.me/5512999991111");
  assert.equal(linkWhatsapp("5512999991111"), "https://wa.me/5512999991111");
  assert.equal(linkWhatsapp(""), null);
});

test("slugify remove acentos e símbolos", () => {
  assert.equal(slugify("Plano Básico Premium!"), "plano-basico-premium");
  assert.equal(slugify("Ação & Cuidado"), "acao-cuidado");
});
