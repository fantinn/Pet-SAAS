import { migrarEstado } from "../data/migrarEstado.js";
import { ESTADO_INICIAL } from "../data/constants.js";

export const VERSAO_BACKUP = 1;

const CHAVES_OBRIGATORIAS = ["clientes", "pets", "agendamentos", "vendas", "assinaturas", "despesas"];

/** Nome do arquivo: petshop-backup-2026-08-19.json */
export function nomeDoArquivo(agora = new Date()) {
  const data = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(
    agora.getDate()
  ).padStart(2, "0")}`;
  return `petshop-backup-${data}.json`;
}

/** Empacota o estado com metadados, para saber o que é o arquivo ao reabrir. */
export function montarBackup(state, agora = new Date()) {
  return {
    aplicacao: "petshop-saas",
    versao: VERSAO_BACKUP,
    exportadoEm: agora.toISOString(),
    dados: state,
  };
}

/**
 * Lê o conteúdo de um arquivo de backup e devolve o estado pronto para uso.
 * @returns {{ ok: true, estado: Object, resumo: Object } | { ok: false, erro: string }}
 */
export function lerBackup(conteudo) {
  let json;
  try {
    json = JSON.parse(conteudo);
  } catch {
    return { ok: false, erro: "O arquivo não é um JSON válido." };
  }

  // Aceita tanto o formato com metadados quanto um estado salvo direto.
  const dados = json?.dados ?? json;

  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    return { ok: false, erro: "O arquivo não tem o formato de um backup do Petshop SaaS." };
  }

  const faltando = CHAVES_OBRIGATORIAS.filter((chave) => !Array.isArray(dados[chave]));
  if (faltando.length === CHAVES_OBRIGATORIAS.length) {
    return { ok: false, erro: "O arquivo não tem o formato de um backup do Petshop SaaS." };
  }

  if (json?.versao && Number(json.versao) > VERSAO_BACKUP) {
    return {
      ok: false,
      erro: "Este backup foi gerado por uma versão mais nova do sistema. Atualize antes de importar.",
    };
  }

  // migrarEstado completa o que faltar e normaliza os números.
  const estado = migrarEstado(dados, ESTADO_INICIAL);

  return {
    ok: true,
    estado,
    resumo: {
      clientes: estado.clientes.length,
      pets: estado.pets.length,
      agendamentos: estado.agendamentos.length,
      vendas: estado.vendas.length,
      assinaturas: estado.assinaturas.length,
      despesas: estado.despesas.length,
      produtos: estado.produtos?.length ?? 0,
      exportadoEm: json?.exportadoEm || null,
    },
  };
}

/** Dispara o download do backup no navegador. */
export function baixarBackup(state, agora = new Date()) {
  const conteudo = JSON.stringify(montarBackup(state, agora), null, 2);
  const blob = new Blob([conteudo], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = nomeDoArquivo(agora);
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Sem isso o blob fica preso na memória até recarregar a página.
  URL.revokeObjectURL(url);
}
