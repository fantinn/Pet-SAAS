-- Somente provisionamento administrativo pode associar número Twilio a petshop.
create table public.whatsapp_numeros (
 numero text primary key, owner_id uuid not null references public.petshops(owner_id),
 account_sid text not null, ativo boolean not null default false
);
create table public.whatsapp_fila (
 message_sid text primary key, owner_id uuid not null references public.petshops(owner_id),
 remetente text not null, destinatario text not null, nome text not null, corpo text not null check(length(corpo)<=4000),
 estado text not null default 'pendente' check(estado in ('pendente','processando','enviando','concluido','falha','incerto')),
 resposta text, outbound_sid text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index whatsapp_queue on public.whatsapp_fila(estado,created_at);
create index whatsapp_rate on public.whatsapp_fila(owner_id,remetente,created_at);
alter table public.whatsapp_numeros enable row level security;
alter table public.whatsapp_fila enable row level security;
revoke all on public.whatsapp_numeros,public.whatsapp_fila from public,anon,authenticated;
grant select,insert,update,delete on public.whatsapp_numeros,public.whatsapp_fila,public.whatsapp_conversas to service_role;
grant select,insert,update on public.clientes,public.pets,public.agendamentos to service_role;
grant select on public.servicos,public.configuracoes,public.petshops to service_role;

create function public.enfileirar_whatsapp(p_sid text,p_account text,p_from text,p_to text,p_nome text,p_corpo text)
returns void language plpgsql security definer set search_path='' as $$
declare o uuid;
begin
 select n.owner_id into o from public.whatsapp_numeros n join public.petshops p using(owner_id)
 where n.numero=p_to and n.account_sid=p_account and n.ativo and p.acesso<>'suspenso';
 if o is null then raise exception 'Número não provisionado'; end if;
 perform pg_advisory_xact_lock(hashtextextended(o::text,0));
 if exists(select 1 from public.whatsapp_fila where message_sid=p_sid) then return; end if;
 if (select count(*) from public.whatsapp_fila where owner_id=o and created_at>now()-interval '1 day')>=200
 or (select count(*) from public.whatsapp_fila where owner_id=o and remetente=p_from and created_at>now()-interval '10 minutes')>=10
 then raise exception 'Limite de mensagens atingido'; end if;
 insert into public.whatsapp_fila(message_sid,owner_id,remetente,destinatario,nome,corpo)
 values(p_sid,o,p_from,p_to,left(p_nome,200),p_corpo);
end $$;
create function public.claim_whatsapp() returns public.whatsapp_fila language plpgsql security definer set search_path='' as $$
declare job public.whatsapp_fila;
begin
 -- Lock curto: uma conversa por vez mesmo com workers concorrentes.
 perform pg_advisory_xact_lock(73100421);
 select * into job from public.whatsapp_fila q where q.estado='pendente'
 and not exists(select 1 from public.whatsapp_fila busy where busy.owner_id=q.owner_id
 and busy.remetente=q.remetente and busy.estado in ('processando','enviando','incerto'))
 order by created_at limit 1 for update skip locked;
 if job.message_sid is null then return null; end if;
 update public.whatsapp_fila set estado='processando',updated_at=now() where message_sid=job.message_sid returning * into job;
 return job;
end $$;
revoke all on function public.enfileirar_whatsapp(text,text,text,text,text,text),public.claim_whatsapp() from public,anon,authenticated;
grant execute on function public.enfileirar_whatsapp(text,text,text,text,text,text),public.claim_whatsapp() to service_role;
