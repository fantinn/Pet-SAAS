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

// "2026-09-03" -> "03/09/2026"
export function formatDataBR(dataStr) {
  const [ano, mes, dia] = (dataStr || "").split("-");
  return dia ? `${dia}/${mes}/${ano}` : "";
}

// "2026-09-03" -> "03/09" (dia e mês bastam para datas próximas)
export function formatDiaMes(dataStr) {
  const [, mes, dia] = (dataStr || "").split("-");
  return dia ? `${dia}/${mes}` : "";
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

export function linkWhatsapp(telefone, mensagem) {
  const digits = (telefone || "").replace(/\D/g, "");
  if (!digits) return null;
  const numero = digits.startsWith("55") ? digits : "55" + digits;
  return mensagem
    ? `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
    : `https://wa.me/${numero}`;
}

// Texto pronto para confirmar/lembrar um agendamento pelo WhatsApp.
export function mensagemConfirmacao({ petNome, servico, data, hora }) {
  return `Olá! Passando para confirmar o agendamento do(a) ${petNome} - ${servico} no dia ${formatDataBR(data)} às ${hora}. Qualquer coisa, é só chamar!`;
}
