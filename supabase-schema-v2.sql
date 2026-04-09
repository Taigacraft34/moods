-- ============================================================
-- MoodTrack v2 — Ajouts à exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Table journal (carnet de bord)
create table if not exists public.journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  content text not null,
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, entry_date)
);

create index if not exists journal_user_date on public.journal(user_id, entry_date desc);

alter table public.journal enable row level security;

create policy "journal_select_own" on public.journal for select using (auth.uid() = user_id);
create policy "journal_insert_own" on public.journal for insert with check (auth.uid() = user_id);
create policy "journal_update_own" on public.journal for update using (auth.uid() = user_id);
create policy "journal_delete_own" on public.journal for delete using (auth.uid() = user_id);

-- 2. Modifier la table moods : ajouter entry_time + autoriser plusieurs par jour
-- Supprimer l'ancienne contrainte si elle existe
alter table public.moods add column if not exists entry_time time not null default current_time;

-- L'unicité par jour n'existe plus (plusieurs humeurs/jour autorisées)
-- Si vous aviez un index unique sur (user_id, date), supprimez-le :
-- drop index if exists moods_user_day_unique;

