-- Estoque de produtos do petshop (ração, shampoo, acessórios...).
-- Segue o padrão das demais tabelas: cada linha pertence a um usuário (owner_id)
-- e o RLS garante que ninguém enxerga ou altera dados de outro petshop.

create table if not exists public.produtos (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome           text not null,
  categoria      text not null default '',
  quantidade     integer not null default 0 check (quantidade >= 0),
  estoque_minimo integer not null default 0 check (estoque_minimo >= 0),
  preco_custo    numeric(10, 2) not null default 0 check (preco_custo >= 0),
  preco_venda    numeric(10, 2) not null default 0 check (preco_venda >= 0),
  created_at     timestamptz not null default now()
);

create index if not exists produtos_owner_idx on public.produtos (owner_id);

alter table public.produtos enable row level security;

create policy "produtos: dono lê" on public.produtos
  for select using (owner_id = auth.uid());
create policy "produtos: dono insere" on public.produtos
  for insert with check (owner_id = auth.uid());
create policy "produtos: dono atualiza" on public.produtos
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "produtos: dono exclui" on public.produtos
  for delete using (owner_id = auth.uid());
