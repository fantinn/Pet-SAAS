alter table public.produtos add constraint produtos_tenant_id unique(owner_id,id);
alter table public.vendas add column produto_id uuid;
alter table public.vendas add column request_id uuid;
alter table public.vendas add column cancelada_em timestamptz;
alter table public.vendas add constraint vendas_request unique(owner_id,request_id);
alter table public.vendas add constraint vendas_produto foreign key(owner_id,produto_id) references public.produtos(owner_id,id) on delete restrict;
create table public.movimentos_estoque (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.petshops(owner_id),
 produto_id uuid not null, venda_id uuid, delta integer not null check(delta<>0),
 motivo text not null, request_id uuid, created_at timestamptz not null default now(),
 unique(owner_id,request_id),
 foreign key(owner_id,produto_id) references public.produtos(owner_id,id) on delete restrict,
 foreign key(owner_id,venda_id) references public.vendas(owner_id,id) on delete restrict
);
alter table public.movimentos_estoque enable row level security;
revoke all on public.movimentos_estoque from anon,authenticated;
grant select on public.movimentos_estoque to authenticated;
create policy movimentos_read on public.movimentos_estoque for select to authenticated using(owner_id=public.current_owner() and public.is_manager());
revoke insert,update,delete on public.vendas from authenticated;
revoke update on public.produtos from authenticated;
grant update(nome,categoria,estoque_minimo,preco_custo,preco_venda) on public.produtos to authenticated;
revoke delete on public.agendamentos,public.despesas,public.mensalidades,public.assinaturas from authenticated;

create function public.registrar_venda(p_request uuid,p_cliente uuid,p_item text,p_qtd integer,p_valor numeric,p_forma text,p_produto uuid default null)
returns public.vendas language plpgsql security definer set search_path='' as $$
declare o uuid:=public.current_owner(); v public.vendas; produto public.produtos;
begin
 if o is null then raise exception 'Sem acesso ao petshop'; end if;
 if p_request is null or p_qtd is null or p_qtd<=0 or p_valor is null or p_valor<0 or p_valor<>round(p_valor,2)
 then raise exception 'Quantidade, valor ou identificador inválido'; end if;
 perform pg_advisory_xact_lock(hashtextextended(o::text||p_request::text,0));
 select * into v from public.vendas where owner_id=o and request_id=p_request;
 if found then
  if (v.cliente_id,v.item,v.qtd,v.valor,v.forma_pagamento,v.produto_id) is distinct from (p_cliente,p_item,p_qtd,p_valor,p_forma,p_produto)
  then raise exception 'Identificador já usado para outra venda'; end if;
  return v;
 end if;
 if p_produto is not null then
  select * into produto from public.produtos where id=p_produto and owner_id=o for update;
  if not found or produto.quantidade<p_qtd then raise exception 'Estoque insuficiente ou produto indisponível'; end if;
 end if;
 insert into public.vendas(owner_id,cliente_id,item,qtd,valor,forma_pagamento,produto_id,request_id)
 values(o,p_cliente,p_item,p_qtd,p_valor,p_forma,p_produto,p_request) returning * into v;
 if p_produto is not null then
  update public.produtos set quantidade=quantidade-p_qtd where id=p_produto and owner_id=o;
  insert into public.movimentos_estoque(owner_id,produto_id,venda_id,delta,motivo) values(o,p_produto,v.id,-p_qtd,'Venda');
 end if;
 return v;
