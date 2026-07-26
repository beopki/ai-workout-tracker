alter table public.workout_sessions enable row level security;
alter table public.workout_entries enable row level security;
alter table public.goals enable row level security;
alter table public.body_measurements enable row level security;

create policy "sessions_own" on public.workout_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "entries_own" on public.workout_entries
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals_own" on public.goals
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "measurements_own" on public.body_measurements
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
