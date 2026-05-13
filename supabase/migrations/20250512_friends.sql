-- ============================================
-- Migración: Sistema de Amigos y Permisos
-- ============================================

-- 1. Tabla de perfiles públicos
-- Necesaria para poder buscar usuarios por email y mantener
-- una referencia pública sin exponer auth.users.
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

-- Borrar política previa si existe
drop policy if exists "Profiles are viewable by everyone" on public.profiles;

-- Permitir que cualquiera vea perfiles (necesario para buscar amigos,
-- aunque la lógica sensible se hace vía RPC).
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

-- 2. Trigger para crear perfil automáticamente al registrarse
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Evitar error si el trigger ya existe
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rellenar perfiles de usuarios existentes (ejecutar una vez)
-- ============================================
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- 3. Tabla de solicitudes de amistad
-- ============================================
create table if not exists public.friend_requests (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now() not null,
  responded_at timestamptz,
  unique (sender_id, receiver_id)
);

alter table public.friend_requests enable row level security;

-- Borrar políticas previas si existen
drop policy if exists "Users can view their own friend requests" on public.friend_requests;
drop policy if exists "Users can send friend requests" on public.friend_requests;
drop policy if exists "Receivers can update friend requests" on public.friend_requests;

-- Políticas de solicitudes
create policy "Users can view their own friend requests" on public.friend_requests
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send friend requests" on public.friend_requests
  for insert with check (auth.uid() = sender_id);

create policy "Receivers can update friend requests" on public.friend_requests
  for update using (auth.uid() = receiver_id);

-- 4. Tabla de amistades (relación bidireccional)
-- ============================================
create table if not exists public.friendships (
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (user_id, friend_id)
);

alter table public.friendships enable row level security;

-- Borrar política previa si existe
drop policy if exists "Users can view their own friendships" on public.friendships;

create policy "Users can view their own friendships" on public.friendships
  for select using (auth.uid() = user_id);

-- 5. Helper para comprobar amistad (usado en RLS de user_stickers)
-- ============================================
create or replace function public.is_friend(check_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.friendships
    where user_id = auth.uid() and friend_id = check_user_id
  );
end;
$$ language plpgsql security definer;

-- 6. Políticas RLS para user_stickers
-- ============================================
alter table public.user_stickers enable row level security;

-- Borrar políticas previas si existen para evitar duplicados
drop policy if exists "Users can view own and friends stickers" on public.user_stickers;
drop policy if exists "Users can insert own stickers" on public.user_stickers;
drop policy if exists "Users can delete own stickers" on public.user_stickers;

-- Permitir ver cromos propios y de amigos
create policy "Users can view own and friends stickers" on public.user_stickers
  for select using (
    auth.uid() = user_id or public.is_friend(user_id)
  );

create policy "Users can insert own stickers" on public.user_stickers
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own stickers" on public.user_stickers
  for delete using (auth.uid() = user_id);

-- 7. Funciones RPC para gestionar amistades
-- ============================================

-- Enviar solicitud de amistad por email
create or replace function public.send_friend_request(friend_email text)
returns json as $$
declare
  target_id uuid;
  existing_status text;
begin
  -- Buscar usuario destino
  select id into target_id from public.profiles where email = friend_email;

  if target_id is null then
    return json_build_object('success', false, 'message', 'No se encontró ningún usuario con ese email.');
  end if;

  if target_id = auth.uid() then
    return json_build_object('success', false, 'message', 'No puedes enviarte una solicitud a ti mismo.');
  end if;

  -- Comprobar si ya son amigos
  if exists (
    select 1 from public.friendships
    where user_id = auth.uid() and friend_id = target_id
  ) then
    return json_build_object('success', false, 'message', 'Ya sois amigos.');
  end if;

  -- Comprobar solicitud existente enviada por mí
  select status into existing_status from public.friend_requests
  where sender_id = auth.uid() and receiver_id = target_id;

  if existing_status is not null then
    if existing_status = 'pending' then
      return json_build_object('success', false, 'message', 'Ya has enviado una solicitud a esta persona.');
    elsif existing_status = 'accepted' then
      return json_build_object('success', false, 'message', 'Ya sois amigos.');
    elsif existing_status = 'rejected' then
      update public.friend_requests
      set status = 'pending', created_at = now(), responded_at = null
      where sender_id = auth.uid() and receiver_id = target_id;
      return json_build_object('success', true, 'message', 'Solicitud reenviada.');
    end if;
  end if;

  -- Comprobar solicitud existente enviada por el otro (aceptar automáticamente)
  select status into existing_status from public.friend_requests
  where sender_id = target_id and receiver_id = auth.uid();

  if existing_status = 'pending' then
    update public.friend_requests
    set status = 'accepted', responded_at = now()
    where sender_id = target_id and receiver_id = auth.uid();

    insert into public.friendships (user_id, friend_id) values (auth.uid(), target_id);
    insert into public.friendships (user_id, friend_id) values (target_id, auth.uid());

    return json_build_object('success', true, 'message', 'Solicitud aceptada automáticamente.');
  end if;

  -- Crear nueva solicitud
  insert into public.friend_requests (sender_id, receiver_id)
  values (auth.uid(), target_id);

  return json_build_object('success', true, 'message', 'Solicitud enviada.');
end;
$$ language plpgsql security definer;

-- Aceptar solicitud de amistad
create or replace function public.accept_friend_request(request_id uuid)
returns void as $$
declare
  req_sender_id uuid;
  req_receiver_id uuid;
begin
  select sender_id, receiver_id into req_sender_id, req_receiver_id
  from public.friend_requests
  where id = request_id and receiver_id = auth.uid() and status = 'pending';

  if req_sender_id is null then
    raise exception 'Solicitud no encontrada o no autorizado.';
  end if;

  update public.friend_requests
  set status = 'accepted', responded_at = now()
  where id = request_id;

  insert into public.friendships (user_id, friend_id)
  values (req_receiver_id, req_sender_id)
  on conflict do nothing;

  insert into public.friendships (user_id, friend_id)
  values (req_sender_id, req_receiver_id)
  on conflict do nothing;
end;
$$ language plpgsql security definer;

-- Rechazar solicitud de amistad
create or replace function public.reject_friend_request(request_id uuid)
returns void as $$
begin
  update public.friend_requests
  set status = 'rejected', responded_at = now()
  where id = request_id and receiver_id = auth.uid() and status = 'pending';

  if not found then
    raise exception 'Solicitud no encontrada o no autorizado.';
  end if;
end;
$$ language plpgsql security definer;
