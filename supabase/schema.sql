-- PUX Dashboard minimal schema
-- Run in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.pux_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_url text,
  product_line text not null,
  po_name text not null,
  join_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stage_progress (
  id uuid primary key default gen_random_uuid(),
  pux_id uuid not null references public.pux_members(id) on delete cascade,
  stage_number int not null check (stage_number between 1 and 3),
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  progress int not null default 0 check (progress between 0 and 100),
  notes text,
  is_current boolean not null default false,
  start_date date,
  completed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pux_id, stage_number)
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  pux_id uuid not null references public.pux_members(id) on delete cascade,
  title text not null,
  description text,
  date date,
  created_at timestamptz not null default now()
);

-- PUX + PO 双反馈入口
create table if not exists public.feedback_entries (
  id uuid primary key default gen_random_uuid(),
  pux_id uuid not null references public.pux_members(id) on delete cascade,
  source text not null check (source in ('pux', 'po')),
  stage_number int check (stage_number between 1 and 3),
  project text,
  execution_process text,
  collaboration_feedback text,
  conclusion text,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_stage_progress_pux_id on public.stage_progress(pux_id);
create index if not exists idx_milestones_pux_id on public.milestones(pux_id);
create index if not exists idx_feedback_entries_pux_id on public.feedback_entries(pux_id);

alter table public.pux_members enable row level security;
alter table public.stage_progress enable row level security;
alter table public.milestones enable row level security;
alter table public.feedback_entries enable row level security;

drop policy if exists "Allow read for all users on pux_members" on public.pux_members;
create policy "Allow read for all users on pux_members"
  on public.pux_members for select using (true);

drop policy if exists "Allow read for all users on stage_progress" on public.stage_progress;
create policy "Allow read for all users on stage_progress"
  on public.stage_progress for select using (true);

drop policy if exists "Allow read for all users on milestones" on public.milestones;
create policy "Allow read for all users on milestones"
  on public.milestones for select using (true);

drop policy if exists "Allow read for all users on feedback_entries" on public.feedback_entries;
create policy "Allow read for all users on feedback_entries"
  on public.feedback_entries for select using (true);

drop policy if exists "Allow write for all users on pux_members" on public.pux_members;
create policy "Allow write for all users on pux_members"
  on public.pux_members for all using (true) with check (true);

drop policy if exists "Allow write for all users on stage_progress" on public.stage_progress;
create policy "Allow write for all users on stage_progress"
  on public.stage_progress for all using (true) with check (true);

drop policy if exists "Allow write for all users on milestones" on public.milestones;
create policy "Allow write for all users on milestones"
  on public.milestones for all using (true) with check (true);

drop policy if exists "Allow write for all users on feedback_entries" on public.feedback_entries;
create policy "Allow write for all users on feedback_entries"
  on public.feedback_entries for all using (true) with check (true);
