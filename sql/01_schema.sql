create extension if not exists pgcrypto;

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_day smallint not null check (workout_day between 1 and 4),
  workout_date date not null,
  duration_minutes integer not null default 40,
  memo text not null default '',
  status text not null default 'draft' check (status in ('draft','completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, workout_date, workout_day)
);

create table if not exists public.workout_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_key text not null,
  exercise_name text not null,
  weight_kg numeric(6,2),
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, exercise_key)
);

create table if not exists public.goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  target_weight_kg numeric(6,2),
  target_muscle_mass_kg numeric(6,2),
  target_body_fat_pct numeric(5,2),
  target_date date not null default '2026-12-31',
  updated_at timestamptz not null default now()
);

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(6,2),
  muscle_mass_kg numeric(6,2),
  body_fat_pct numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, measured_on)
);
