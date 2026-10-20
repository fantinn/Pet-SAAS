import { createClient } from "jsr:@supabase/supabase-js@2.118.0";
import { validSignature } from "./security.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Método não permitido", { status: 405 });
  if (Deno.env.get("WHATSAPP_ENABLED") !== "true") return new Response("Integração desabilitada", { status: 503 });
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const publicUrl = Deno.env.get("TWILIO_WEBHOOK_URL");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!token || !publicUrl || !url || !key) return new Response("Configuração incompleta", { status: 503 });
  if (!req.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return new Response("Formato inválido", { status: 415 });
  try {
    // Limite durante leitura, inclusive quando Content-Length não é enviado.
    const reader = req.body?.getReader();
    if (!reader) return new Response("Corpo obrigatório", { status: 400 });
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > 16384) { await reader.cancel(); return new Response("Mensagem grande demais", { status: 413 }); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
    const form = new URLSearchParams(new TextDecoder().decode(bytes));
    const params: Record<string,string> = {};
    for (const [k,v] of form) { if (k in params) return new Response("Campo duplicado",{status:400}); params[k]=v; }
    if (!await validSignature(publicUrl,params,req.headers.get("X-Twilio-Signature") || "",token)) return new Response("Assinatura inválida",{status:403});
    if (!/^SM[a-fA-F0-9]{32}$/.test(params.MessageSid || "") || !/^AC[a-fA-F0-9]{32}$/.test(params.AccountSid || "")
      || !/^whatsapp:\+\d{8,15}$/.test(params.From || "") || !/^whatsapp:\+\d{8,15}$/.test(params.To || "")
      || !params.Body?.trim() || params.Body.length>4000) return new Response("Mensagem inválida",{status:400});
    const db = createClient(url,key);
    const { error } = await db.rpc("enfileirar_whatsapp", {
      p_sid: params.MessageSid, p_account: params.AccountSid, p_from: params.From, p_to: params.To,
      p_nome: params.ProfileName || "Cliente WhatsApp", p_corpo: params.Body,
    });
    if (error) return new Response("Não foi possível receber a mensagem",{status:503});
    return new Response("<Response/>",{headers:{"Content-Type":"text/xml"}});
  } catch {
    console.error(JSON.stringify({ event: "whatsapp_ingress_failed" }));
    return new Response("Falha temporária",{status:503});
  }
});
