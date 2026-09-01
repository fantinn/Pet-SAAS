export const FORMAS_PAGAMENTO = ["Pix", "Cartão", "Dinheiro"];

export const STATUS_COR = {
  Agendado: "bg-blue-100 text-blue-700",
  Concluído: "bg-green-100 text-green-700",
  Cancelado: "bg-red-100 text-red-700",
};

export const ORDEM_STATUS = ["Agendado", "Concluído", "Cancelado"];

// Banho em Yorkshire e em Golden não custam a mesma coisa: cada serviço tem
// preço por porte, e o porte do pet decide qual entra no agendamento.
export const PORTES = ["Pequeno", "Médio", "Grande"];

export const CAMPO_PRECO_POR_PORTE = {
  Pequeno: "precoPequeno",
  Médio: "preco",
  Grande: "precoGrande",
};

export function precoPorPorte(servico, porte) {
  if (!servico) return 0;
  return Number(servico[CAMPO_PRECO_POR_PORTE[porte] ?? "preco"]) || 0;
}
