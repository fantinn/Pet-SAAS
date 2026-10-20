import { supabase } from "./supabaseClient.jsx";

// PostgREST limita respostas; buscar páginas evita totais truncados silenciosamente.
export async function readAll(table, ownerId) {
  const data = [];
  try {
    for (let offset = 0; offset < 50000; offset += 500) {
      const result = await supabase.from(table).select("*").eq("owner_id", ownerId)
        .order("id").range(offset, offset + 499);
      if (result.error) return result;
      data.push(...result.data);
      if (result.data.length < 500) return { data, error: null };
    }
    throw new Error("Volume acima do limite do piloto. Solicite a expansão das consultas antes de continuar.");
  } catch (error) {
    return { data: null, error };
  }
}

export function errorMessage(error) {
  if (error?.code === "23503") return "Este registro possui histórico vinculado e não pode ser excluído.";
  if (error?.code === "42501") return "Seu perfil não tem permissão para esta operação.";
  if (error?.code === "23505") return "Já existe um registro com esses dados. Atualize a tela.";
  if (error?.code === "23514") return "Revise os valores informados: uma regra de validação não foi atendida.";
  return error?.message || "Não foi possível concluir. Confira sua conexão e tente novamente.";
}

// Resultado explícito para preservar rascunhos e capturar falhas de rede em todos os handlers.
export function runActions(actions, setError) {
  const pending = new Set();
  return Object.fromEntries(Object.entries(actions).map(([name, action]) => [name, async (...args) => {
    if (pending.has(name)) return false;
    pending.add(name);
    setError("");
    try {
      await action(...args);
      return true;
    } catch (error) {
      setError(errorMessage(error));
      return false;
    } finally {
      pending.delete(name);
    }
  }]));
}
