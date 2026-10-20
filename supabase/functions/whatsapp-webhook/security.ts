export async function validSignature(url: string, params: Record<string,string>, signature: string, token: string) {
  if (!/^[A-Za-z0-9+/]{27}=$/.test(signature)) return false;
  const data = url + Object.keys(params).sort().map(key => key + params[key]).join("");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(token), { name: "HMAC", hash: "SHA-1" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", key, Uint8Array.from(atob(signature), c => c.charCodeAt(0)), new TextEncoder().encode(data));
}

export function validateTool(name: string, input: Record<string, unknown>) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Argumentos inválidos");
  const fields: Record<string,string[]> = {
    listar_meus_pets: [], cadastrar_pet: ["nome","especie","raca"], listar_servicos: [],
    consultar_horarios_disponiveis: ["data","servico"], criar_agendamento: ["pet_nome","servico","data","hora"],
    listar_meus_agendamentos: [], atualizar_meu_nome: ["nome"],
  };
  if (!fields[name] || Object.keys(input).some(key => !fields[name].includes(key))) throw new Error("Ferramenta ou campo inválido");
  for (const field of fields[name]) {
    if (field === "raca" && input[field] === undefined) continue;
    if (typeof input[field] !== "string" || !(input[field] as string).trim() || (input[field] as string).length > 200) throw new Error("Campo inválido");
  }
  if (input.especie && !["Cachorro","Gato","Outro"].includes(input.especie as string)) throw new Error("Espécie inválida");
  if (input.data && (!/^\d{4}-\d{2}-\d{2}$/.test(input.data as string) || !Number.isFinite(Date.parse(input.data as string))
    || new Date(input.data as string).toISOString().slice(0,10)!==input.data)) throw new Error("Data inválida");
  if (input.hora && !/^([01]\d|2[0-3]):(00|30)$/.test(input.hora as string)) throw new Error("Horário inválido");
}
