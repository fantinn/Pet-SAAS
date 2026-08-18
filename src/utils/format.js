export function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// "2026-08-18" -> "18/08/2026". Aceita Date ou string ISO curta.
export function formatDateBR(valor) {
  if (!valor) return "—";
  if (valor instanceof Date) return formatDateBR(formatDate(valor));
  const [ano, mes, dia] = String(valor).split("-");
  if (!ano || !mes || !dia) return String(valor);
  return `${dia}/${mes}/${ano}`;
}

// "2026-08-18" -> "terça-feira, 18 de agosto"
export function formatDateLongoBR(valor) {
  if (!valor) return "—";
  const [ano, mes, dia] = String(valor).split("-").map(Number);
  if (!ano || !mes || !dia) return String(valor);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

// 1234.5 -> "R$ 1.234,50"
export function formatCurrency(valor) {
  const numero = Number(valor);
  return (Number.isFinite(numero) ? numero : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Máscara progressiva: (12) 99999-1111 / (12) 3333-1111
export function formatPhone(telefone) {
  const digits = (telefone || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Telefone é opcional, mas quando preenchido precisa ser um número brasileiro válido.
export function telefoneValido(telefone) {
  const digits = (telefone || "").replace(/\D/g, "");
  return digits.length === 0 || digits.length === 10 || digits.length === 11;
}

export function linkWhatsapp(telefone) {
  const digits = (telefone || "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits.startsWith("55") ? digits : "55" + digits}`;
}

// "Banho e Tosa" -> "banho-e-tosa" (usado para gerar id de plano)
export function slugify(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
