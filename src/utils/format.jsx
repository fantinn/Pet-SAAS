export function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Valores em Real usam vírgula decimal e ponto de milhar ("R$ 1.185,30").
export function formatBRL(valor) {
  return (Number(valor) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// "2026-08" -> "agosto de 2026"
export function nomeDoMes(mesRef) {
  const [ano, mes] = (mesRef || "").split("-").map(Number);
  if (!ano || !mes) return "";
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// Soma/subtrai meses de um "YYYY-MM", devolvendo outro "YYYY-MM".
export function deslocarMes(mesRef, delta) {
  const [ano, mes] = mesRef.split("-").map(Number);
  const d = new Date(ano, mes - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function linkWhatsapp(telefone) {
  const digits = (telefone || "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits.startsWith("55") ? digits : "55" + digits}`;
}
