-- ============================================================
-- MoodTrack — Schéma Supabase
-- Exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

-- 1. Table profiles (liée à auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Table moods
create table if not exists public.moods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  score smallint not null check (score >= 1 and score <= 10),
  comment text,
  created_at timestamptz not null default now()
);

-- 3. Index pour les requêtes fréquentes
create index if not exists moods_user_id_created_at on public.moods(user_id, created_at desc);

-- 4. Row Level Security
alter table public.profiles enable row level security;
alter table public.moods enable row level security;

-- Profiles : chacun voit et modifie son propre profil ; les admins voient tout
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_select_admin" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Moods : chacun voit et modifie uniquement ses propres entrées
create policy "moods_select_own" on public.moods
  for select using (auth.uid() = user_id);

create policy "moods_insert_own" on public.moods
  for insert with check (auth.uid() = user_id);

create policy "moods_update_own" on public.moods
  for update using (auth.uid() = user_id);

create policy "moods_delete_own" on public.moods
  for delete using (auth.uid() = user_id);

-- 5. Trigger : créer automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Créer le premier admin manuellement après inscription :
-- UPDATE public.profiles SET is_admin = true WHERE email = 'votre@email.com';
