// Date.now() colide quando dois registros são criados no mesmo milissegundo
// (e é impuro dentro do reducer). O contador garante ids únicos por sessão e
// o prefixo de tempo mantém a ordem de criação entre recarregamentos.
let contador = 0;

export function uid() {
  contador += 1;
  return `${Date.now().toString(36)}-${contador.toString(36)}`;
}

// Os <select> devolvem sempre string, e dados salvos antes desta versão têm
// ids numéricos. Comparar ids passa por aqui para os dois casos funcionarem.
export function mesmoId(a, b) {
  if (a === undefined || a === null || a === "") return false;
  if (b === undefined || b === null || b === "") return false;
  return String(a) === String(b);
}
