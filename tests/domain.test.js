import { describe, expect, it } from "vitest";
import { resumoDoMes, somarDinheiro } from "../src/utils/financeiro.js";
import { calcularHorariosDisponiveis } from "../src/utils/availability.js";
import { montarCSV } from "../src/utils/csv.js";
import { validSignature, validateTool } from "../supabase/functions/whatsapp-webhook/security.ts";

describe("Regras do domínio", () => {
  it("soma dinheiro em centavos e lança mensalidade no recebimento", () => {
    expect(somarDinheiro([0.1,0.2],x=>x)).toBe(0.3);
    const state={agendamentos:[],vendas:[],despesas:[],mensalidades:[
      {status:"Pago",mesRef:"2026-09",dataPagamento:"2026-10-01",valor:50},
      {status:"Pendente",mesRef:"2026-10",valor:20},
    ]};
    expect(resumoDoMes(state,"2026-09",[]).totalEntradas).toBe(0);
    expect(resumoDoMes(state,"2026-10",[]).totalEntradas).toBe(50);
    expect(resumoDoMes(state,"2026-10",[]).totalPlanosAReceber).toBe(20);
  });
  it("desconsidera estornos e não mistura previsão com recebimento", () => {
    const r=resumoDoMes({agendamentos:[{data:"2026-10-01",status:"Agendado",valor:50}],
      vendas:[{data:"2026-10-02",qtd:2,valor:10,canceladaEm:"2026-10-03"}],
      despesas:[],mensalidades:[]},"2026-10",[]);
    expect(r.totalEntradas).toBe(0);
  });
  it("agenda respeita fechamento e duração histórica", () => {
    const slots=calcularHorariosDisponiveis("2026-10-20",[{id:"a",data:"2026-10-20",hora:"10:00",duracao:90,servico:"Banho",status:"Agendado"}],
      60,[{nome:"Banho",duracao:30}],{horarioAbertura:8,horarioFechamento:18});
    expect(slots).not.toContain("10:30");
    expect(slots).not.toContain("11:00");
    expect(slots).not.toContain("17:30");
    expect(slots).toContain("11:30");
    expect(calcularHorariosDisponiveis("2026-10-20",[],0,[])).toEqual([]);
  });
  it("neutraliza fórmulas em CSV e preserva aspas e separadores", () => {
    const csv=montarCSV([{titulo:"Nome",valor:r=>r}],[`=HYPERLINK("bad")`,"Ana; Bia"]);
    expect(csv).toContain(`"'=HYPERLINK(""bad"")"`);
    expect(csv).toContain('"Ana; Bia"');
  });
  it("nega campos de autorização fornecidos pela IA e datas inválidas", () => {
    expect(()=>validateTool("cadastrar_pet",{nome:"Luna",especie:"Gato",owner_id:"other"})).toThrow();
    expect(()=>validateTool("criar_agendamento",{pet_nome:"Luna",servico:"Banho",data:"2026-02-30",hora:"10:00"})).toThrow();
    expect(()=>validateTool("listar_meus_pets",{})).not.toThrow();
  });
  it("assinatura inclui URL pública e parâmetros completos", async () => {
    const token="test-secret",url="https://example.test/webhook",params={Body:"Olá",From:"whatsapp:+5511999999999"};
    const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(token),{name:"HMAC",hash:"SHA-1"},false,["sign"]);
    const payload=url+Object.keys(params).sort().map(k=>k+params[k]).join("");
    const sig=Buffer.from(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload))).toString("base64");
    expect(await validSignature(url,params,sig,token)).toBe(true);
    expect(await validSignature(url,{...params,Body:"Alterado"},sig,token)).toBe(false);
    expect(await validSignature(url,params,"invalid",token)).toBe(false);
  });
});
