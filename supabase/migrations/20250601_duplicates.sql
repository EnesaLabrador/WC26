-- ============================================
-- Migración: Tabla de Repetidos
-- ============================================

create table if not exists public.user_duplicate_stickers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  sticker_code text not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, sticker_code)
);

alter table public.user_duplicate_stickers enable row level security;

-- Borrar políticas previas si existen
drop policy if exists "Users can view own and friends duplicates" on public.user_duplicate_stickers;
drop policy if exists "Users can insert own duplicates" on public.user_duplicate_stickers;
drop policy if exists "Users can update own duplicates" on public.user_duplicate_stickers;
drop policy if exists "Users can delete own duplicates" on public.user_duplicate_stickers;

-- Permitir ver repetidos propios y de amigos
-- Reutiliza la función public.is_friend() definida en la migración anterior
create policy "Users can view own and friends duplicates" on public.user_duplicate_stickers
  for select using (
    auth.uid() = user_id or public.is_friend(user_id)
  );

-- Solo insertar los propios
create policy "Users can insert own duplicates" on public.user_duplicate_stickers
  for insert with check (auth.uid() = user_id);

-- Solo actualizar los propios
create policy "Users can update own duplicates" on public.user_duplicate_stickers
  for update using (auth.uid() = user_id);

-- Solo borrar los propios
create policy "Users can delete own duplicates" on public.user_duplicate_stickers
  for delete using (auth.uid() = user_id);
