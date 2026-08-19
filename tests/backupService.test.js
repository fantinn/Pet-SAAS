import { test } from "node:test";
import assert from "node:assert/strict";
import { lerBackup, montarBackup, nomeDoArquivo, VERSAO_BACKUP } from "../src/services/backupService.js";
import { ESTADO_INICIAL } from "../src/data/constants.js";

const backupValido = () => JSON.stringify(montarBackup(ESTADO_INICIAL, new Date(2026, 7, 19)));

test("o nome do arquivo carrega a data da exportação", () => {
  assert.equal(nomeDoArquivo(new Date(2026, 7, 19)), "petshop-backup-2026-08-19.json");
  assert.equal(nomeDoArquivo(new Date(2026, 11, 5)), "petshop-backup-2026-12-05.json");
});

test("o backup identifica a aplicação e a versão", () => {
  const b = montarBackup(ESTADO_INICIAL, new Date(2026, 7, 19));
  assert.equal(b.aplicacao, "petshop-saas");
  assert.equal(b.versao, VERSAO_BACKUP);
  assert.ok(b.exportadoEm);
  assert.deepEqual(b.dados, ESTADO_INICIAL);
});

test("exportar e importar devolve os mesmos dados", () => {
  const r = lerBackup(backupValido());
  assert.ok(r.ok);
  assert.deepEqual(r.estado.clientes, ESTADO_INICIAL.clientes);
  assert.deepEqual(r.estado.servicos, ESTADO_INICIAL.servicos);
  assert.equal(r.resumo.clientes, 1);
  assert.equal(r.resumo.pets, 1);
});

test("aceita também um estado salvo direto, sem os metadados", () => {
  const r = lerBackup(JSON.stringify(ESTADO_INICIAL));
  assert.ok(r.ok);
  assert.deepEqual(r.estado.clientes, ESTADO_INICIAL.clientes);
});

test("um backup antigo é completado pela migração", () => {
  const antigo = JSON.stringify({ clientes: [{ id: 1, nome: "Ana" }], pets: [], agendamentos: [], vendas: [], assinaturas: [], despesas: [] });
  const r = lerBackup(antigo);
  assert.ok(r.ok);
  assert.equal(r.estado.servicos.length, 5, "serviços padrão entram no lugar do que faltava");
  assert.deepEqual(r.estado.configuracoes, ESTADO_INICIAL.configuracoes);
});

test("recusa arquivo que não é JSON", () => {
  const r = lerBackup("isto não é json");
  assert.equal(r.ok, false);
  assert.match(r.erro, /JSON/);
});

test("recusa JSON que não é um backup do sistema", () => {
  for (const conteudo of ['{"foo":1}', "[1,2,3]", "null", '"texto"']) {
    const r = lerBackup(conteudo);
    assert.equal(r.ok, false, `deveria recusar ${conteudo}`);
  }
});

test("recusa backup de uma versão mais nova", () => {
  const futuro = JSON.stringify({ versao: VERSAO_BACKUP + 1, dados: ESTADO_INICIAL });
  const r = lerBackup(futuro);
  assert.equal(r.ok, false);
  assert.match(r.erro, /versão mais nova/);
});
