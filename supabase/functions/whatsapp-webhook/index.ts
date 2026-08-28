// Recebe mensagens do WhatsApp via webhook do Twilio, conversa com o
// cliente usando a API da Claude (com "tool use" para cadastrar
// clientes/pets/agendamentos direto no banco) e responde via TwiML.
//
// Segredos necessários (configurar com `supabase secrets set`):
//   OWNER_ID           - uuid da conta do petshop (dono dos dados)
//   TWILIO_AUTH_TOKEN  - para validar que a requisição veio do Twilio
//   ANTHROPIC_API_KEY  - para chamar a Claude
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já são injetados automaticamente.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OWNER_ID = Deno.env.get("OWNER_ID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const MAX_HISTORICO = 20;
const MAX_ITERACOES_TOOL = 5;

function soDigitos(telefone: string) {
  return (telefone || "").replace(/\D/g, "");
}

// --- Validação de assinatura do Twilio (evita que qualquer um chame o webhook) ---
async function validaAssinaturaTwilio(url: string, params: Record<string, string>, assinatura: string | null) {
  if (!assinatura) return false;
  const chavesOrdenadas = Object.keys(params).sort();
  let dados = url;
  for (const chave of chavesOrdenadas) dados += chave + params[chave];

  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(TWILIO_AUTH_TOKEN),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const assinado = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(dados));
  const esperado = btoa(String.fromCharCode(...new Uint8Array(assinado)));
  return esperado === assinatura;
}

// --- Ferramentas expostas para a IA ---
const FERRAMENTAS = [
  {
    name: "listar_meus_pets",
    description: "Lista os pets já cadastrados do cliente que está conversando.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "cadastrar_pet",
    description: "Cadastra um novo pet para o cliente atual.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string" },
        especie: { type: "string", enum: ["Cachorro", "Gato", "Outro"] },
        raca: { type: "string" },
      },
      required: ["nome", "especie"],
    },
  },
  {
    name: "listar_servicos",
    description: "Lista os serviços oferecidos pelo petshop, com preço e duração em minutos.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "consultar_horarios_disponiveis",
    description: "Consulta horários disponíveis para agendar um serviço em uma data específica.",
    input_schema: {
      type: "object",
      properties: {
        data: { type: "string", description: "Data no formato YYYY-MM-DD" },
        servico: { type: "string", description: "Nome exato do serviço" },
      },
      required: ["data", "servico"],
    },
  },
  {
    name: "criar_agendamento",
    description: "Cria um agendamento para um pet do cliente atual, em um horário já confirmado como disponível.",
    input_schema: {
      type: "object",
      properties: {
        pet_nome: { type: "string" },
        servico: { type: "string" },
        data: { type: "string", description: "YYYY-MM-DD" },
        hora: { type: "string", description: "HH:MM" },
      },
      required: ["pet_nome", "servico", "data", "hora"],
    },
  },
  {
    name: "listar_meus_agendamentos",
    description: "Lista os próximos agendamentos (não cancelados) do cliente atual.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "atualizar_meu_nome",
    description: "Atualiza o nome do cliente no cadastro. Use quando ele se apresentar ou corrigir o nome.",
    input_schema: {
      type: "object",
      properties: { nome: { type: "string" } },
      required: ["nome"],
    },
  },
];