end $$;
create function public.cancelar_venda(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare v public.vendas; o uuid:=public.current_owner();
begin
 if not public.is_manager() then raise exception 'Sem permissão para estornar'; end if;
 select * into v from public.vendas where id=p_id and owner_id=o for update;
 if not found then raise exception 'Venda não encontrada'; end if;
 if v.cancelada_em is not null then return; end if;
 update public.vendas set cancelada_em=now() where id=v.id;
 if v.produto_id is not null then
  update public.produtos set quantidade=quantidade+v.qtd where id=v.produto_id and owner_id=o;
  insert into public.movimentos_estoque(owner_id,produto_id,venda_id,delta,motivo) values(o,v.produto_id,v.id,v.qtd,'Estorno');
 end if;
end $$;
create function public.ajustar_estoque(p_id uuid,p_delta integer,p_request uuid) returns public.produtos language plpgsql security definer set search_path='' as $$
declare p public.produtos; m public.movimentos_estoque; o uuid:=public.current_owner();
begin
 if not public.is_manager() then raise exception 'Sem permissão'; end if;
 if p_request is null or p_delta is null or p_delta=0 then raise exception 'Ajuste inválido'; end if;
 perform pg_advisory_xact_lock(hashtextextended(o::text||p_request::text,0));
 select * into m from public.movimentos_estoque where owner_id=o and request_id=p_request;
 if found and (m.produto_id,m.delta) is distinct from (p_id,p_delta) then raise exception 'Identificador reutilizado'; end if;
 select * into p from public.produtos where owner_id=o and id=p_id for update;
 if not found then raise exception 'Produto não encontrado'; end if;
 if m.id is not null then return p; end if;
 if p.quantidade+p_delta<0 then raise exception 'Estoque insuficiente'; end if;
 update public.produtos set quantidade=quantidade+p_delta where id=p_id returning * into p;
 insert into public.movimentos_estoque(owner_id,produto_id,delta,motivo,request_id) values(o,p_id,p_delta,'Ajuste manual',p_request);
 return p;
end $$;
create function public.estoque_inicial() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.quantidade>0 then
 insert into public.movimentos_estoque(owner_id,produto_id,delta,motivo) values(new.owner_id,new.id,new.quantidade,'Saldo inicial');
 end if;
 return new;
end $$;
create trigger estoque_inicial after insert on public.produtos for each row execute function public.estoque_inicial();

create function public.gerar_mensalidades(p_mes text) returns void language plpgsql security definer set search_path='' as $$
declare o uuid:=public.current_owner(); inicio date;
begin
 if not public.is_manager() then raise exception 'Sem permissão'; end if;
 if p_mes is null or p_mes !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'Mês inválido'; end if;
 inicio:=(p_mes||'-01')::date;
 insert into public.mensalidades(owner_id,assinatura_id,mes_ref,valor)
 select o,a.id,p_mes,p.preco from public.assinaturas a join public.planos p on p.id=a.plano_id and p.owner_id=a.owner_id
 where a.owner_id=o and a.data_inicio<(inicio+interval '1 month') and (a.cancelada_em is null or a.cancelada_em>=inicio)
 on conflict(owner_id,assinatura_id,mes_ref) do nothing;
end $$;
-- Cancelamento não perdoa automaticamente dívidas já geradas.
alter table public.despesas add column cancelada_em timestamptz;
create function public.cancelar_despesa(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_manager() then raise exception 'Sem permissão'; end if;
 update public.despesas set cancelada_em=coalesce(cancelada_em,now()) where id=p_id and owner_id=public.current_owner();
end $$;

-- Duração histórica e reserva de cada minuto. A chave única serializa conflitos inclusive entre transações concorrentes.
alter table public.agendamentos add column duracao integer;
update public.agendamentos a set duracao=coalesce((select s.duracao from public.servicos s where s.owner_id=a.owner_id and s.nome=a.servico),60);
alter table public.agendamentos alter column duracao set not null;
alter table public.agendamentos add constraint duracao_valida check(duracao between 1 and 720);
create table public.agenda_slots (
 owner_id uuid not null, data date not null, minuto integer not null,
 agendamento_id uuid not null references public.agendamentos(id) on delete cascade,
 primary key(owner_id,data,minuto)
);
alter table public.agenda_slots enable row level security;
revoke all on public.agenda_slots from public,anon,authenticated;
insert into public.agenda_slots
select a.owner_id,a.data,m,a.id from public.agendamentos a cross join lateral generate_series(
 (extract(hour from a.hora)*60+extract(minute from a.hora))::integer,
 (extract(hour from a.hora)*60+extract(minute from a.hora))::integer+a.duracao-1) m where a.status<>'Cancelado';
-- A migration falha se houver sobreposições existentes: resolver em staging, não apagar histórico.
create function public.validar_agendamento() returns trigger language plpgsql security definer set search_path='' as $$
declare s public.servicos; cfg public.configuracoes; inicio integer;
begin
 if tg_op='UPDATE' and (new.owner_id,new.pet_id,new.servico,new.valor,new.duracao) is distinct from
 (old.owner_id,old.pet_id,old.servico,old.valor,old.duracao) then raise exception 'Dados históricos não podem ser alterados'; end if;
 if tg_op='UPDATE' and old.status='Concluído' and new.status<>'Concluído' then raise exception 'Atendimento concluído não pode ser reaberto'; end if;
 if tg_op='INSERT' then
  select * into s from public.servicos where owner_id=new.owner_id and nome=new.servico;
  if not found then raise exception 'Serviço não encontrado'; end if;
  new.duracao:=s.duracao;
 end if;
 if new.status='Cancelado' then return new; end if;
 select * into cfg from public.configuracoes where owner_id=new.owner_id;
 inicio:=extract(hour from new.hora)*60+extract(minute from new.hora);
 if extract(second from new.hora)<>0 or inicio%30<>0 or inicio<coalesce(cfg.horario_abertura,8)*60
 or inicio+new.duracao>coalesce(cfg.horario_fechamento,18)*60 then raise exception 'Horário fora do funcionamento'; end if;
 if (tg_op='INSERT' or (new.data,new.hora) is distinct from (old.data,old.hora))
 and new.data+new.hora < (now() at time zone 'America/Sao_Paulo') then raise exception 'Horário já passou'; end if;
 return new;
end $$;
create trigger validar_agendamento before insert or update on public.agendamentos for each row execute function public.validar_agendamento();
create function public.reservar_agendamento() returns trigger language plpgsql security definer set search_path='' as $$
declare inicio integer;
begin
 delete from public.agenda_slots where agendamento_id=new.id;
 if new.status<>'Cancelado' then
  inicio:=extract(hour from new.hora)*60+extract(minute from new.hora);
  insert into public.agenda_slots select new.owner_id,new.data,m,new.id from generate_series(inicio,inicio+new.duracao-1) m;
 end if;
 return new;
exception when unique_violation then raise exception 'Horário indisponível. Atualize a agenda e escolha outro horário.';
end $$;
create trigger reservar_agendamento after insert or update on public.agendamentos for each row execute function public.reservar_agendamento();
create index agendamentos_owner_data on public.agendamentos(owner_id,data);
create index vendas_owner_created on public.vendas(owner_id,created_at);
create index despesas_owner_data on public.despesas(owner_id,data);
do $$
declare f text;
begin
 foreach f in array array['registrar_venda(uuid,uuid,text,integer,numeric,text,uuid)','cancelar_venda(uuid)','ajustar_estoque(uuid,integer,uuid)','gerar_mensalidades(text)','cancelar_despesa(uuid)'] loop
 execute 'revoke all on function public.'||f||' from public,anon';
 execute 'grant execute on function public.'||f||' to authenticated';
 end loop;
end $$;
revoke all on function public.validar_agendamento(),public.reservar_agendamento(),public.estoque_inicial() from public,anon,authenticated;
