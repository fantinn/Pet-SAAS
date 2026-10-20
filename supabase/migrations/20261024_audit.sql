-- Histórico de alterações financeiras, acessível apenas à gestão.
create table public.auditoria (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null, actor_id uuid,
 tabela text not null, registro_id uuid not null, operacao text not null,
 antes jsonb, depois jsonb, created_at timestamptz not null default now()
);
alter table public.auditoria enable row level security;
revoke all on public.auditoria from public,anon,authenticated;
grant select on public.auditoria to authenticated;
create policy audit_read on public.auditoria for select to authenticated using(owner_id=public.current_owner() and public.is_manager());
create function public.auditar_operacao() returns trigger language plpgsql security definer set search_path='' as $$
declare a jsonb; d jsonb;
begin
 -- Lista permitida: nunca copiar nome, telefone, observações ou conversas para logs.
 a:=case when tg_op='INSERT' then null else jsonb_build_object('valor',to_jsonb(old)->'valor','status',to_jsonb(old)->'status','cancelada_em',to_jsonb(old)->'cancelada_em','data_pagamento',to_jsonb(old)->'data_pagamento') end;
 d:=jsonb_build_object('valor',to_jsonb(new)->'valor','status',to_jsonb(new)->'status','cancelada_em',to_jsonb(new)->'cancelada_em','data_pagamento',to_jsonb(new)->'data_pagamento');
 insert into public.auditoria(owner_id,actor_id,tabela,registro_id,operacao,antes,depois) values(new.owner_id,auth.uid(),tg_table_name,new.id,tg_op,a,d);
 return new;
end $$;
create trigger audit_vendas after insert or update on public.vendas for each row execute function public.auditar_operacao();
create trigger audit_despesas after insert or update on public.despesas for each row execute function public.auditar_operacao();
create trigger audit_mensalidades after insert or update on public.mensalidades for each row execute function public.auditar_operacao();
create trigger audit_agendamentos after insert or update on public.agendamentos for each row execute function public.auditar_operacao();
revoke all on function public.auditar_operacao() from public,anon,authenticated;
revoke update on public.mensalidades,public.assinaturas,public.despesas from authenticated;
revoke insert on public.mensalidades from authenticated;
grant update(status,data_pagamento) on public.mensalidades to authenticated;
grant update(cancelada_em) on public.assinaturas to authenticated;
-- Uma ação de criação por mensagem evita repetir a mutação se o modelo repetir a chamada.
alter table public.pets add column whatsapp_request text;
alter table public.pets add constraint pets_whatsapp_request unique(owner_id,whatsapp_request);
alter table public.agendamentos add column whatsapp_request text;
alter table public.agendamentos add constraint ag_whatsapp_request unique(owner_id,whatsapp_request);