async function calcularHorariosDisponiveis(data: string, duracaoServico: number) {
  const { data: config } = await supabase
    .from("configuracoes")
    .select("horario_abertura, horario_fechamento")
    .eq("owner_id", OWNER_ID)
    .maybeSingle();
  const abertura = config?.horario_abertura ?? 8;
  const fechamento = config?.horario_fechamento ?? 18;

  const { data: agendamentosDoDia } = await supabase
    .from("agendamentos")
    .select("hora, servico")
    .eq("owner_id", OWNER_ID)
    .eq("data", data)
    .neq("status", "Cancelado");

  const { data: servicos } = await supabase.from("servicos").select("nome, duracao").eq("owner_id", OWNER_ID);
  const duracaoPorServico = Object.fromEntries((servicos || []).map((s) => [s.nome, s.duracao]));

  const horarios: string[] = [];
  for (let h = abertura; h < fechamento; h++) {
    for (let m = 0; m < 60; m += 30) {
      horarios.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }

  return horarios.filter((horario) => {
    const [h, m] = horario.split(":").map(Number);
    const inicio = h * 60 + m;
    const fim = inicio + duracaoServico;
    return !(agendamentosDoDia || []).some((ag) => {
      const [agH, agM] = ag.hora.slice(0, 5).split(":").map(Number);
      const agInicio = agH * 60 + agM;
      const agFim = agInicio + (duracaoPorServico[ag.servico] || 60);
      return inicio < agFim && fim > agInicio;
    });
  });
}

async function executarFerramenta(nome: string, input: any, clienteId: string) {
  switch (nome) {
    case "listar_meus_pets": {
      const { data } = await supabase.from("pets").select("nome, especie, raca").eq("cliente_id", clienteId);
      return data;
    }

    case "cadastrar_pet": {
      const { data, error } = await supabase
        .from("pets")
        .insert({ owner_id: OWNER_ID, cliente_id: clienteId, nome: input.nome, especie: input.especie, raca: input.raca })
        .select()
        .single();
      if (error) return { erro: error.message };
      return { sucesso: true, pet: data };
    }

    case "listar_servicos": {
      const { data } = await supabase.from("servicos").select("nome, preco, duracao").eq("owner_id", OWNER_ID);
      return data;
    }

    case "consultar_horarios_disponiveis": {
      const { data: servico } = await supabase
        .from("servicos")
        .select("duracao")
        .eq("owner_id", OWNER_ID)
        .eq("nome", input.servico)
        .maybeSingle();
      if (!servico) return { erro: "Serviço não encontrado" };
      const horarios = await calcularHorariosDisponiveis(input.data, servico.duracao);
      return { horarios_disponiveis: horarios };
    }

    case "criar_agendamento": {
      const { data: pet } = await supabase
        .from("pets")
        .select("id")
        .eq("cliente_id", clienteId)
        .ilike("nome", input.pet_nome)
        .maybeSingle();
      if (!pet) return { erro: "Pet não encontrado para esse cliente. Cadastre o pet primeiro." };

      const { data: servico } = await supabase
        .from("servicos")
        .select("preco")
        .eq("owner_id", OWNER_ID)
        .eq("nome", input.servico)
        .maybeSingle();
      if (!servico) return { erro: "Serviço não encontrado" };

      const { data, error } = await supabase
        .from("agendamentos")
        .insert({
          owner_id: OWNER_ID,
          pet_id: pet.id,
          servico: input.servico,
          data: input.data,
          hora: input.hora,
          status: "Agendado",
          valor: servico.preco,
        })
        .select()
        .single();
      if (error) return { erro: error.message };
      return { sucesso: true, agendamento: data };
    }

    case "listar_meus_agendamentos": {
      const { data: pets } = await supabase.from("pets").select("id, nome").eq("cliente_id", clienteId);
      const petIds = (pets || []).map((p) => p.id);
      if (petIds.length === 0) return [];
      const hoje = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("agendamentos")
        .select("servico, data, hora, status, valor, pet_id")
        .in("pet_id", petIds)
        .neq("status", "Cancelado")
        .gte("data", hoje)
        .order("data")
        .order("hora");
      const nomePorPet = Object.fromEntries((pets || []).map((p) => [p.id, p.nome]));
      return (data || []).map((a) => ({ ...a, pet_nome: nomePorPet[a.pet_id] }));
    }

    case "atualizar_meu_nome": {
      const { error } = await supabase.from("clientes").update({ nome: input.nome }).eq("id", clienteId);
      if (error) return { erro: error.message };
      return { sucesso: true };
    }

    default:
      return { erro: `Ferramenta desconhecida: ${nome}` };
  }
}

async function chamarClaude(mensagens: any[]) {
  const hoje = new Date().toISOString().slice(0, 10);
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        `Você é a atendente virtual de um petshop, conversando pelo WhatsApp com um cliente. ` +
        `Hoje é ${hoje}. Seja breve e direta, como uma conversa real de WhatsApp (frases curtas, sem markdown). ` +
        `Use as ferramentas disponíveis para consultar e cadastrar dados reais — nunca invente preços, horários ou confirmações. ` +
        `Antes de criar um agendamento, sempre confirme horário disponível com a ferramenta de consulta. ` +
        `Se o cliente ainda não tem nome cadastrado (aparece como "Cliente WhatsApp"), pergunte o nome dele naturalmente na conversa.`,
      tools: FERRAMENTAS,
      messages: mensagens,
    }),
  });
  if (!resp.ok) {
    throw new Error(`Anthropic API error: ${resp.status} ${await resp.text()}`);
  }
  return await resp.json();
}

