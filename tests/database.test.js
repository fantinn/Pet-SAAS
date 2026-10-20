import pg from "pg";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readdir, readFile } from "node:fs/promises";

let db;
const owner = "10000000-0000-0000-0000-000000000001";
const other = "20000000-0000-0000-0000-000000000002";
const staff = "30000000-0000-0000-0000-000000000003";
let cliente, pet, produto;
async function as(user) {
  await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${user}',false);`);
}
async function sql(text, params = []) { return (await db.query(text, params)).rows; }
beforeAll(async () => {
  if (process.env.TEST_DATABASE_URL) {
    const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    await client.connect();
    db = { exec: sql => client.query(sql), query: (sql,args) => client.query(sql,args), close: () => client.end() };
  } else db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,public to anon,authenticated,service_role;
    grant execute on function auth.uid() to authenticated;
    insert into auth.users values('${owner}','owner@example.test',now()),('${other}','other@example.test',now()),('${staff}','staff@example.test',now());
  `);
  for (const file of (await readdir("supabase/migrations")).filter(f => f.endsWith(".sql")).sort()) {
    await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
  }
  await as(owner);
  await sql("select public.criar_petshop('Petshop A')");
  cliente = (await sql("insert into public.clientes(nome) values('Ana') returning id"))[0].id;
  pet = (await sql("insert into public.pets(cliente_id,nome) values($1,'Luna') returning id", [cliente]))[0].id;
  produto = (await sql("insert into public.produtos(nome,quantidade,preco_venda) values('Ração',5,10) returning id"))[0].id;
  await sql("insert into public.servicos(nome,preco,preco_pequeno,preco_grande,duracao) values('Banho',50,40,60,60)");
  await as(other);
  await sql("select public.criar_petshop('Petshop B')");
}, 30000);
afterAll(async () => { await db?.close(); });

describe("Migrations, RLS e transações", () => {
  it("não permite ler ou vincular registros de outro petshop", async () => {
    await as(other);
    expect(await sql("select * from public.clientes")).toHaveLength(0);
    await expect(sql("insert into public.pets(cliente_id,nome) values($1,'Intruso')", [cliente])).rejects.toThrow();
    await expect(sql("insert into public.clientes(owner_id,nome) values($1,'Intruso')", [owner])).rejects.toThrow();
    expect(await sql("update public.clientes set nome='Invadido' where id=$1 returning id", [cliente])).toHaveLength(0);
  });
  it("rejeita estoque insuficiente sem registrar venda ou movimentação parcial", async () => {
    await as(owner);
    await expect(sql("select public.registrar_venda(gen_random_uuid(),$1,'Ração',6,10,'Pix',$2)", [cliente,produto])).rejects.toThrow(/Estoque insuficiente/);
    expect(await sql("select * from public.vendas")).toHaveLength(0);
    expect((await sql("select quantidade from public.produtos where id=$1",[produto]))[0].quantidade).toBe(5);
  });
  it("repetir a mesma venda não duplica a baixa e estorno só repõe uma vez", async () => {
    const request = "40000000-0000-0000-0000-000000000004";
    const args = [request,cliente,produto];
    const query = "select (public.registrar_venda($1,$2,'Ração',2,10,'Pix',$3)).id";
    const first = (await sql(query,args))[0].id;
    expect((await sql(query,args))[0].id).toBe(first);
    expect((await sql("select quantidade from public.produtos where id=$1",[produto]))[0].quantidade).toBe(3);
    await expect(sql("select public.registrar_venda($1,$2,'Ração',3,10,'Pix',$3)",args)).rejects.toThrow(/outra venda/);
    await sql("select public.cancelar_venda($1)",[first]);
    await sql("select public.cancelar_venda($1)",[first]);
    expect((await sql("select quantidade from public.produtos where id=$1",[produto]))[0].quantidade).toBe(5);
    expect((await sql("select count(*)::int as n from public.vendas"))[0].n).toBe(1);
  });
  it("não permite driblar RPCs para alterar estoque ou apagar histórico", async () => {
    await expect(sql("update public.produtos set quantidade=100 where id=$1",[produto])).rejects.toThrow();
    await expect(sql("delete from public.vendas")).rejects.toThrow();
    await expect(sql("insert into public.vendas(item,qtd,valor,forma_pagamento) values('Fake',1,1,'Pix')")).rejects.toThrow();
    await expect(sql("delete from public.clientes where id=$1",[cliente])).rejects.toThrow();
  });
  it("ajuste de estoque é idempotente e recusa saldo negativo", async () => {
    const request = "60000000-0000-0000-0000-000000000006";
    await sql("select public.ajustar_estoque($1,1,$2)",[produto,request]);
    await sql("select public.ajustar_estoque($1,1,$2)",[produto,request]);
    expect((await sql("select quantidade from public.produtos where id=$1",[produto]))[0].quantidade).toBe(6);
    await expect(sql("select public.ajustar_estoque($1,-7,gen_random_uuid())",[produto])).rejects.toThrow(/insuficiente/);
    await sql("select public.ajustar_estoque($1,-1,gen_random_uuid())",[produto]);
  });
  it("agenda respeita fechamento, reserva minutos e preserva duração histórica", async () => {
    await expect(sql("insert into public.agendamentos(pet_id,servico,data,hora,valor) values($1,'Banho','2099-01-12','17:30',50)",[pet])).rejects.toThrow(/funcionamento/);
    const id = (await sql("insert into public.agendamentos(pet_id,servico,data,hora,valor) values($1,'Banho','2099-01-12','10:00',50) returning id",[pet]))[0].id;
    await sql("update public.servicos set duracao=30 where nome='Banho'");
    await expect(sql("insert into public.agendamentos(pet_id,servico,data,hora,valor) values($1,'Banho','2099-01-12','10:30',50)",[pet])).rejects.toThrow(/indisponível/);
    await sql("update public.agendamentos set status='Cancelado' where id=$1",[id]);
    await sql("insert into public.agendamentos(pet_id,servico,data,hora,valor) values($1,'Banho','2099-01-12','10:30',50)",[pet]);
  });
  it("mensalidades são únicas e mantêm valores históricos", async () => {
    const plano = (await sql("insert into public.planos(slug,nome,preco) values('mensal','Mensal',100) returning id"))[0].id;
    await sql("insert into public.assinaturas(cliente_id,plano_id,data_inicio) values($1,$2,'2026-10-01')",[cliente,plano]);
    await sql("select public.gerar_mensalidades('2026-10')");
    await sql("update public.planos set preco=200 where id=$1",[plano]);
    await sql("select public.gerar_mensalidades('2026-10')");
    const rows = await sql("select valor from public.mensalidades");
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].valor)).toBe(100);
  });
  it("convites exigem e-mail correto; atendente não gerencia finanças/equipe", async () => {
    const token = (await sql("select public.convidar('staff@example.test','atendente') as token"))[0].token;
    await as(other);
    await expect(sql("select public.aceitar_convite($1)",[token])).rejects.toThrow();
    await as(staff);
    await sql("select public.aceitar_convite($1)",[token]);
    expect(await sql("select * from public.clientes")).toHaveLength(1);
    expect(await sql("select * from public.mensalidades")).toHaveLength(0);
    await expect(sql("select public.ajustar_estoque($1,1,gen_random_uuid())",[produto])).rejects.toThrow(/permissão/);
    await expect(sql("select public.convidar('bad@example.test','administrador')")).rejects.toThrow(/permissão/);
    await expect(sql("update public.petshops set acesso='ativo'")).rejects.toThrow();
    await as(owner);
    await sql("select public.remover_membro($1)",[staff]);
    await as(staff);
    expect(await sql("select * from public.clientes")).toHaveLength(0);
  });
  it("anônimo não lê dados nem executa operações privilegiadas", async () => {
    await db.exec("reset role; set role anon;");
    await expect(sql("select * from public.clientes")).rejects.toThrow();
    await expect(sql("select public.registrar_venda(gen_random_uuid(),null,'x',1,1,'Pix',null)")).rejects.toThrow();
    await as(owner);
    await expect(sql("select public.claim_whatsapp()")).rejects.toThrow();
    await expect(sql("select public.cliente_whatsapp($1,'5511999999999','Intruso')",[other])).rejects.toThrow();
  });
  it("fila deduplica mensagens e serializa uma conversa", async () => {
    await db.exec("reset role;");
    await sql("insert into public.whatsapp_numeros(numero,owner_id,account_sid,ativo) values('whatsapp:+5511111111111',$1,'ACtest',true)",[owner]);
    await db.exec("set role service_role;");
    const enqueue = "select public.enfileirar_whatsapp($1,'ACtest','whatsapp:+5522222222222','whatsapp:+5511111111111','Teste','Olá')";
    await sql(enqueue,["SMtest1"]);
    await sql(enqueue,["SMtest1"]);
    await sql(enqueue,["SMtest2"]);
    expect(await sql("select * from public.whatsapp_fila")).toHaveLength(2);
    expect((await sql("select (public.claim_whatsapp()).message_sid as sid"))[0].sid).toBe("SMtest1");
    expect((await sql("select (public.claim_whatsapp()).message_sid as sid"))[0].sid).toBeNull();
    await sql("update public.whatsapp_fila set estado='concluido' where message_sid='SMtest1'");
    expect((await sql("select (public.claim_whatsapp()).message_sid as sid"))[0].sid).toBe("SMtest2");
    await expect(sql("select public.enfileirar_whatsapp('SMbad','ACbad','whatsapp:+5522222222222','whatsapp:+5511111111111','Teste','Olá')")).rejects.toThrow();
  });
  it("petshop suspenso perde acesso às tabelas e RPCs", async () => {
    await db.exec("reset role;");
    await sql("update public.petshops set acesso='suspenso' where owner_id=$1",[other]);
    await as(other);
    expect(await sql("select * from public.clientes")).toHaveLength(0);
    await expect(sql("select public.registrar_venda(gen_random_uuid(),null,'x',1,1,'Pix',null)")).rejects.toThrow(/acesso/);
    await as(owner);
    expect((await sql("select * from public.auditoria")).length).toBeGreaterThan(0);
    await expect(sql("delete from public.auditoria")).rejects.toThrow();
  });
});

// Duas conexões reais no CI; PGlite serializa consultas, não comprova concorrência.
if (process.env.TEST_DATABASE_URL) it("concorrência: duas vendas disputam o mesmo saldo", async () => {
  const clients = [new pg.Client({connectionString:process.env.TEST_DATABASE_URL}),new pg.Client({connectionString:process.env.TEST_DATABASE_URL})];
  try {
    for (const c of clients) { await c.connect(); await c.query("set role authenticated"); await c.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]); }
    const outcomes = await Promise.allSettled(clients.map(c=>c.query("select public.registrar_venda(gen_random_uuid(),$1,'Ração',4,10,'Pix',$2)",[cliente,produto])));
    expect(outcomes.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    expect(outcomes.filter(r=>r.status==='rejected')).toHaveLength(1);
    const stock=await clients[0].query("select quantidade from public.produtos where id=$1",[produto]);
    expect(stock.rows[0].quantidade).toBe(1);
    const bookings=await Promise.allSettled(clients.map(c=>c.query("insert into public.agendamentos(pet_id,servico,data,hora,valor) values($1,'Banho','2099-02-01','10:00',50)",[pet])));
    expect(bookings.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    expect(bookings.filter(r=>r.status==='rejected')).toHaveLength(1);
  } finally { await Promise.all(clients.map(c=>c.end())); }
});
