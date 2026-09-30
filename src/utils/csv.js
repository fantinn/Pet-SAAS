// Excel em português espera ";" como separador e BOM para acertar os acentos.
const SEPARADOR = ";";

function escapar(valor) {
  const texto = valor == null ? "" : String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

// Valor monetário no formato que o Excel brasileiro entende: "1234,50".
export function numeroCSV(valor) {
  return (Number(valor) || 0).toFixed(2).replace(".", ",");
}

export function montarCSV(colunas, linhas) {
  const cabecalho = colunas.map((c) => escapar(c.titulo)).join(SEPARADOR);
  const corpo = linhas.map((linha) => colunas.map((c) => escapar(c.valor(linha))).join(SEPARADOR));
  return [cabecalho, ...corpo].join("\r\n");
}

export function baixarCSV(nomeArquivo, colunas, linhas) {
  const blob = new Blob(["﻿" + montarCSV(colunas, linhas)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
