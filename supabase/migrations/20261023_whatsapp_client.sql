create index clientes_phone_lookup on public.clientes(owner_id,(regexp_replace(telefone,'\D','','g')));
create function public.cliente_whatsapp(p_owner uuid,p_telefone text,p_nome text) returns uuid
language plpgsql security definer set search_path='' as $$
declare c uuid;
begin
 if not exists(select 1 from public.petshops where owner_id=p_owner and acesso<>'suspenso') then raise exception 'Petshop indisponível'; end if;
 if p_telefone !~ '^\d{8,15}$' then raise exception 'Telefone inválido'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text||p_telefone,0));
 select id into c from public.clientes where owner_id=p_owner and regexp_replace(telefone,'\D','','g')=p_telefone order by created_at,id limit 1;
 if c is null then insert into public.clientes(owner_id,nome,telefone) values(p_owner,left(p_nome,200),p_telefone) returning id into c; end if;
 return c;
end $$;
revoke all on function public.cliente_whatsapp(uuid,text,text) from public,anon,authenticated;
grant execute on function public.cliente_whatsapp(uuid,text,text) to service_role;
