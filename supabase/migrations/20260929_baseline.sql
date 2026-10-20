-- Baseline inferido do frontend. Para instalações existentes, reconciliar antes de aplicar.
create table if not exists public.clientes (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 nome text not null check (length(trim(nome)) between 1 and 200), telefone text not null default '',
 created_at timestamptz not null default now(), unique(owner_id,id)
);
create table if not exists public.pets (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 cliente_id uuid not null, nome text not null check(length(trim(nome)) between 1 and 200),
 especie text not null default 'Cachorro', raca text not null default '', porte text not null default 'Médio',
 observacoes text not null default '', unique(owner_id,id),
 foreign key(owner_id,cliente_id) references public.clientes(owner_id,id) on delete restrict
);
create table if not exists public.servicos (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 nome text not null check(length(trim(nome)) between 1 and 200), preco numeric(12,2) not null check(preco>=0),
 preco_pequeno numeric(12,2) not null check(preco_pequeno>=0), preco_grande numeric(12,2) not null check(preco_grande>=0),
 duracao integer not null check(duracao between 1 and 720), unique(owner_id,nome), unique(owner_id,id)
);
create table if not exists public.planos (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 slug text not null, nome text not null check(length(trim(nome))>0), descricao text not null default '',
 preco numeric(12,2) not null check(preco>=0), unique(owner_id,slug), unique(owner_id,id)
);
create table if not exists public.assinaturas (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 cliente_id uuid not null, plano_id uuid not null, data_inicio date not null, cancelada_em date,
 unique(owner_id,id),
 foreign key(owner_id,cliente_id) references public.clientes(owner_id,id) on delete restrict,
 foreign key(owner_id,plano_id) references public.planos(owner_id,id) on delete restrict
);
create table if not exists public.agendamentos (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 pet_id uuid not null, servico text not null, data date not null, hora time not null,
 status text not null default 'Agendado' check(status in ('Agendado','Concluído','Cancelado')),
 valor numeric(12,2) not null check(valor>=0), unique(owner_id,id),
 foreign key(owner_id,pet_id) references public.pets(owner_id,id) on delete restrict
);
create table if not exists public.vendas (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 cliente_id uuid, item text not null check(length(trim(item))>0), qtd integer not null check(qtd>0),
 valor numeric(12,2) not null check(valor>=0),
 forma_pagamento text not null check(forma_pagamento in ('Pix','Dinheiro','Cartão')),
 created_at timestamptz not null default now(), unique(owner_id,id),
 foreign key(owner_id,cliente_id) references public.clientes(owner_id,id) on delete restrict
);
create table if not exists public.despesas (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 descricao text not null check(length(trim(descricao))>0), valor numeric(12,2) not null check(valor>0), data date not null
);
create table if not exists public.vacinas (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 pet_id uuid not null, nome text not null check(length(trim(nome))>0), data_aplicacao date not null, proxima_dose date,
 check(proxima_dose is null or proxima_dose>=data_aplicacao),
 foreign key(owner_id,pet_id) references public.pets(owner_id,id) on delete restrict
);
create table if not exists public.mensalidades (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 assinatura_id uuid not null, mes_ref text not null check(mes_ref ~ '^\d{4}-(0[1-9]|1[0-2])$'),
 valor numeric(12,2) not null check(valor>=0), status text not null default 'Pendente' check(status in ('Pendente','Pago')),
 data_pagamento date, unique(owner_id,assinatura_id,mes_ref),
 check((status='Pago')=(data_pagamento is not null)),
 foreign key(owner_id,assinatura_id) references public.assinaturas(owner_id,id) on delete restrict
);
create table if not exists public.configuracoes (
 owner_id uuid primary key default auth.uid() references auth.users(id),
 horario_abertura integer not null default 8 check(horario_abertura>=0),
 horario_fechamento integer not null default 18 check(horario_fechamento<=24),
 check(horario_abertura<horario_fechamento)
);
create table if not exists public.whatsapp_conversas (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 telefone text not null, cliente_id uuid not null, mensagens jsonb not null default '[]',
 updated_at timestamptz not null default now(), unique(owner_id,telefone),
 foreign key(owner_id,cliente_id) references public.clientes(owner_id,id) on delete restrict
);
-- Fechado desde o baseline, inclusive se uma migration posterior falhar.
do $$
declare t text;
begin
 foreach t in array array['clientes','pets','servicos','planos','assinaturas','agendamentos','vendas','despesas','vacinas','mensalidades','configuracoes','whatsapp_conversas'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
 end loop;
end $$;
