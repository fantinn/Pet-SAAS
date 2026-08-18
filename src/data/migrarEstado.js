// Dados salvos por versões anteriores podem não ter todas as chaves de hoje
// (servicos, planos, configuracoes só existem a partir da tela de Configurações)
// e guardavam números como texto. Sem esta normalização a tela quebrava ao
// carregar um estado antigo do localStorage.
const numero = (valor, padrao = 0) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : padrao;
};

const lista = (valor, padrao) => (Array.isArray(valor) ? valor : padrao);

export function migrarEstado(salvo, inicial) {
  if (!salvo || typeof salvo !== "object") return inicial;

  return {
    ...inicial,
    ...salvo,
    clientes: lista(salvo.clientes, inicial.clientes),
    pets: lista(salvo.pets, inicial.pets).map((p) => ({ ...p, observacoes: p.observacoes ?? "" })),
    agendamentos: lista(salvo.agendamentos, inicial.agendamentos).map((a) => ({
      ...a,
      valor: numero(a.valor),
      status: a.status || "Agendado",
    })),
    vendas: lista(salvo.vendas, inicial.vendas).map((v) => ({
      ...v,
      qtd: numero(v.qtd, 1),
      valor: numero(v.valor),
    })),
    assinaturas: lista(salvo.assinaturas, inicial.assinaturas),
    despesas: lista(salvo.despesas, inicial.despesas).map((d) => ({ ...d, valor: numero(d.valor) })),
    servicos: lista(salvo.servicos, inicial.servicos).map((s) => ({
      ...s,
      preco: numero(s.preco),
      duracao: numero(s.duracao, 30),
    })),
    planos: lista(salvo.planos, inicial.planos).map((p) => ({ ...p, preco: numero(p.preco) })),
    configuracoes: { ...inicial.configuracoes, ...(salvo.configuracoes || {}) },
  };
}