async function obterOuCriarCliente(telefone: string, nomePerfil: string | null) {
  const digitos = soDigitos(telefone);

  const { data: clientes } = await supabase.from("clientes").select("id, telefone").eq("owner_id", OWNER_ID);
  const existente = (clientes || []).find((c) => soDigitos(c.telefone || "") === digitos);
  if (existente) return existente.id;

  const { data, error } = await supabase
    .from("clientes")
    .insert({ owner_id: OWNER_ID, nome: nomePerfil || "Cliente WhatsApp", telefone })
    .select()
    .single();
  if (error) throw error;
  return data.id;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [chave, valor] of formData.entries()) params[chave] = String(valor);

  const assinatura = req.headers.get("X-Twilio-Signature");
  const valido = await validaAssinaturaTwilio(url.toString(), params, assinatura);
  if (!valido) {
    return new Response("Assinatura inválida", { status: 403 });
  }

  const corpo = params["Body"] || "";
  const de = (params["From"] || "").replace(/^whatsapp:/, "");
  const nomePerfil = params["ProfileName"] || null;

  try {
    const clienteId = await obterOuCriarCliente(de, nomePerfil);

    const { data: conversa } = await supabase
      .from("whatsapp_conversas")
      .select("mensagens")
      .eq("owner_id", OWNER_ID)
      .eq("telefone", de)
      .maybeSingle();

    let mensagens: any[] = conversa?.mensagens || [];
    mensagens.push({ role: "user", content: corpo });

    let respostaFinal = "";
    for (let i = 0; i < MAX_ITERACOES_TOOL; i++) {
      const resposta = await chamarClaude(mensagens);
      mensagens.push({ role: "assistant", content: resposta.content });

      const chamadasFerramenta = resposta.content.filter((b: any) => b.type === "tool_use");
      if (chamadasFerramenta.length === 0) {
        respostaFinal = resposta.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
        break;
      }

      const resultados = [];
      for (const chamada of chamadasFerramenta) {
        const resultado = await executarFerramenta(chamada.name, chamada.input, clienteId);
        resultados.push({ type: "tool_result", tool_use_id: chamada.id, content: JSON.stringify(resultado) });
      }
      mensagens.push({ role: "user", content: resultados });
    }

    if (!respostaFinal) {
      respostaFinal = "Desculpa, não consegui processar isso agora. Pode tentar de novo em instantes?";
    }

    mensagens = mensagens.slice(-MAX_HISTORICO);

    await supabase.from("whatsapp_conversas").upsert(
      { owner_id: OWNER_ID, telefone: de, cliente_id: clienteId, mensagens, updated_at: new Date().toISOString() },
      { onConflict: "owner_id,telefone" }
    );

    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(respostaFinal)}</Message></Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  } catch (err) {
    console.error(err);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Ops, deu um erro aqui do nosso lado. Já vamos verificar!</Message></Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  }
});

function escapeXml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
