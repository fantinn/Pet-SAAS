create table public.petshops (
 owner_id uuid primary key references auth.users(id), nome text not null check(length(trim(nome)) between 1 and 200),
 timezone text not null default 'America/Sao_Paulo' check(timezone='America/Sao_Paulo'),
 acesso text not null default 'piloto' check(acesso in ('piloto','ativo','suspenso')),
 limite_membros integer not null default 5 check(limite_membros between 1 and 100),
 cobranca_externa boolean not null default false check(not cobranca_externa),
 created_at timestamptz not null default now()
);
create table public.membros (
 user_id uuid primary key references auth.users(id), owner_id uuid not null references public.petshops(owner_id),
 papel text not null check(papel in ('proprietario','administrador','atendente')),
 unique(owner_id,user_id), check((papel='proprietario')=(user_id=owner_id))
);
-- Preserva o identificador dos proprietários que já possuem registros.
insert into public.petshops(owner_id,nome)
select owner_id,'Meu petshop' from (
 select owner_id from public.clientes union select owner_id from public.pets
 union select owner_id from public.servicos union select owner_id from public.planos
 union select owner_id from public.assinaturas union select owner_id from public.agendamentos
 union select owner_id from public.vendas union select owner_id from public.despesas
 union select owner_id from public.vacinas union select owner_id from public.mensalidades
 union select owner_id from public.configuracoes union select owner_id from public.produtos
 union select owner_id from public.whatsapp_conversas
) owners;
insert into public.membros select owner_id,owner_id,'proprietario' from public.petshops;

create function public.current_owner() returns uuid language sql stable security definer set search_path='' as $$
 select m.owner_id from public.membros m join public.petshops p using(owner_id)
 where m.user_id=auth.uid() and p.acesso in ('piloto','ativo')
$$;
create function public.is_manager() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.membros where user_id=auth.uid()
 and owner_id=public.current_owner() and papel in ('proprietario','administrador'))
$$;
create function public.workspace() returns jsonb language sql stable security definer set search_path='' as $$
 select to_jsonb(p) || jsonb_build_object('papel',m.papel)
 from public.membros m join public.petshops p using(owner_id) where m.user_id=auth.uid()
$$;
create function public.criar_petshop(p_nome text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre na sua conta'; end if;
 if exists(select 1 from public.membros where user_id=auth.uid()) then raise exception 'Conta já vinculada'; end if;
 insert into public.petshops(owner_id,nome) values(auth.uid(),trim(p_nome));
 insert into public.membros values(auth.uid(),auth.uid(),'proprietario');
 insert into public.configuracoes(owner_id) values(auth.uid());
end $$;

create table public.convites (
 token uuid primary key default gen_random_uuid(), owner_id uuid not null references public.petshops(owner_id),
 email text not null check(length(email) between 3 and 254), papel text not null check(papel in ('administrador','atendente')),
 expira_em timestamptz not null default now()+interval '7 days'
);
create function public.convidar(p_email text,p_papel text) returns uuid language plpgsql security definer set search_path='' as $$
declare token uuid;
begin
 if not public.is_manager() then raise exception 'Sem permissão'; end if;
 if p_papel='administrador' and auth.uid()<>public.current_owner() then raise exception 'Somente o proprietário pode convidar administradores'; end if;
 insert into public.convites(owner_id,email,papel) values(public.current_owner(),lower(trim(p_email)),p_papel) returning convites.token into token;
 return token;
end $$;
create function public.aceitar_convite(p_token uuid) returns void language plpgsql security definer set search_path='' as $$
declare convite public.convites; loja public.petshops;
begin
 select * into convite from public.convites where token=p_token and expira_em>now() for update;
 if not found or not exists(select 1 from auth.users where id=auth.uid() and lower(email)=convite.email and email_confirmed_at is not null)
 then raise exception 'Convite inválido ou e-mail não confirmado'; end if;
 select * into loja from public.petshops where owner_id=convite.owner_id for update;
 if loja.acesso='suspenso' then raise exception 'Petshop suspenso'; end if;
 if (select count(*) from public.membros where owner_id=loja.owner_id)>=loja.limite_membros then raise exception 'Limite de membros atingido'; end if;
 insert into public.membros values(auth.uid(),loja.owner_id,convite.papel);
 delete from public.convites where token=p_token;
end $$;
create function public.remover_membro(p_user uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is distinct from public.current_owner() then raise exception 'Somente proprietário'; end if;
 if p_user=auth.uid() then raise exception 'Não é possível remover o proprietário'; end if;
 delete from public.membros where user_id=p_user and owner_id=public.current_owner();
end $$;

-- Instala políticas explícitas; remove políticas antigas que poderiam ampliar acesso.
do $$
declare t text; pol record; management boolean;
begin
 foreach t in array array['clientes','pets','servicos','planos','assinaturas','agendamentos','vendas','despesas','vacinas','mensalidades','configuracoes','produtos','whatsapp_conversas'] loop
  execute format('alter table public.%I enable row level security',t);
  for pol in select policyname from pg_policies where schemaname='public' and tablename=t loop
   execute format('drop policy %I on public.%I',pol.policyname,t);
  end loop;
  execute format('alter table public.%I alter column owner_id set default public.current_owner()',t);
  execute format('create index if not exists %I on public.%I(owner_id)',t||'_tenant_idx',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  if t='whatsapp_conversas' then continue; end if;
  execute format('grant select,insert,update,delete on public.%I to authenticated',t);
  management := t in ('despesas','mensalidades','assinaturas');
  execute format('create policy tenant_read on public.%I for select to authenticated using (owner_id=public.current_owner()%s)',t,
   case when management then ' and public.is_manager()' else '' end);
  management := t in ('servicos','planos','despesas','mensalidades','assinaturas','configuracoes','produtos');
  execute format('create policy tenant_write on public.%I for insert to authenticated with check (owner_id=public.current_owner()%s)',t,
   case when management then ' and public.is_manager()' else '' end);
  execute format('create policy tenant_update on public.%I for update to authenticated using (owner_id=public.current_owner()%s) with check (owner_id=public.current_owner()%s)',t,
   case when management then ' and public.is_manager()' else '' end,case when management then ' and public.is_manager()' else '' end);
  execute format('create policy tenant_delete on public.%I for delete to authenticated using (owner_id=public.current_owner() and public.is_manager())',t);
 end loop;
end $$;
alter table public.petshops enable row level security;
alter table public.membros enable row level security;
alter table public.convites enable row level security;
revoke all on public.petshops,public.membros,public.convites from anon,authenticated;
grant select on public.membros to authenticated;
create policy member_read on public.membros for select to authenticated using(owner_id=public.current_owner() and public.is_manager());
-- No direct client mutation of workspace access or billing state.
do $$
declare f text;
begin
 foreach f in array array['current_owner()','is_manager()','workspace()','criar_petshop(text)','convidar(text,text)','aceitar_convite(uuid)','remover_membro(uuid)'] loop
 execute 'revoke all on function public.'||f||' from public,anon';
 execute 'grant execute on function public.'||f||' to authenticated';
 end loop;
end $$;
